import { createAsync } from "@solidjs/router";
import { getAuthUserServer, getIsAuthenticatedServer, getUserLocationServer } from "~/lib/auth-queries";
import type { SessionUser } from "~/lib/auth-session";

/**
 * Hook to get the current authenticated user from the session.
 * Uses createAsync for server-side data fetching that works across SSR and CSR.
 * This is the new recommended way to access user data throughout the app.
 */
export function useAuthUser() {
  const user = createAsync(() => getAuthUserServer(), { key: "auth-user" });
  return user;
}

/**
 * Hook to check if user is authenticated.
 * Returns a boolean indicating authentication status.
 */
export function useIsAuthenticated() {
  const authenticated = createAsync(() => getIsAuthenticatedServer(), { key: "auth-status" });
  return authenticated;
}

/**
 * Hook to get user's selected location ID from session.
 */
export function useUserLocation() {
  const location = createAsync(() => getUserLocationServer(), { key: "user-location" });
  return location;
}