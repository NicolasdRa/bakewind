import { createResource, createSignal } from "solid-js";
import { apiClient } from "../utils/api";
import type { DashboardUserData } from "../types/auth";

export const useCurrentUser = () => {
  // Create a reactive source that tracks the auth token
  const [authToken, setAuthToken] = createSignal<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  );

  // Debug auth token
  console.log('🔑 [USE_CURRENT_USER] Initial auth token:', authToken());
  console.log('🔑 [USE_CURRENT_USER] Window available:', typeof window !== 'undefined');
  console.log('🔑 [USE_CURRENT_USER] LocalStorage token:', typeof window !== 'undefined' ? localStorage.getItem('accessToken') : 'N/A');

  // Listen for storage changes to keep token in sync
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === 'accessToken') {
        setAuthToken(e.newValue);
      }
    });
  }

  // Create resource that fetches user data when token changes
  const [user, { mutate, refetch }] = createResource(
    authToken,
    async (token: string | null) => {
      console.log('🔍 [USE_CURRENT_USER] Resource called with token:', token);
      if (!token) {
        console.log('🚫 [USE_CURRENT_USER] No token, returning null');
        return null;
      }

      try {
        const response = await apiClient.get<{
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          role: string;
          isActive: boolean;
          isEmailVerified: boolean;
          locationId: string[];
          createdAt: string;
          updatedAt: string;
          lastLoginAt?: string;
          phoneNumber?: string | null;
          bio?: string | null;
          profilePictureUrl?: string | null;
          gender?: string | null;
          dateOfBirth?: string | null;
          country?: string | null;
          city?: string | null;
          deletedAt?: string | null;
          lastLogoutAt?: string | null;
          refreshTokenExpiresAt?: string | null;
          emailVerificationToken?: string | null;
          passwordResetToken?: string | null;
          passwordResetExpires?: string | null;
        }>('/auth/me');

        const userData: DashboardUserData = {
          id: response.id,
          email: response.email,
          role: response.role as any,
          createdAt: response.createdAt,
          lastLoginAt: response.lastLoginAt || new Date().toISOString(),
          locationId: response.locationId || [],
          firstName: response.firstName,
          lastName: response.lastName,
          phoneNumber: response.phoneNumber || null,
          bio: response.bio || null,
          profilePictureUrl: response.profilePictureUrl || null,
          gender: response.gender || null,
          dateOfBirth: response.dateOfBirth || null,
          country: response.country || null,
          city: response.city || null,
          isActive: response.isActive,
          isEmailVerified: response.isEmailVerified
        };

        return userData;
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        // Clear invalid token
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        setAuthToken(null);
        throw error;
      }
    },
    {
      initialValue: null
    }
  );

  // Helper function to update the auth token
  const updateAuthToken = (token: string | null) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('accessToken', token);
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    setAuthToken(token);
  };

  return {
    user: user(),
    loading: user.loading,
    error: user.error,
    latest: user.latest, // Always returns the most recent data, even if loading
    refetch,
    mutate, // For optimistic updates
    updateAuthToken
  };
};