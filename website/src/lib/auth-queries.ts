import { getUserFromSession, isAuthenticated, type SessionUser } from "~/lib/auth-session";

export async function getAuthUserServer(): Promise<SessionUser | null> {
  "use server";
  console.log('🔍 [GET_AUTH_USER_SERVER] Fetching user from session...');

  try {
    const sessionUser = await getUserFromSession();

    if (!sessionUser) {
      console.log('🚫 [GET_AUTH_USER_SERVER] User not authenticated');
      return null;
    }

    console.log('✅ [GET_AUTH_USER_SERVER] User retrieved:', sessionUser.email);
    return sessionUser;
  } catch (error) {
    console.error('❌ [GET_AUTH_USER_SERVER] Error:', error);
    return null;
  }
}

export async function getIsAuthenticatedServer(): Promise<boolean> {
  "use server";
  try {
    return await isAuthenticated();
  } catch (error) {
    console.error('❌ [GET_IS_AUTHENTICATED_SERVER] Error:', error);
    return false;
  }
}

export async function getUserLocationServer(): Promise<string | null> {
  "use server";
  try {
    const user = await getUserFromSession();
    return user?.locationId || null;
  } catch (error) {
    console.error('❌ [GET_USER_LOCATION_SERVER] Error:', error);
    return null;
  }
}