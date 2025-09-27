import { redirect } from "@solidjs/router";
import { getAuthUserServer } from "~/lib/auth-queries";
import { getRedirectUrlBasedOnPermission } from "~/lib/permissions";

export async function GET() {
  "use server";

  console.log('🏠 [INDEX] Checking authentication for auto-redirect...');

  try {
    const user = await getAuthUserServer();

    if (user) {
      console.log('✅ [INDEX] User authenticated, redirecting to dashboard...');
      const redirectUrl = getRedirectUrlBasedOnPermission(user.role);
      console.log('🧭 [INDEX] Redirecting to:', redirectUrl);
      throw redirect(redirectUrl);
    } else {
      console.log('🚫 [INDEX] User not authenticated, redirecting to home...');
      throw redirect("/home");
    }
  } catch (error) {
    // Check if it's a redirect, let it through
    if (error instanceof Response) {
      console.log('🔄 [INDEX] Redirect response received');
      throw error;
    }

    console.error('❌ [INDEX] Error during auth check:', error);
    throw redirect("/home");
  }
}