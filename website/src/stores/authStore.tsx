/**
 * Authentication Store for BakeWind SaaS Customer Portal
 *
 * Manages authentication state, user data, and trial information using SolidJS signals.
 * Provides reactive state management for login, logout, trial signup, and user sessions.
 */

import { createSignal, createMemo, createEffect, onCleanup } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { authApi, apiClient, handleApiError } from '../lib/api-client';

// Types for the authentication store
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  role: string;
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled' | 'pending';
  trialEndsAt?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  locationId?: string[];
}

export interface TrialInfo {
  id: string;
  userId: string;
  businessSize: '1' | '2-3' | '4-10' | '10+';
  onboardingStatus: 'pending' | 'started' | 'in_progress' | 'completed' | 'abandoned';
  onboardingStepsCompleted: string[];
  lastOnboardingActivity?: string;
  hasConvertedToPaid: boolean;
  convertedAt?: string;
  subscriptionPlanId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  trial: TrialInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  trial: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  accessToken: null,
  refreshToken: null,
};

// Create reactive store
const [authState, setAuthState] = createStore<AuthState>(initialState);

// Loading state signal
const [isInitializing, setIsInitializing] = createSignal(true);

// Session management
let sessionCheckInterval: number | null = null;
let tokenRefreshTimeout: number | null = null;

/**
 * Authentication Store
 */
export const authStore = {
  // State getters
  get state() {
    return authState;
  },

  get user() {
    return authState.user;
  },

  get trial() {
    return authState.trial;
  },

  get isAuthenticated() {
    return authState.isAuthenticated;
  },

  get isLoading() {
    return authState.isLoading;
  },

  get error() {
    return authState.error;
  },

  get isInitializing() {
    return isInitializing();
  },

  // Computed values
  get isTrialUser() {
    return createMemo(() => authState.user?.role === 'trial_user');
  },

  get isSubscriber() {
    return createMemo(() =>
      authState.user?.subscriptionStatus === 'active' ||
      authState.user?.subscriptionStatus === 'past_due'
    );
  },

  get trialDaysRemaining() {
    return createMemo(() => {
      if (!authState.user?.trialEndsAt) return 0;
      const trialEnd = new Date(authState.user.trialEndsAt);
      const now = new Date();
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    });
  },

  getDashboardUrl() {
    const user = authState.user;
    if (!user) return '/';

    // Get admin app URL from environment or use default
    const adminAppUrl = import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:3001';

    // Redirect to admin app with authentication tokens
    const accessToken = authState.accessToken;
    const refreshToken = authState.refreshToken;

    if (accessToken && refreshToken) {
      // Encode user data for URL
      const userData = encodeURIComponent(JSON.stringify(user));

      // Build URL with auth params
      return `${adminAppUrl}?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${userData}`;
    }

    // Fallback to admin app root
    return adminAppUrl;
  },

  // Actions
  async initialize() {
    setIsInitializing(true);
    setAuthState('isLoading', true);

    try {
      // Try to restore session from stored tokens
      const storedTokens = this.getStoredTokens();
      if (storedTokens.accessToken && storedTokens.refreshToken) {
        apiClient.setAuthTokens(storedTokens.accessToken, storedTokens.refreshToken);

        // Verify tokens and get user profile
        try {
          const response = await authApi.getProfile();
          if (response.data) {
            await this.setUser(response.data);
            this.startSessionManagement();
          }
        } catch (error) {
          // Tokens are invalid, clear them
          this.clearStoredTokens();
          apiClient.clearAuthTokens();
        }
      }
    } catch (error) {
      console.error('Authentication initialization failed:', error);
      setAuthState('error', 'Failed to initialize authentication');
    } finally {
      setAuthState('isLoading', false);
      setIsInitializing(false);
    }
  },

  async login(email: string, password: string) {
    setAuthState('isLoading', true);
    setAuthState('error', null);

    try {
      const response = await authApi.login(email, password);
      const { user, accessToken, refreshToken } = response.data;

      // Store tokens
      this.storeTokens(accessToken, refreshToken);

      // Set user data
      await this.setUser(user);

      // Start session management
      this.startSessionManagement();

      return response.data;
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      setAuthState('error', errorMessage);
      throw error;
    } finally {
      setAuthState('isLoading', false);
    }
  },

  async trialSignup(data: {
    businessName: string;
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    locations: '1' | '2-3' | '4-10' | '10+';
    agreeToTerms: boolean;
    marketingConsent?: boolean;
    referralSource?: string;
  }) {
    setAuthState('isLoading', true);
    setAuthState('error', null);

    try {
      const response = await authApi.trialSignup(data);
      const { user, accessToken, refreshToken } = response.data;

      // Store tokens
      this.storeTokens(accessToken, refreshToken);

      // Set user data
      await this.setUser(user);

      // Start session management
      this.startSessionManagement();

      return response.data;
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      setAuthState('error', errorMessage);
      throw error;
    } finally {
      setAuthState('isLoading', false);
    }
  },

  async logout() {
    setAuthState('isLoading', true);

    try {
      await authApi.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      this.clearAuth();
      this.stopSessionManagement();
      setAuthState('isLoading', false);
    }
  },

  async refreshProfile() {
    if (!authState.isAuthenticated) return;

    try {
      const response = await authApi.getProfile();
      if (response.data) {
        await this.setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      // If profile refresh fails, user might need to re-login
      this.clearAuth();
    }
  },

  async updateTrialOnboarding(onboardingData: {
    onboardingStatus?: 'pending' | 'started' | 'in_progress' | 'completed' | 'abandoned';
    onboardingStepsCompleted?: string[];
  }) {
    const trial = authState.trial;
    if (!trial) {
      throw new Error('No trial information available');
    }

    setAuthState('isLoading', true);

    try {
      const { trialsApi } = await import('../lib/api-client');
      const response = await trialsApi.updateOnboarding(trial.id, onboardingData);

      // Update local trial state
      setAuthState('trial', produce((draft) => {
        if (draft) {
          Object.assign(draft, response.data);
        }
      }));

      return response.data;
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      setAuthState('error', errorMessage);
      throw error;
    } finally {
      setAuthState('isLoading', false);
    }
  },

  // Private methods
  async setUser(userData: User) {
    setAuthState('user', userData);
    setAuthState('isAuthenticated', true);

    // Load trial information if user is a trial user
    if (userData.role === 'trial_user') {
      try {
        const { trialsApi } = await import('../lib/api-client');
        const trialResponse = await trialsApi.getTrialByUser(userData.id);
        setAuthState('trial', trialResponse.data);
      } catch (error) {
        console.error('Failed to load trial information:', error);
      }
    }
  },

  clearAuth() {
    setAuthState(initialState);
    this.clearStoredTokens();
    apiClient.clearAuthTokens();
  },

  storeTokens(accessToken: string, refreshToken: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
    setAuthState('accessToken', accessToken);
    setAuthState('refreshToken', refreshToken);
  },

  getStoredTokens() {
    if (typeof window === 'undefined') {
      return { accessToken: null, refreshToken: null };
    }

    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
    };
  },

  clearStoredTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    setAuthState('accessToken', null);
    setAuthState('refreshToken', null);
  },

  startSessionManagement() {
    this.stopSessionManagement(); // Clear any existing intervals

    // Only start session management in browser environment
    if (typeof window === 'undefined') return;

    // Periodic session check (every 5 minutes)
    sessionCheckInterval = window.setInterval(() => {
      this.refreshProfile();
    }, 5 * 60 * 1000);

    // Set up token refresh before expiration
    this.scheduleTokenRefresh();
  },

  stopSessionManagement() {
    if (sessionCheckInterval) {
      clearInterval(sessionCheckInterval);
      sessionCheckInterval = null;
    }

    if (tokenRefreshTimeout) {
      clearTimeout(tokenRefreshTimeout);
      tokenRefreshTimeout = null;
    }
  },

  scheduleTokenRefresh() {
    // Only schedule refresh in browser environment
    if (typeof window === 'undefined') return;

    // JWT tokens typically expire in 15 minutes
    // Schedule refresh 2 minutes before expiration
    const refreshTime = 13 * 60 * 1000; // 13 minutes

    tokenRefreshTimeout = window.setTimeout(async () => {
      try {
        await authApi.refreshTokens();
        // Schedule next refresh
        this.scheduleTokenRefresh();
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Force re-login
        this.clearAuth();
      }
    }, refreshTime);
  },

  // Utility methods
  clearError() {
    setAuthState('error', null);
  },

  setError(error: string) {
    setAuthState('error', error);
  },
};

