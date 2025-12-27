/**
 * Staff Context Provider
 *
 * Provides the staff store to the component tree via SolidJS Context.
 * This context manages staff-specific data like areas, position, and department.
 * Only relevant for STAFF role users.
 *
 * Note: Staff data is now loaded with the auth profile, so this context primarily
 * provides a consistent API for accessing staff data throughout the app.
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
 * Staff data is now included in the auth profile response, so this syncs
 * the staff store with the auth store's staff data.
 */
export const StaffProvider: Component<{ children: JSX.Element }> = (props) => {
  logger.ui('Rendering StaffProvider');

  // Create store instance when provider mounts
  const staffStore = createStaffStore();
  const auth = useAuth();

  // Sync staff profile from auth store
  createEffect(() => {
    const isAuthenticated = auth.isAuthenticated;
    const isInitialized = auth.isInitialized;
    const staffContext = auth.staff;

    // Only sync if auth is initialized and user is authenticated
    if (!isInitialized || !isAuthenticated) {
      // Clear staff profile if user logs out
      if (staffStore.hasProfile) {
        logger.auth('User logged out, clearing staff profile');
        staffStore.clear();
      }
      return;
    }

    // If auth has staff context, sync it to the staff store
    if (staffContext) {
      // Convert StaffContext to StaffProfile format
      const profile: StaffProfile = {
        id: staffContext.id,
        userId: auth.user?.id || '',
        tenantId: staffContext.tenantId,
        position: staffContext.position,
        department: staffContext.department,
        areas: staffContext.areas as StaffArea[],
        permissions: {},
        hireDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      staffStore.setProfile(profile);
      logger.auth(`Staff profile synced from auth: areas=${staffContext.areas.join(', ')}`);
    } else if (staffStore.hasProfile) {
      // Clear if auth no longer has staff context
      logger.auth('No staff context in auth, clearing staff profile');
      staffStore.clear();
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
