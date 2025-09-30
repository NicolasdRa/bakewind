import { action, redirect } from "@solidjs/router";
import { clearUserSession, getTokenFromSession } from "~/lib/auth-session";

const logoutUser = action(async () => {
  "use server";

  console.log('🚪 [LOGOUT_API] Starting logout process...');

  try {
    // Get the current token for backend logout
    const token = await getTokenFromSession();

    // Call backend logout if we have a token
    if (token) {
      try {
        await fetch(`${process.env.VITE_API_URL || "http://localhost:5000"}/auth/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        console.log('✅ [LOGOUT_API] Backend logout successful');
      } catch (error) {
        // Continue with local logout even if backend fails
        console.warn('⚠️ [LOGOUT_API] Backend logout failed, continuing with local logout:', error);
      }
    }

    // Clear the session
    await clearUserSession();
    console.log('🗑️ [LOGOUT_API] Session cleared');

    // Redirect to login
    throw redirect("/login");

  } catch (error) {
    console.error('❌ [LOGOUT_API] Logout error:', error);

    if (error instanceof Response) {
      // This is a redirect, let it through
      throw error;
    }

    // Force local logout even if there's an error
    await clearUserSession();
    throw redirect("/login");
  }
});

export { logoutUser };