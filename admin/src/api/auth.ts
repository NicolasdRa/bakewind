/**
 * Authentication API
 *
 * Handles all authentication-related API calls
 */

import { apiClient } from './client';
import { logger } from '../utils/logger';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface TrialSignupData {
  businessName: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  locations: string;
  agreeToTerms: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  businessName: string;
  role: string;
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled';
  trialEndsAt: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}

/**
 * Get current user profile
 */
export async function getProfile(): Promise<UserProfile> {
  logger.auth('Fetching user profile...');
  return apiClient.get<UserProfile>('/auth/me');
}

/**
 * Login user
 */
export async function login(credentials: LoginCredentials): Promise<{ user: UserProfile }> {
  logger.auth(`Logging in user: ${credentials.email}`);
  return apiClient.post<{ user: UserProfile }>('/auth/login', credentials);
}

/**
 * Register new user
 */
export async function register(data: RegisterData): Promise<{ user: UserProfile }> {
  logger.auth(`Registering new user: ${data.email}`);
  return apiClient.post<{ user: UserProfile }>('/auth/register', data);
}

/**
 * Trial signup
 */
export async function trialSignup(data: TrialSignupData): Promise<{ user: UserProfile }> {
  logger.auth(`Trial signup for: ${data.email}`);
  return apiClient.post<{ user: UserProfile }>('/auth/trial-signup', data);
}

/**
 * Logout user
 * Clears server-side session and httpOnly cookies
 *
 * Note: Navigation is handled by the caller (authStore) using the router
 */
export async function logout(): Promise<void> {
  logger.auth('Logging out user...');
  logger.auth('Cookies before logout:', document.cookie);
  const response = await apiClient.post('/auth/logout');
  logger.auth('Logout API response:', response);
  logger.auth('Logout successful');
  // Navigation is handled by the caller
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<void> {
  logger.auth('Refreshing access token...');
  return apiClient.post('/auth/refresh');
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<void> {
  logger.auth(`Requesting password reset for: ${email}`);
  return apiClient.post('/auth/forgot-password', { email });
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  logger.auth('Resetting password with token');
  return apiClient.post('/auth/reset-password', { token, password: newPassword });
}
