/**
 * Tenants API
 *
 * Handles tenant management and staff operations for OWNER users
 */

import { apiClient } from './client';
import { logger } from '../utils/logger';
import type { StaffArea, StaffProfile } from './staff';

// Types
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'incomplete';

export interface Tenant {
  id: string;
  ownerUserId: string;
  businessName: string;
  businessPhone: string | null;
  businessAddress: string | null;
  stripeAccountId: string | null;
  subscriptionPlanId: string | null;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  trialLengthDays: number;
  onboardingCompleted: boolean;
  sampleDataLoaded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTenantData {
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
  onboardingCompleted?: boolean;
}

export interface InviteStaffData {
  email: string;
  firstName: string;
  lastName: string;
  position?: string;
  department?: string;
  areas?: StaffArea[];
  hireDate?: string;
}

export interface UpdateStaffData {
  position?: string;
  department?: string;
  areas?: StaffArea[];
  permissions?: Record<string, boolean>;
  hireDate?: string;
}

export interface StaffMemberWithUser extends StaffProfile {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface InviteStaffResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  staff: StaffProfile;
  message: string;
}

// ============ Tenant Management ============

/**
 * Get current user's tenant
 * For OWNER: returns their owned tenant
 * For STAFF: returns the tenant they work for
 */
export async function getMyTenant(): Promise<Tenant> {
  logger.api('Fetching tenant info...');
  return apiClient.get<Tenant>('/tenants/me');
}

/**
 * Update current tenant settings (OWNER only)
 */
export async function updateMyTenant(data: UpdateTenantData): Promise<Tenant> {
  logger.api('Updating tenant info...', data);
  return apiClient.put<Tenant>('/tenants/me', data);
}

/**
 * Mark onboarding as completed
 */
export async function completeOnboarding(): Promise<Tenant> {
  logger.api('Completing onboarding...');
  return apiClient.post<Tenant>('/tenants/me/complete-onboarding');
}

// ============ Staff Management (OWNER only) ============

/**
 * Get all staff members in tenant
 */
export async function getTenantStaff(): Promise<StaffProfile[]> {
  logger.api('Fetching tenant staff...');
  return apiClient.get<StaffProfile[]>('/tenants/me/staff');
}

/**
 * Invite a new staff member to the bakery
 * Creates a new user with STAFF role and links them to the tenant
 */
export async function inviteStaff(data: InviteStaffData): Promise<InviteStaffResponse> {
  logger.api('Inviting staff member...', { email: data.email });
  return apiClient.post<InviteStaffResponse>('/tenants/me/invite-staff', data);
}

/**
 * Update a staff member's details
 */
export async function updateStaffMember(staffId: string, data: UpdateStaffData): Promise<StaffProfile> {
  logger.api('Updating staff member...', { staffId });
  return apiClient.patch<StaffProfile>(`/tenants/me/staff/${staffId}`, data);
}

/**
 * Remove a staff member from the bakery
 * Note: This removes their staff profile but keeps their user account
 */
export async function removeStaffMember(staffId: string): Promise<{ message: string }> {
  logger.api('Removing staff member...', { staffId });
  return apiClient.delete<{ message: string }>(`/tenants/me/staff/${staffId}`);
}

// ============ Admin Functions ============

/**
 * Tenant list item for admin selector
 */
export interface TenantListItem {
  id: string;
  businessName: string;
  businessPhone: string | null;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  createdAt: string;
}

/**
 * Get all tenants (ADMIN only)
 * Used for tenant selector dropdown
 */
export async function getAllTenants(search?: string): Promise<{ tenants: TenantListItem[] }> {
  logger.api('Fetching all tenants...', { search });
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient.get<{ tenants: TenantListItem[] }>(`/tenants${params}`);
}

// ============ Utility Functions ============

/**
 * Calculate days remaining in trial
 */
export function getTrialDaysRemaining(tenant: Tenant): number | null {
  if (tenant.subscriptionStatus !== 'trial' || !tenant.trialEndsAt) {
    return null;
  }

  const trialEnd = new Date(tenant.trialEndsAt);
  const now = new Date();
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Check if trial has expired
 */
export function isTrialExpired(tenant: Tenant): boolean {
  if (tenant.subscriptionStatus !== 'trial') {
    return false;
  }

  const remaining = getTrialDaysRemaining(tenant);
  return remaining !== null && remaining <= 0;
}

/**
 * Get human-readable subscription status
 */
export function getSubscriptionStatusLabel(status: SubscriptionStatus): string {
  const labels: Record<SubscriptionStatus, string> = {
    trial: 'Trial',
    active: 'Active',
    past_due: 'Past Due',
    canceled: 'Canceled',
    incomplete: 'Incomplete',
  };
  return labels[status] || status;
}
