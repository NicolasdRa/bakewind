import { createAsync } from "@solidjs/router";
import { getUserLocationsServer } from "~/lib/locations-queries";

/**
 * Server-side user locations fetcher using session authentication.
 * This replaces the client-side useUserLocations hook.
 */
export function useUserLocationsServer() {
  const locations = createAsync(() => getUserLocationsServer(), { key: "user-locations" });

  return {
    locations,
    get loading() {
      return locations.loading;
    },
    get error() {
      return locations.error;
    },
  };
}