// Auto-initialize when store is created
if (typeof window !== 'undefined') {
  authStore.initialize();
}

// Cleanup on unmount
onCleanup(() => {
  authStore.stopSessionManagement();
});

// Create reactive effects for external state changes
createEffect(() => {
  // Save tokens to localStorage when they change
  const { accessToken, refreshToken } = authState;
  if (accessToken && refreshToken) {
    authStore.storeTokens(accessToken, refreshToken);
  }
});

// Export convenience hooks
export const useAuth = () => authStore;

export const useUser = () => createMemo(() => authState.user);

export const useTrial = () => createMemo(() => authState.trial);

export const useAuthState = () => createMemo(() => ({
  isAuthenticated: authState.isAuthenticated,
  isLoading: authState.isLoading,
  error: authState.error,
  isInitializing: isInitializing(),
}));

// Higher-order component for protected routes
export function withAuth<T extends {}>(Component: (props: T) => any) {
  return (props: T) => {
    const auth = useAuth();

    createEffect(() => {
      if (!auth.isInitializing && !auth.isAuthenticated) {
        // Redirect to login if not authenticated (only in browser)
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    });

    if (auth.isInitializing || auth.isLoading) {
      return (
        <div class="min-h-screen flex items-center justify-center">
          <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-saas-500"></div>
        </div>
      );
    }

    if (!auth.isAuthenticated) {
      return null; // Will redirect above
    }

    return <Component {...props} />;
  };
}

export default authStore;