import { action, redirect } from "@solidjs/router";
import { createUserSession, type SessionUser } from "~/lib/auth-session";
import type { UserRole } from "~/types/auth";

export interface LoginResponse {
  user: {
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
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  // Alternative flat structure
  accessToken?: string;
  refreshToken?: string;
}

const loginUser = action(async (formData: FormData) => {
  "use server";

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  console.log('🔐 [LOGIN_API] Attempting login for:', email);

  try {
    // Call the backend API
    const response = await fetch(`${process.env.VITE_API_URL || "http://localhost:5000"}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Login failed: ${response.statusText}`);
    }

    const data: LoginResponse = await response.json();
    console.log('✅ [LOGIN_API] Backend login successful for:', email);
    console.log('🔍 [LOGIN_API] Response structure:', {
      hasUser: !!data.user,
      hasTokensObject: !!data.tokens,
      hasAccessToken: !!(data.tokens?.accessToken || data.accessToken),
      keys: Object.keys(data)
    });

    // Create session user object
    const sessionUser: SessionUser = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role as UserRole,
      firstName: data.user.firstName,
      lastName: data.user.lastName,
      locationId: null, // Will be set during location selection
    };

    // Handle different token response formats
    const accessToken = data.tokens?.accessToken || data.accessToken;
    const refreshToken = data.tokens?.refreshToken || data.refreshToken;

    if (!accessToken) {
      console.error('❌ [LOGIN_API] No access token in response:', data);
      throw new Error("No access token received from server");
    }

    // Create encrypted session
    await createUserSession(
      sessionUser,
      accessToken,
      refreshToken
    );

    console.log('💾 [LOGIN_API] Session created, redirecting...');

    // Check if user has multiple locations - redirect to selection
    if (data.user.locationId && data.user.locationId.length > 1) {
      throw redirect("/select-location");
    } else if (data.user.locationId && data.user.locationId.length === 1) {
      // Auto-select single location and redirect to dashboard
      const { updateUserLocation } = await import("~/lib/auth-session");
      await updateUserLocation(data.user.locationId[0]);

      // Determine redirect based on role
      const { getRedirectUrlBasedOnPermission } = await import("~/lib/permissions");
      const redirectUrl = getRedirectUrlBasedOnPermission(sessionUser.role);
      throw redirect(redirectUrl);
    } else {
      // No locations assigned - redirect to dashboard anyway
      const { getRedirectUrlBasedOnPermission } = await import("~/lib/permissions");
      const redirectUrl = getRedirectUrlBasedOnPermission(sessionUser.role);
      throw redirect(redirectUrl);
    }

  } catch (error) {
    console.error('❌ [LOGIN_API] Login failed:', error);

    if (error instanceof Response) {
      // This is a redirect, let it through
      throw error;
    }

    // This is an actual error
    const errorMessage = error instanceof Error ? error.message : "Login failed";
    throw new Error(errorMessage);
  }
});

export { loginUser };