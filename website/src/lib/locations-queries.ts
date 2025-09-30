import { serverApiClient } from "~/utils/server-api";
import { requireAuth } from "~/lib/auth-guard";
import type { Location } from "~/api/locationsApi";

export async function getUserLocationsServer(): Promise<Location[]> {
  "use server";

  console.log('🔍 [GET_USER_LOCATIONS_SERVER] Fetching user locations...');

  // Ensure user is authenticated
  const user = await requireAuth();

  try {
    const data = await serverApiClient.get<Location[]>('/locations/my-locations');
    console.log('✅ [GET_USER_LOCATIONS_SERVER] Locations fetched successfully:', data.length);
    return data;
  } catch (error) {
    console.error('❌ [GET_USER_LOCATIONS_SERVER] Failed to fetch locations:', error);
    throw error;
  }
}