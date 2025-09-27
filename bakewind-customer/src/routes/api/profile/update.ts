import { action } from "@solidjs/router";
import { getUserFromSession, createUserSession } from "~/lib/auth-session";
import { getTokenFromSession } from "~/lib/auth-session";

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
}

const updateProfile = action(async (formData: FormData) => {
  "use server";

  console.log('📝 [UPDATE_PROFILE_ACTION] Starting profile update...');

  try {
    // Get current user and token from session
    const user = await getUserFromSession();
    const token = await getTokenFromSession();

    if (!user || !token) {
      throw new Error("Not authenticated");
    }

    // Extract form data
    const updateData: UpdateProfileData = {
      firstName: formData.get("firstName") as string || undefined,
      lastName: formData.get("lastName") as string || undefined,
      phoneNumber: formData.get("phoneNumber") as string || undefined,
      bio: formData.get("bio") as string || undefined,
    };

    console.log('📤 [UPDATE_PROFILE_ACTION] Sending update to backend:', updateData);

    // Call backend API to update profile
    const response = await fetch(`${process.env.VITE_API_URL || "http://localhost:5000"}/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update profile");
    }

    const updatedUserData = await response.json();
    console.log('✅ [UPDATE_PROFILE_ACTION] Profile updated successfully');

    // Update session with new user data
    const updatedUser = {
      ...user,
      firstName: updatedUserData.firstName || user.firstName,
      lastName: updatedUserData.lastName || user.lastName,
      phoneNumber: updatedUserData.phoneNumber,
      bio: updatedUserData.bio,
    };

    await createUserSession(updatedUser, token);
    console.log('💾 [UPDATE_PROFILE_ACTION] Session updated with new user data');

    return { success: true, data: updatedUserData };

  } catch (error) {
    console.error('❌ [UPDATE_PROFILE_ACTION] Update failed:', error);
    const errorMessage = error instanceof Error ? error.message : "Profile update failed";
    throw new Error(errorMessage);
  }
});

export { updateProfile };