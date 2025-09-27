import { apiClient } from "../utils/api";

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  timezone: string;
  phoneNumber?: string;
  email?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserLocation {
  id: string;
  userId: string;
  locationId: string;
  isDefault: boolean;
  createdAt: string;
}

/**
 * Get all locations for the current authenticated user
 */
export const getUserLocations = async (): Promise<Location[]> => {
  console.log('📍 [LOCATIONS_API] Fetching user locations...');

  try {
    const response = await apiClient.get<Location[]>('/locations/my-locations');
    console.log('✅ [LOCATIONS_API] User locations fetched successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ [LOCATIONS_API] Failed to fetch user locations:', error);
    throw error;
  }
};

/**
 * Get all available locations (admin/manager only)
 */
export const getAllLocations = async (): Promise<Location[]> => {
  console.log('📍 [LOCATIONS_API] Fetching all locations...');

  try {
    const response = await apiClient.get<Location[]>('/locations');
    console.log('✅ [LOCATIONS_API] All locations fetched successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ [LOCATIONS_API] Failed to fetch all locations:', error);
    throw error;
  }
};

/**
 * Get a specific location by ID
 */
export const getLocationById = async (locationId: string): Promise<Location> => {
  console.log('📍 [LOCATIONS_API] Fetching location:', locationId);

  try {
    const response = await apiClient.get<Location>(`/locations/${locationId}`);
    console.log('✅ [LOCATIONS_API] Location fetched successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ [LOCATIONS_API] Failed to fetch location:', error);
    throw error;
  }
};