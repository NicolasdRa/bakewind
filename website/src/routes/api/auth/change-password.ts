import { action } from "@solidjs/router";
import { getTokenFromSession } from "~/lib/auth-session";

const changePassword = action(async (formData: FormData) => {
  "use server";

  console.log('🔐 [CHANGE_PASSWORD_ACTION] Starting password change...');

  try {
    // Get token from session
    const token = await getTokenFromSession();

    if (!token) {
      throw new Error("Not authenticated");
    }

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new Error("All password fields are required");
    }

    if (newPassword !== confirmPassword) {
      throw new Error("New passwords do not match");
    }

    if (newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long");
    }

    console.log('📤 [CHANGE_PASSWORD_ACTION] Sending password change request...');

    // Call backend API to change password
    const response = await fetch(`${process.env.VITE_API_URL || "http://localhost:5000"}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to change password");
    }

    console.log('✅ [CHANGE_PASSWORD_ACTION] Password changed successfully');

    return { success: true, message: "Password changed successfully" };

  } catch (error) {
    console.error('❌ [CHANGE_PASSWORD_ACTION] Password change failed:', error);
    const errorMessage = error instanceof Error ? error.message : "Password change failed";
    throw new Error(errorMessage);
  }
});

export { changePassword };