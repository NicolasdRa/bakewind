import { type RouteSectionProps, useSubmission } from "@solidjs/router";
import { Show } from "solid-js";
import { LoginForm } from "~/components/LoginForm";
import { loginUser } from "~/routes/api/auth/login";
import SEO from "~/components/SEO/SEO";

// Route loader to redirect authenticated users
// REMOVED: Session check on GET to prevent "headers already sent" errors
// The login form action will handle authentication properly
export async function GET() {
  "use server";
  console.log('🔐 [LOGIN_ROUTE] Showing login form...');
  return null;
}

const LoginFormWithAction = () => {
  const loginSubmission = useSubmission(loginUser);

  return (
    <form
      method="post"
      action={loginUser}
      style={{
        display: "contents"
      }}
    >
      <LoginForm
        onSubmit={() => {}} // Form submission handled by action
        email=""
        setEmail={() => {}} // Controlled by native form inputs
        password=""
        setPassword={() => {}} // Controlled by native form inputs
      />

      <Show when={loginSubmission.error}>
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
          <span>{loginSubmission.error.message}</span>
        </div>
      </Show>

      <Show when={loginSubmission.pending}>
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
            }}>Signing in...</p>
          </div>
        </div>
      </Show>
    </form>
  );
};

export default function LoginScreen(_props: RouteSectionProps) {
  return (
    <>
      <SEO
        title="Sign In - BakeWind"
        description="Access your bakery management dashboard. Sign in to manage orders, inventory, and grow your bakery business."
        path="/login"
      />

      <div class="relative">
        <LoginFormWithAction />
      </div>
    </>
  );
}