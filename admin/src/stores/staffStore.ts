/**
 * Staff Store - Pure State Logic
 *
 * This file contains the state management logic for staff profiles.
 * It manages staff-specific data like areas, position, and department.
 */

import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import * as staffApi from '../api/staff';
import { logger } from '../utils/logger';

export type StaffArea = 'cafe' | 'restaurant' | 'front_house' | 'catering' | 'retail' | 'events' | 'management' | 'bakery' | 'patisserie';

export interface StaffProfile {
  id: string;
  userId: string;
  tenantId: string;
  position: string | null;
  department: string | null;
  areas: StaffArea[];
  permissions: Record<string, boolean>;
  hireDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffState {
  profile: StaffProfile | null;
  isLoading: boolean;
  error: string | null;
}

// Factory function to create staff store instance
export function createStaffStore() {
  // Internal state
  const [state, setState] = createStore<StaffState>({
    profile: null,
    isLoading: false,
    error: null,
  });

  const [isInitialized, setIsInitialized] = createSignal(false);

  // Public API
  return {
    // Getters
    get state() {
      return state;
    },

    get profile() {
      return state.profile;
    },

    get areas() {
      return state.profile?.areas || [];
    },

    get position() {
      return state.profile?.position;
    },

    get department() {
      return state.profile?.department;
    },

    get tenantId() {
      return state.profile?.tenantId;
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

    get hasProfile() {
      return state.profile !== null;
    },

    // Actions

    /**
     * Fetch the current user's staff profile
     * Should only be called for STAFF role users
     */
    async fetchProfile() {
      if (isInitialized() && state.profile) {
        logger.auth('Staff profile already loaded, skipping fetch');
        return state.profile;
      }

      logger.auth('Fetching staff profile...');
      setState('isLoading', true);
      setState('error', null);

      try {
        const profile = await staffApi.getMyStaffProfile();
        logger.auth(`Staff profile loaded: ${profile.id}`);
        setState('profile', profile);
        setIsInitialized(true);
        return profile;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to fetch staff profile';
        logger.error('Staff profile fetch failed', error);
        setState('error', errorMessage);
        setIsInitialized(true);
        return null;
      } finally {
        setState('isLoading', false);
      }
    },

    /**
     * Initialize staff profile if user is STAFF role
     */
    async initialize(userRole: string) {
      if (userRole !== 'STAFF') {
        logger.auth('User is not STAFF role, skipping staff profile fetch');
        setIsInitialized(true);
        return;
      }

      return this.fetchProfile();
    },

    /**
     * Update the staff profile
     */
    async updateProfile(data: { position?: string; department?: string }) {
      setState('isLoading', true);
      setState('error', null);

      try {
        const updated = await staffApi.updateMyStaffProfile(data);
        setState('profile', updated);
        return updated;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to update staff profile';
        setState('error', errorMessage);
        throw error;
      } finally {
        setState('isLoading', false);
      }
    },

    /**
     * Set profile directly (used when profile is returned from another API)
     */
    setProfile(profile: StaffProfile) {
      setState('profile', profile);
      setIsInitialized(true);
    },

    /**
     * Clear the staff profile state
     */
    clear() {
      setState('profile', null);
      setState('error', null);
      setIsInitialized(false);
    },

    /**
     * Check if staff has access to a specific area
     */
    hasArea(area: StaffArea): boolean {
      return state.profile?.areas.includes(area) || false;
    },

    /**
     * Check if staff has a specific permission
     */
    hasPermission(permission: string): boolean {
      return state.profile?.permissions[permission] || false;
    },
  };
}

// Type for the staff store instance
export type StaffStore = ReturnType<typeof createStaffStore>;
