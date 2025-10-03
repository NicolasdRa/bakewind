import { createResource } from "solid-js";
import { getUserLocationsServer } from "~/lib/locations-queries";

/**
 * Hook to fetch user locations from the server.
 * Uses createResource for client-side data fetching with loading and error states.
 */
export function useUserLocationsServer() {
  const [data, { refetch }] = createResource(getUserLocationsServer);

  return {
    locations: data,
    loading: data.loading,
    error: data.error,
    refetch,
  };
}
