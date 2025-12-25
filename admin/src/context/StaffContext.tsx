/**
 * Staff Context Provider
 *
 * Provides the staff store to the component tree via SolidJS Context.
 * This context manages staff-specific data like areas, position, and department.
 * Only relevant for STAFF role users.
 */

import { createContext, useContext, Component, JSX, createEffect } from 'solid-js';
import { createStaffStore, type StaffStore, type StaffProfile, type StaffArea } from '../stores/staffStore';
import { useAuth } from './AuthContext';
import { logger } from '../utils/logger';

// Re-export types for convenience
export type { StaffProfile, StaffArea };

// Create context with undefined default (requires provider)
export const StaffContext = createContext<StaffStore>();

/**
 * StaffProvider Component
 *
 * Wraps the application and provides staff state to all child components.
 * Automatically fetches staff profile when user is authenticated with STAFF role.
 */
export const StaffProvider: Component<{ children: JSX.Element }> = (props) => {
  logger.ui('Rendering StaffProvider');

  // Create store instance when provider mounts
  const staffStore = createStaffStore();
  const auth = useAuth();

  // Initialize staff profile when user is authenticated and has STAFF role
  createEffect(() => {
    const user = auth.user;
    const isAuthenticated = auth.isAuthenticated;
    const isInitialized = auth.isInitialized;

    // Only fetch if auth is initialized and user is authenticated
    if (!isInitialized || !isAuthenticated || !user) {
      // Clear staff profile if user logs out
      if (staffStore.hasProfile) {
        logger.auth('User logged out, clearing staff profile');
        staffStore.clear();
      }
      return;
    }

    // Only fetch for STAFF role users
    if (user.role === 'STAFF') {
      if (!staffStore.isInitialized) {
        logger.auth('User is STAFF role, fetching staff profile...');
        staffStore.fetchProfile();
      }
    } else {
      // Clear if user is not STAFF (role changed or different user)
      if (staffStore.hasProfile) {
        logger.auth('User is not STAFF role, clearing staff profile');
        staffStore.clear();
      }
    }
  });

  return (
    <StaffContext.Provider value={staffStore}>
      {props.children}
    </StaffContext.Provider>
  );
};

/**
 * useStaff Hook
 *
 * Custom hook to access staff store from any component within StaffProvider.
 * Throws an error if used outside of StaffProvider for better DX.
 */
export function useStaff(): StaffStore {
  const context = useContext(StaffContext);

  if (!context) {
    throw new Error(
      'useStaff must be used within StaffProvider. ' +
      'Make sure your component is wrapped with <StaffProvider>.'
    );
  }

  return context;
}

/**
 * useStaffAreas Hook
 *
 * Convenience hook to get staff areas directly.
 * Returns empty array for non-STAFF users or if profile not loaded.
 */
export function useStaffAreas(): StaffArea[] {
  const context = useContext(StaffContext);
  return context?.areas || [];
}
