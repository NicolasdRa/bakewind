/**
 * Staff API
 *
 * Handles all staff-related API calls
 */

import { apiClient } from './client';
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

export interface UpdateStaffProfileData {
  position?: string;
  department?: string;
}

/**
 * Get current user's staff profile
 * Only available for STAFF role users
 */
export async function getMyStaffProfile(): Promise<StaffProfile> {
  logger.auth('Fetching staff profile...');
  return apiClient.get<StaffProfile>('/staff/me');
}

/**
 * Update current user's staff profile
 * Only position and department can be updated by the user
 */
export async function updateMyStaffProfile(data: UpdateStaffProfileData): Promise<StaffProfile> {
  logger.auth('Updating staff profile...');
  return apiClient.put<StaffProfile>('/staff/me/profile', data);
}

/**
 * Get staff by ID (admin/owner use)
 */
export async function getStaffById(id: string): Promise<StaffProfile> {
  return apiClient.get<StaffProfile>(`/staff/${id}`);
}
