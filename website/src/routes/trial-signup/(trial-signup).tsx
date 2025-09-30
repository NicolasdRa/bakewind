import { type RouteSectionProps, useSubmission, redirect } from "@solidjs/router";
import { Show } from "solid-js";
import { TrialSignupForm } from "~/components/TrialSignupForm";
import { signupTrialUser } from "~/routes/api/auth/trial-signup";
import { getAuthUserServer } from "~/lib/auth-queries";
import { getRedirectUrlBasedOnPermission } from "~/lib/permissions";
import SEO from "~/components/SEO/SEO";

// Route loader to redirect authenticated users
export async function GET() {
  "use server";

  console.log('🔐 [TRIAL_SIGNUP_ROUTE] Checking if user is already authenticated...');

  try {
    const user = await getAuthUserServer();

    if (user) {
      console.log('✅ [TRIAL_SIGNUP_ROUTE] User already authenticated, redirecting to dashboard...');
      const redirectUrl = getRedirectUrlBasedOnPermission(user.role);
      console.log('🧭 [TRIAL_SIGNUP_ROUTE] Redirecting to:', redirectUrl);
      throw redirect(redirectUrl);
    }

    console.log('🚫 [TRIAL_SIGNUP_ROUTE] User not authenticated, showing trial signup form...');
    return null; // Return null for normal rendering
  } catch (error) {
    // Check if it's a redirect
    if (error instanceof Response) {
      throw error;
    }

    console.error('❌ [TRIAL_SIGNUP_ROUTE] Error during auth check:', error);
    return null; // Return null for normal rendering
  }
}

const TrialSignupFormWithAction = () => {
  const signupSubmission = useSubmission(signupTrialUser);

  return (
    <form
      method="post"
      action={signupTrialUser}
      style={{
        display: "contents"
      }}
    >
      <TrialSignupForm />

      <Show when={signupSubmission.error}>
        <div style={{
          position: "fixed",
          bottom: "1rem",
          right: "1rem",
          background: "var(--error-light)",
          border: "1px solid var(--error-color)",
          color: "var(--error-dark)",
          padding: "var(--spacing-3) var(--spacing-4)",
          "border-radius": "var(--radius-lg)",
          "box-shadow": "var(--card-shadow)",
          "backdrop-filter": "blur(10px)",
          "-webkit-backdrop-filter": "blur(10px)",
          "z-index": "50"
        }} role="alert">
          <strong style={{ "font-weight": "var(--font-weight-bold)" }}>Error: </strong>
          <span>{signupSubmission.error.message}</span>
        </div>
      </Show>

      <Show when={signupSubmission.pending}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div style={{
            background: "var(--glass-bg)",
            "backdrop-filter": "blur(16px)",
            "-webkit-backdrop-filter": "blur(16px)",
            border: "1px solid var(--glass-border)",
            "border-radius": "var(--radius-lg)",
            padding: "var(--spacing-4)",
            "box-shadow": "var(--card-shadow)"
          }}>
            <div style={{
              width: "2rem",
              height: "2rem",
              border: "2px solid var(--border-color)",
              "border-bottom": "2px solid var(--primary-color)",
              "border-radius": "50%",
              animation: "spin 1s linear infinite"
            }}></div>
            <p style={{
              "margin-top": "0.5rem",
              "font-size": "var(--font-size-sm)",
              color: "var(--text-primary)"
            }}>Setting up your trial...</p>
          </div>
        </div>
      </Show>
    </form>
  );
};

export default function TrialSignupScreen(props: RouteSectionProps) {
  return (
    <>
      <SEO
        title="Start Free Trial - BakeWind"
        description="Start your 14-day free trial of BakeWind bakery management software. No credit card required. Experience the complete platform risk-free."
        path="/trial-signup"
      />

      <div class="relative">
        <TrialSignupFormWithAction />
      </div>
    </>
  );
}