import { action, redirect } from "@solidjs/router";
import { createUserSession, type SessionUser } from "~/lib/auth-session";
import type { UserRole } from "~/types/auth";

export interface TrialSignupResponse {
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
    businessName?: string;
    trialEndsAt?: string;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  // Alternative flat structure
  accessToken?: string;
  refreshToken?: string;
}

const signupTrialUser = action(async (formData: FormData) => {
  "use server";

  const businessName = formData.get("businessName") as string;
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;
  const locations = formData.get("locations") as string;
  const agreeToTerms = formData.get("agreeToTerms") as string;

  // Validation
  if (!businessName || !fullName || !email || !phone || !password || !locations) {
    throw new Error("All fields are required");
  }

  if (!agreeToTerms) {
    throw new Error("You must agree to the terms and conditions");
  }

  // Split full name into first and last name
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  console.log('🔐 [TRIAL_SIGNUP_API] Attempting trial signup for:', email);

  try {
    // Call the backend API
    const response = await fetch(`${process.env.VITE_API_URL || "http://localhost:5000"}/auth/trial-signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        businessName,
        firstName,
        lastName,
        email,
        phone,
        password,
        locations,
        agreeToTerms: true
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Trial signup failed: ${response.statusText}`);
    }

    const data: TrialSignupResponse = await response.json();
    console.log('✅ [TRIAL_SIGNUP_API] Backend trial signup successful for:', email);
    console.log('🔍 [TRIAL_SIGNUP_API] Response structure:', {
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
      console.error('❌ [TRIAL_SIGNUP_API] No access token in response:', data);
      throw new Error("No access token received from server");
    }

    // Create encrypted session
    await createUserSession(
      sessionUser,
      accessToken,
      refreshToken
    );

    console.log('💾 [TRIAL_SIGNUP_API] Session created, redirecting...');

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
      // No locations assigned - redirect to dashboard anyway (trial users start without locations)
      const { getRedirectUrlBasedOnPermission } = await import("~/lib/permissions");
      const redirectUrl = getRedirectUrlBasedOnPermission(sessionUser.role);
      throw redirect(redirectUrl);
    }

  } catch (error) {
    console.error('❌ [TRIAL_SIGNUP_API] Trial signup failed:', error);

    if (error instanceof Response) {
      // This is a redirect, let it through
      throw error;
    }

    // This is an actual error
    const errorMessage = error instanceof Error ? error.message : "Trial signup failed";
    throw new Error(errorMessage);
  }
});

export { signupTrialUser };