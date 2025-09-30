/**
 * Authentication Context for BakeWind Admin Dashboard
 *
 * Manages authentication state and user data for the admin dashboard
 */

import { createSignal, createEffect, createContext, useContext, Component, JSX } from 'solid-js';
import { createStore } from 'solid-js/store';
import { authApi, apiClient } from '../api/client';

export interface User {
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

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const [authState, setAuthState] = createStore<AuthState>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
});

const [isInitialized, setIsInitialized] = createSignal(false);

export const authStore = {
  get state() {
    return authState;
  },

  get user() {
    return authState.user;
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

  get isInitialized() {
    return isInitialized();
  },

  async initialize() {
    if (isInitialized()) {
      console.log('[AuthStore] Already initialized, skipping');
      return;
    }

    console.log('[AuthStore] Starting initialization...');
    setAuthState('isLoading', true);
    setAuthState('error', null);

    try {
      // Check if we have stored tokens
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      console.log('[AuthStore] Found tokens in localStorage:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      });

      if (accessToken && refreshToken) {
        apiClient.setTokens(accessToken, refreshToken);

        // Verify tokens by fetching profile
        try {
          console.log('[AuthStore] Verifying tokens with API...');
          const profile = await authApi.getProfile();
          console.log('[AuthStore] Profile loaded:', profile.email);
          setAuthState('user', profile);
          setAuthState('isAuthenticated', true);
        } catch (error) {
          // Tokens are invalid, clear them
          console.log('[AuthStore] Tokens invalid, clearing auth state');
          this.clearAuth();
        }
      } else {
        console.log('[AuthStore] No tokens found in localStorage');
      }
    } catch (error) {
      console.error('[AuthStore] Auth initialization failed:', error);
      setAuthState('error', 'Failed to initialize authentication');
    } finally {
      setAuthState('isLoading', false);
      setIsInitialized(true);
      console.log('[AuthStore] Initialization complete. isAuthenticated:', authState.isAuthenticated);
    }
  },

  async handleAuthCallback(accessToken: string, refreshToken: string, user: User) {
    // This is called when redirected from customer app after successful login
    apiClient.setTokens(accessToken, refreshToken);
    setAuthState('user', user);
    setAuthState('isAuthenticated', true);
    setAuthState('isLoading', false);
    setAuthState('error', null);
    setIsInitialized(true);
  },

  async logout() {
    setAuthState('isLoading', true);
    try {
      await authApi.logout(); // This will also redirect to customer app
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if API call fails, clear local state and redirect
      this.clearAuth();
      window.location.href = import.meta.env.VITE_CUSTOMER_APP_URL
        ? `${import.meta.env.VITE_CUSTOMER_APP_URL}/login`
        : 'http://localhost:3000/login';
    }
  },

  clearAuth() {
    setAuthState('user', null);
    setAuthState('isAuthenticated', false);
    setAuthState('error', null);
    apiClient.clearTokens();
  },

  setError(error: string) {
    setAuthState('error', error);
  },

  clearError() {
    setAuthState('error', null);
  },

  async refreshProfile() {
    if (!authState.isAuthenticated) return;

    try {
      const profile = await authApi.getProfile();
      setAuthState('user', profile);
    } catch (error) {
      console.error('Profile refresh failed:', error);
    }
  },
};

// Auto-initialize on load (wrapped in setTimeout to defer until after component mount)
if (typeof window !== 'undefined') {
  setTimeout(() => {
    try {
      // Check if we're receiving auth data from customer app redirect
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('accessToken');
      const refreshToken = urlParams.get('refreshToken');
      const userData = urlParams.get('user');

      console.log('[AuthStore] Initializing...', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasUserData: !!userData
      });

      if (accessToken && refreshToken && userData) {
        try {
          const user = JSON.parse(decodeURIComponent(userData));
          console.log('[AuthStore] Handling auth callback with user:', user.email);
          authStore.handleAuthCallback(accessToken, refreshToken, user);
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error('[AuthStore] Failed to parse auth callback data:', error);
          authStore.initialize();
        }
      } else {
        console.log('[AuthStore] No auth params found, initializing normally');
        authStore.initialize();
      }
    } catch (error) {
      console.error('[AuthStore] Failed to initialize:', error);
      setIsInitialized(true);
    }
  }, 0);
}

// Create Auth Context with proper default value
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

// Create a default context value that throws helpful errors if used before provider mounts
const createDefaultContext = (): AuthContextType => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isInitialized: false,
  login: async () => { throw new Error('AuthProvider not mounted'); },
  logout: async () => { throw new Error('AuthProvider not mounted'); },
  refreshProfile: async () => { throw new Error('AuthProvider not mounted'); },
  clearError: () => { throw new Error('AuthProvider not mounted'); },
});

const AuthContext = createContext<AuthContextType>(createDefaultContext());

export const AuthProvider: Component<{ children: JSX.Element }> = (props) => {
  console.log('[AuthProvider] Rendering, has children:', !!props.children);

  // Create stable context value object
  const contextValue: AuthContextType = {
    get user() { return authStore.user; },
    get isAuthenticated() { return authStore.isAuthenticated; },
    get isLoading() { return authStore.isLoading; },
    get error() { return authStore.error; },
    get isInitialized() { return authStore.isInitialized; },
    login: authStore.handleAuthCallback.bind(authStore),
    logout: authStore.logout.bind(authStore),
    refreshProfile: authStore.refreshProfile.bind(authStore),
    clearError: authStore.clearError.bind(authStore),
  };

  // Set up session check effect
  createEffect(() => {
    if (authStore.isAuthenticated) {
      // Set up periodic session check (every 5 minutes)
      const interval = setInterval(() => {
        authStore.refreshProfile();
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  });

  console.log('[AuthProvider] Context ready, isInitialized:', contextValue.isInitialized);

  return (
    <AuthContext.Provider value={contextValue}>
      {props.children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  return context;
};