import { useSession } from "vinxi/http";
import { getRequestEvent } from "solid-js/web";
import type { UserRole } from "~/types/auth";

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  locationId?: string | null;
}

export interface SessionData {
  user?: SessionUser;
  accessToken?: string;
  refreshToken?: string | null;
}

// Generate a strong session secret with: openssl rand -base64 32
// Store this in your environment variables in production
const SESSION_SECRET = process.env.SESSION_SECRET || "default-dev-secret-32chars-min!!";

// Validate session secret length
if (SESSION_SECRET.length < 32) {
  throw new Error(
    `SESSION_SECRET must be at least 32 characters. Current length: ${SESSION_SECRET.length}. ` +
    `Generate a secure secret with: openssl rand -base64 32`
  );
}

// Cache the session per request to avoid multiple cookie operations
const sessionCache = new WeakMap();

async function getSession() {
  "use server";

  // Get the current request event
  const event = getRequestEvent();
  if (!event) {
    throw new Error("No request event available");
  }

  // Check if we already have a session for this request
  if (sessionCache.has(event)) {
    return sessionCache.get(event);
  }

  // Create a new session and cache it
  const session = await useSession<SessionData>({
    password: SESSION_SECRET,
    name: "auth-session",
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  });

  sessionCache.set(event, session);
  return session;
}

export async function createUserSession(user: SessionUser, accessToken: string, refreshToken?: string) {
  "use server";

  try {
    const session = await getSession();

    await session.update({
      user,
      accessToken,
      refreshToken: refreshToken || null,
    });

    console.log('✅ [AUTH_SESSION_SIMPLE] User session created for:', user.email);
  } catch (error) {
    console.error('❌ [AUTH_SESSION_SIMPLE] Failed to create session:', error);
    throw error;
  }
}

export async function getUserFromSession() {
  "use server";

  try {
    const session = await getSession();
    const user = session.data?.user;

    if (user) {
      console.log('🔍 [AUTH_SESSION_SIMPLE] Getting user from session:', user.email);
    } else {
      console.log('🔍 [AUTH_SESSION_SIMPLE] No user in session');
    }

    return user || null;
  } catch (error) {
    console.error('❌ [AUTH_SESSION_SIMPLE] Failed to get user from session:', error);
    return null;
  }
}

export async function getTokenFromSession() {
  "use server";

  try {
    const session = await getSession();
    return session.data?.accessToken || null;
  } catch (error) {
    console.error('❌ [AUTH_SESSION_SIMPLE] Failed to get token from session:', error);
    return null;
  }
}

export async function updateUserLocation(locationId: string | null) {
  "use server";

  try {
    const session = await getSession();

    if (!session.data?.user) {
      console.error('❌ [AUTH_SESSION_SIMPLE] Cannot update location - no user in session');
      return;
    }

    await session.update({
      ...session.data,
      user: {
        ...session.data.user,
        locationId,
      },
    });

    console.log('📍 [AUTH_SESSION_SIMPLE] Location updated in session:', locationId);
  } catch (error) {
    console.error('❌ [AUTH_SESSION_SIMPLE] Failed to update location:', error);
  }
}

export async function clearUserSession() {
  "use server";

  try {
    const session = await getSession();
    await session.clear();
    console.log('🗑️ [AUTH_SESSION_SIMPLE] User session cleared');
  } catch (error) {
    console.error('❌ [AUTH_SESSION_SIMPLE] Failed to clear session:', error);
  }
}

export async function isAuthenticated() {
  "use server";

  try {
    const session = await getSession();
    const authenticated = !!(session.data?.user && session.data?.accessToken);

    console.log('🔍 [AUTH_SESSION_SIMPLE] Authentication check:', {
      hasSession: !!session.data,
      hasUser: !!session.data?.user,
      hasToken: !!session.data?.accessToken,
      authenticated
    });

    return authenticated;
  } catch (error) {
    console.error('❌ [AUTH_SESSION_SIMPLE] Failed to check authentication:', error);
    return false;
  }
}

export async function getUserLocationFromSession() {
  "use server";

  try {
    const session = await getSession();
    return session.data?.user?.locationId || null;
  } catch (error) {
    console.error('❌ [AUTH_SESSION_SIMPLE] Failed to get location from session:', error);
    return null;
  }
}