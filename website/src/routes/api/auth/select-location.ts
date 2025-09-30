import { action, redirect } from "@solidjs/router";
import { updateUserLocation, getUserFromSession } from "~/lib/auth-session";
import { getRedirectUrlBasedOnPermission } from "~/lib/permissions";

const selectLocation = action(async (formData: FormData) => {
  "use server";

  const locationId = formData.get("locationId") as string;

  if (!locationId) {
    throw new Error("Location ID is required");
  }

  console.log('📍 [SELECT_LOCATION_API] Location selected:', locationId);

  try {
    // Get current user from session
    const user = await getUserFromSession();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Update location in session
    await updateUserLocation(locationId);
    console.log('✅ [SELECT_LOCATION_API] Location updated in session');

    // Determine redirect URL based on user role
    const redirectUrl = getRedirectUrlBasedOnPermission(user.role);
    console.log('🧭 [SELECT_LOCATION_API] Redirecting to:', redirectUrl);

    throw redirect(redirectUrl);

  } catch (error) {
    console.error('❌ [SELECT_LOCATION_API] Location selection failed:', error);

    if (error instanceof Response) {
      // This is a redirect, let it through
      throw error;
    }

    // This is an actual error
    throw new Error(error instanceof Error ? error.message : "Location selection failed");
  }
});

export { selectLocation };