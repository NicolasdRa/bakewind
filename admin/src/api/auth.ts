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

export type UserRole = 'ADMIN' | 'OWNER' | 'STAFF' | 'CUSTOMER';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'incomplete';
export type StaffArea = 'cafe' | 'restaurant' | 'front_house' | 'catering' | 'retail' | 'events' | 'management' | 'bakery' | 'patisserie';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  phoneNumber?: string | null;
  country?: string | null;
  city?: string | null;
  bio?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  profilePictureUrl?: string | null;
  createdAt: string;
  locationId?: string[];  // User's assigned location IDs
}

export interface TenantContext {
  id: string;
  businessName: string;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  onboardingCompleted: boolean;
}

export interface StaffContext {
  id: string;
  tenantId: string;
  position: string | null;
  department: string | null;
  areas: StaffArea[];
}

export interface AuthResponse {
  user: UserProfile;
  tenant: TenantContext | null;
  staff: StaffContext | null;
  expiresIn: string;
}

export interface ProfileResponse extends UserProfile {
  tenant: TenantContext | null;
  staff: StaffContext | null;
}

/**
 * Get current user profile (includes tenant and staff context)
 */
export async function getProfile(): Promise<ProfileResponse> {
  logger.auth('Fetching user profile...');
  return apiClient.get<ProfileResponse>('/auth/me');
}

/**
 * Login user (returns user, tenant, and staff context)
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  logger.auth(`Logging in user: ${credentials.email}`);
  return apiClient.post<AuthResponse>('/auth/login', credentials);
}

/**
 * Register new user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  logger.auth(`Registering new user: ${data.email}`);
  return apiClient.post<AuthResponse>('/auth/register', data);
}

/**
 * Trial signup (creates OWNER user with tenant)
 */
export async function trialSignup(data: TrialSignupData): Promise<AuthResponse> {
  logger.auth(`Trial signup for: ${data.email}`);
  return apiClient.post<AuthResponse>('/auth/trial-signup', data);
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
