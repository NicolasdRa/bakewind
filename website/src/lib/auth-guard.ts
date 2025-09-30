import { redirect } from "@solidjs/router";
import { isAuthenticated, getUserFromSession } from "~/lib/auth-session";
import { Permissions, type Permission } from "~/lib/permissions";
import type { UserRole } from "~/types/auth";

/**
 * Server-side authentication guard for protecting routes.
 * Redirects to login if user is not authenticated.
 */
export async function requireAuth() {
  "use server";

  const authenticated = await isAuthenticated();
  if (!authenticated) {
    console.log('🚫 [AUTH_GUARD] User not authenticated, redirecting to login');
    throw redirect("/login");
  }

  const user = await getUserFromSession();
  if (!user) {
    console.log('🚫 [AUTH_GUARD] No user session found, redirecting to login');
    throw redirect("/login");
  }

  console.log('✅ [AUTH_GUARD] User authenticated:', user.email);
  return user;
}

/**
 * Server-side permission guard for role-based access control.
 * Checks if user has required permission for accessing a resource.
 */
export async function requirePermission(permission: Permission) {
  "use server";

  const user = await requireAuth(); // First ensure user is authenticated

  const userPermissions = Permissions[user.role];
  if (!userPermissions.includes(permission)) {
    console.log('🚫 [AUTH_GUARD] Permission denied:', {
      user: user.email,
      role: user.role,
      required: permission,
      has: userPermissions
    });
    throw redirect("/unauthorized");
  }

  console.log('✅ [AUTH_GUARD] Permission granted:', {
    user: user.email,
    permission
  });
  return user;
}

/**
 * Server-side guard for role-based access control.
 * Checks if user has one of the required roles.
 */
export async function requireRole(roles: UserRole | UserRole[]) {
  "use server";

  const user = await requireAuth(); // First ensure user is authenticated

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  if (!allowedRoles.includes(user.role)) {
    console.log('🚫 [AUTH_GUARD] Role access denied:', {
      user: user.email,
      userRole: user.role,
      requiredRoles: allowedRoles
    });
    throw redirect("/unauthorized");
  }

  console.log('✅ [AUTH_GUARD] Role access granted:', {
    user: user.email,
    role: user.role
  });
  return user;
}

/**
 * Server-side guard that requires user to have selected a location.
 * Redirects to location selection if no location is set.
 */
export async function requireLocation() {
  "use server";

  const user = await requireAuth(); // First ensure user is authenticated

  if (!user.locationId) {
    console.log('📍 [AUTH_GUARD] No location selected, redirecting to selection:', user.email);
    throw redirect("/select-location");
  }

  console.log('✅ [AUTH_GUARD] Location verified:', {
    user: user.email,
    locationId: user.locationId
  });
  return user;
}