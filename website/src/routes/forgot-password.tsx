import { Title, Meta } from "@solidjs/meta";
import { createSignal, Show } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { useAuth } from "../auth/AuthContext";
import "../styles/globals.css";

export default function ForgotPasswordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = createSignal("");
  const [isSubmitted, setIsSubmitted] = createSignal(false);
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal("");

  // Redirect if already authenticated
  if (user()) {
    navigate("/account");
    return null;
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Mock password reset request - in real app this would call API
      // await api.auth.requestPasswordReset(email());

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsSubmitted(true);
    } catch (err) {
      setError("Failed to send password reset email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Title>Forgot Password - BakeWind Bakery</Title>
      <Meta name="description" content="Reset your BakeWind Bakery account password." />

      <main class="min-h-screen bg-bakery-cream flex items-center justify-center py-12">
        <div class="max-w-md w-full mx-4">
          <div class="bg-white rounded-lg shadow-md p-8">
            <Show
              when={!isSubmitted()}
              fallback={
                <div class="text-center">
                  <div class="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <h1 class="text-2xl font-display font-bold text-bakery-brown mb-4">
                    Check Your Email
                  </h1>
                  <p class="text-gray-600 mb-6">
                    We've sent password reset instructions to <strong>{email()}</strong>
                  </p>
                  <p class="text-sm text-gray-500 mb-6">
                    Didn't receive the email? Check your spam folder or try again in a few minutes.
                  </p>
                  <div class="space-y-3">
                    <A href="/login" class="btn-primary w-full text-center block">
                      Back to Login
                    </A>
                    <button
                      onClick={() => {
                        setIsSubmitted(false);
                        setEmail("");
                      }}
                      class="btn-outline w-full"
                    >
                      Try Different Email
                    </button>
                  </div>
                </div>
              }
            >
              {/* Header */}
              <div class="text-center mb-8">
                <h1 class="text-3xl font-display font-bold text-bakery-brown mb-2">
                  Forgot Password?
                </h1>
                <p class="text-gray-600">
                  Enter your email and we'll send you reset instructions
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} class="space-y-6">
                {/* Email Field */}
                <div>
                  <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email()}
                    onInput={(e) => setEmail(e.currentTarget.value)}
                    required
                    class="input-field"
                    placeholder="your.email@example.com"
                    autocomplete="email"
                  />
                </div>

                {/* Error Message */}
                <Show when={error()}>
                  <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error()}
                  </div>
                </Show>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting() || !email()}
                  class="btn-primary w-full justify-center"
                >
                  <Show when={!isSubmitting()} fallback="Sending...">
                    Send Reset Instructions
                  </Show>
                </button>
              </form>

              {/* Links */}
              <div class="mt-6 text-center space-y-2">
                <div>
                  <A
                    href="/login"
                    class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Remember your password? Sign in
                  </A>
                </div>
                <div>
                  <A
                    href="/register"
                    class="text-gray-600 hover:text-gray-700 text-sm"
                  >
                    Don't have an account? Sign up
                  </A>
                </div>
                <div class="pt-4 border-t border-gray-200">
                  <A
                    href="/"
                    class="text-gray-600 hover:text-gray-700 text-sm"
                  >
                    ← Back to Home
                  </A>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </main>
    </>
  );
}