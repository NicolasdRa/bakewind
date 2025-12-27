/**
 * Users API
 *
 * Handles all user-related API calls (profile management, password changes)
 */

import { apiClient } from './client';
import { logger } from '../utils/logger';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
  gender?: string;
  dateOfBirth?: string;
  country?: string;
  city?: string;
  profilePictureUrl?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

/**
 * Update user profile
 */
export async function updateProfile(data: Partial<UpdateProfileData>): Promise<void> {
  logger.api('Updating user profile...');
  return apiClient.patch('/users/me', data);
}

/**
 * Change user password
 */
export async function changePassword(
  userId: string,
  data: ChangePasswordData
): Promise<void> {
  logger.api(`Changing password for user: ${userId}`);
  return apiClient.patch(`/users/${userId}/password`, data);
}
