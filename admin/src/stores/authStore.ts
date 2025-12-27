/**
 * Authentication Store - Pure State Logic
 *
 * This file contains only the state management logic without any UI/Context concerns.
 * It can be tested independently and reused in different contexts.
 */

import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import * as authApi from '../api/auth';
import type { TenantContext, StaffContext, StaffArea } from '../api/auth';
import { logger } from '../utils/logger';

// Re-export types from auth API
export type { TenantContext, StaffContext, StaffArea };
export type UserRole = 'ADMIN' | 'OWNER' | 'STAFF' | 'CUSTOMER';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'incomplete';

// User profile (matches refactored backend schema)
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
  bio?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  profilePictureUrl?: string | null;
  createdAt: string;
  locationId?: string[];  // User's assigned location IDs
}

export interface AuthState {
  user: User | null;
  tenant: TenantContext | null;
  staff: StaffContext | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Factory function to create auth store instance
export function createAuthStore() {
  // Internal state
  const [state, setState] = createStore<AuthState>({
    user: null,
    tenant: null,
    staff: null,
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

    get tenant() {
      return state.tenant;
    },

    get staff() {
      return state.staff;
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

    // Convenience getters
    get isOwner() {
      return state.user?.role === 'OWNER';
    },

    get isStaff() {
      return state.user?.role === 'STAFF';
    },

    get isAdmin() {
      return state.user?.role === 'ADMIN';
    },

    get hasTenant() {
      return state.tenant !== null;
    },

    get businessName() {
      return state.tenant?.businessName || null;
    },

    get subscriptionStatus() {
      return state.tenant?.subscriptionStatus || null;
    },

    get isTrialActive() {
      if (!state.tenant) return false;
      if (state.tenant.subscriptionStatus !== 'trial') return false;
      if (!state.tenant.trialEndsAt) return false;
      return new Date(state.tenant.trialEndsAt) > new Date();
    },

    get trialDaysRemaining() {
      if (!state.tenant?.trialEndsAt) return 0;
      const trialEnd = new Date(state.tenant.trialEndsAt);
      const now = new Date();
      const diffMs = trialEnd.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    },

    get staffAreas() {
      return state.staff?.areas || [];
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
        logger.auth(`Profile loaded: ${profile.email}, role: ${profile.role}`);

        // Set user data
        setState('user', {
          id: profile.id,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          role: profile.role,
          isActive: profile.isActive,
          isEmailVerified: profile.isEmailVerified,
          phoneNumber: profile.phoneNumber,
          country: profile.country,
          city: profile.city,
          bio: profile.bio,
          gender: profile.gender,
          dateOfBirth: profile.dateOfBirth,
          profilePictureUrl: profile.profilePictureUrl,
          createdAt: profile.createdAt,
          locationId: profile.locationId,
        });

        // Set tenant and staff context
        setState('tenant', profile.tenant);
        setState('staff', profile.staff);
        setState('isAuthenticated', true);

        if (profile.tenant) {
          logger.auth(`Tenant context loaded: ${profile.tenant.businessName}`);
        }
        if (profile.staff) {
          logger.auth(`Staff context loaded: areas=${profile.staff.areas.join(', ')}`);
        }
      } catch (error) {
        // Not authenticated or cookies expired
        logger.auth('No valid session found');
        setState('user', null);
        setState('tenant', null);
        setState('staff', null);
        setState('isAuthenticated', false);
      } finally {
        setState('isLoading', false);
        setIsInitialized(true);
        logger.auth(`Initialization complete. isAuthenticated: ${state.isAuthenticated}`);
      }
    },

    /**
     * Set auth state from login/signup response
     * Called when user successfully logs in or signs up
     */
    setAuthData(data: {
      user: Partial<User>;
      tenant?: TenantContext | null;
      staff?: StaffContext | null;
    }) {
      const user: User = {
        id: data.user.id || '',
        email: data.user.email || '',
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || '',
        role: data.user.role || 'CUSTOMER',
        isActive: data.user.isActive ?? true,
        isEmailVerified: data.user.isEmailVerified ?? false,
        phoneNumber: data.user.phoneNumber,
        country: data.user.country,
        city: data.user.city,
        bio: data.user.bio,
        gender: data.user.gender,
        dateOfBirth: data.user.dateOfBirth,
        profilePictureUrl: data.user.profilePictureUrl,
        createdAt: data.user.createdAt || new Date().toISOString(),
        locationId: data.user.locationId || [],
      };

      // Set all state SYNCHRONOUSLY so components see authenticated user immediately
      setState('user', user);
      setState('tenant', data.tenant || null);
      setState('staff', data.staff || null);
      setState('isAuthenticated', true);
      setState('isLoading', false);
      setState('error', null);
      setIsInitialized(true);

      logger.auth(`Auth complete - user: ${user.email}, role: ${user.role}`);
      if (data.tenant) {
        logger.auth(`Tenant: ${data.tenant.businessName} (${data.tenant.subscriptionStatus})`);
      }
      if (data.staff) {
        logger.auth(`Staff areas: ${data.staff.areas.join(', ')}`);
      }
    },

    // Legacy method for backwards compatibility
    login(user: Partial<User>, tenant?: TenantContext | null, staff?: StaffContext | null) {
      this.setAuthData({ user, tenant, staff });
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
      setState('tenant', null);
      setState('staff', null);
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

    /**
     * Refresh profile including tenant and staff context
     */
    async refreshProfile() {
      if (!state.isAuthenticated) return;

      try {
        const profile = await authApi.getProfile();

        // Update user data
        setState('user', {
          id: profile.id,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          role: profile.role,
          isActive: profile.isActive,
          isEmailVerified: profile.isEmailVerified,
          phoneNumber: profile.phoneNumber,
          country: profile.country,
          city: profile.city,
          bio: profile.bio,
          gender: profile.gender,
          dateOfBirth: profile.dateOfBirth,
          profilePictureUrl: profile.profilePictureUrl,
          createdAt: profile.createdAt,
          locationId: profile.locationId,
        });

        // Update tenant and staff context
        setState('tenant', profile.tenant);
        setState('staff', profile.staff);

        logger.auth('Profile refreshed successfully');
      } catch (error) {
        logger.error('Profile refresh failed', error);
      }
    },

    /**
     * Update tenant state (e.g., after completing onboarding)
     */
    updateTenant(updates: Partial<TenantContext>) {
      if (!state.tenant) return;
      setState('tenant', { ...state.tenant, ...updates });
    },

    /**
     * Check if user has access to a specific staff area
     */
    hasStaffArea(area: StaffArea): boolean {
      return state.staff?.areas.includes(area) || false;
    },
  };
}

// Type for the auth store instance
export type AuthStore = ReturnType<typeof createAuthStore>;
