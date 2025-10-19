/**
 * Authentication Context Provider
 *
 * Provides the auth store to the component tree via SolidJS Context.
 * This file handles UI/component integration while keeping state logic separate.
 */

import { createContext, useContext, Component, JSX, onMount, createEffect } from 'solid-js';
import { createAuthStore, type AuthStore, type User } from '../stores/authStore';
import { logger } from '../utils/logger';

// Context type that components will use
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  login: (user: Partial<User>) => void;
  logout: (navigate?: (path: string) => void) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

// Create context with undefined default (requires provider)
// IMPORTANT: Export the context so it can be imported
export const AuthContext = createContext<AuthStore>();

/**
 * AuthProvider Component
 *
 * Wraps the application and provides authentication state to all child components.
 * Initializes the auth store when mounted (not at module load).
 */
export const AuthProvider: Component<{ children: JSX.Element }> = (props) => {
  logger.ui('Rendering AuthProvider');

  // Create store instance when provider mounts
  const authStore = createAuthStore();

  // Initialize auth state when provider mounts (proper lifecycle)
  onMount(async () => {
    logger.auth('AuthProvider mounted, initializing auth state...');
    await authStore.initialize();
  });

  // Set up session refresh interval when authenticated
  createEffect(() => {
    if (authStore.isAuthenticated) {
      logger.auth('Setting up session refresh interval');

      // Refresh profile every 5 minutes to keep session alive
      const interval = setInterval(() => {
        authStore.refreshProfile();
      }, 5 * 60 * 1000);

      // Cleanup on unmount or when user logs out
      return () => {
        logger.auth('Clearing session refresh interval');
        clearInterval(interval);
      };
    }
  });

  return (
    <AuthContext.Provider value={authStore}>
      {props.children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 *
 * Custom hook to access auth store from any component within AuthProvider.
 * Throws an error if used outside of AuthProvider for better DX.
 */
export function useAuth(): AuthStore {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within AuthProvider. ' +
      'Make sure your component is wrapped with <AuthProvider>.'
    );
  }

  return context;
}
