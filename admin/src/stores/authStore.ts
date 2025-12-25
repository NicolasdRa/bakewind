/**
 * Authentication Store - Pure State Logic
 *
 * This file contains only the state management logic without any UI/Context concerns.
 * It can be tested independently and reused in different contexts.
 */

import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import * as authApi from '../api/auth';
import { logger } from '../utils/logger';

// Types
export type UserRole = 'ADMIN' | 'OWNER' | 'STAFF' | 'CUSTOMER';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled';
export type UserArea = 'cafe' | 'restaurant' | 'front_house' | 'catering' | 'retail' | 'events';

// Slim user - pure auth/identity (matches refactored backend schema)
export interface User {
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
  createdAt: string;
  locationId?: string[];  // User's assigned location IDs
}

// Tenant info for OWNER users (fetched separately when needed)
export interface Tenant {
  id: string;
  businessName: string;
  businessPhone?: string | null;
  businessAddress?: string | null;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  onboardingCompleted: boolean;
}

// Staff info for STAFF users (fetched separately when needed)
export interface Staff {
  id: string;
  tenantId: string;
  position?: string | null;
  department?: string | null;
  areas: UserArea[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Factory function to create auth store instance
export function createAuthStore() {
  // Internal state
  const [state, setState] = createStore<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const [isInitialized, setIsInitialized] = createSignal(false);

  // Public API
  return {
    // Getters
    get state() {
      return state;
    },

    get user() {
      return state.user;
    },

    get isAuthenticated() {
      return state.isAuthenticated;
    },

    get isLoading() {
      return state.isLoading;
    },

    get error() {
      return state.error;
    },

    get isInitialized() {
      return isInitialized();
    },

    // Actions
    async initialize() {
      if (isInitialized()) {
        logger.auth('Already initialized, skipping');
        return;
      }

      logger.auth('Starting initialization...');
      setState('isLoading', true);
      setState('error', null);

      try {
        // Try to fetch profile using cookies (no localStorage needed)
        logger.auth('Checking authentication via cookies...');
        const profile = await authApi.getProfile();
        logger.auth(`Profile loaded: ${profile.email}`);
        setState('user', profile);
        setState('isAuthenticated', true);
      } catch (error) {
        // Not authenticated or cookies expired
        logger.auth('No valid session found');
        setState('user', null);
        setState('isAuthenticated', false);
      } finally {
        setState('isLoading', false);
        setIsInitialized(true);
        logger.auth(`Initialization complete. isAuthenticated: ${state.isAuthenticated}`);
      }
    },

    login(user: Partial<User>) {
      // This is called when redirected from auth pages after successful login
      // Cookies are already set by the API, no need to manage tokens here

      const partialUser: User = {
        id: user.id || '',
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role || 'CUSTOMER',
        isActive: user.isActive ?? true,
        isEmailVerified: user.isEmailVerified ?? false,
        phoneNumber: user.phoneNumber,
        country: user.country,
        city: user.city,
        createdAt: user.createdAt || new Date().toISOString(),
        locationId: user.locationId || [],
      };

      // Set all state SYNCHRONOUSLY so components see authenticated user immediately
      setState('user', partialUser);
      setState('isAuthenticated', true);
      setState('isLoading', false);
      setState('error', null);
      setIsInitialized(true);

      logger.auth(`Auth callback complete - user authenticated: ${partialUser.email}`);
    },

    async logout(navigate?: (path: string) => void) {
      logger.auth('Starting logout...');
      setState('isLoading', true);

      try {
        // Call API first BEFORE clearing state (cookies need to be sent)
        await authApi.logout();
        logger.auth('Logout API call successful');
      } catch (error: any) {
        logger.error('Logout API call failed, but continuing with client-side logout', error);
        logger.error('Error details:', {
          status: error?.status,
          message: error?.message,
          data: error?.data,
        });
      }

      // Clear state after API call
      this.clearAuth();

      // Navigate to login page using router (SPA navigation, no reload)
      if (navigate) {
        logger.auth('Navigating to login page via router');
        navigate('/login');
      } else {
        logger.warn('No navigate function provided, falling back to window.location');
        window.location.href = '/login';
      }
    },

    clearAuth() {
      setState('user', null);
      setState('isAuthenticated', false);
      setState('error', null);
      // No need to clear tokens - they're in httpOnly cookies managed by the server
    },

    setError(error: string) {
      setState('error', error);
    },

    clearError() {
      setState('error', null);
    },

    async refreshProfile() {
      if (!state.isAuthenticated) return;

      try {
        const profile = await authApi.getProfile();
        setState('user', profile);
      } catch (error) {
        logger.error('Profile refresh failed', error);
      }
    },
  };
}

// Type for the auth store instance
export type AuthStore = ReturnType<typeof createAuthStore>;
