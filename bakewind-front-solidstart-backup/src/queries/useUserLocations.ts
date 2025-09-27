import { createResource } from "solid-js";
import { getUserLocations, type Location } from "../api/locationsApi";

export const useUserLocations = () => {
  const [locations, { refetch, mutate }] = createResource<Location[]>(
    async () => {
      console.log('🔍 [USE_USER_LOCATIONS] Fetching user locations...');
      try {
        const data = await getUserLocations();
        console.log('✅ [USE_USER_LOCATIONS] Locations fetched successfully:', data);
        return data;
      } catch (error) {
        console.error('❌ [USE_USER_LOCATIONS] Failed to fetch locations:', error);
        throw error;
      }
    },
    {
      initialValue: []
    }
  );

  return {
    locations: () => locations(),  // Return a getter for reactivity
    loading: () => locations.loading,
    error: () => locations.error,
    refetch,
    mutate
  };
};