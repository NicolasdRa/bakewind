import { Title, Meta } from "@solidjs/meta";
import { createSignal, Show } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { useAuth } from "../auth/AuthContext";
import "../styles/globals.css";

export default function LoginPage() {
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [isSubmitting, setIsSubmitting] = createSignal(false);

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
      const success = await login(email(), password());
      if (success) {
        navigate("/account");
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch (err) {
      setError("Login failed. Please check your credentials and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Title>Login - BakeWind Bakery</Title>
      <Meta name="description" content="Sign in to your BakeWind Bakery account to manage orders and preferences." />

      <main class="min-h-screen bg-bakery-cream flex items-center justify-center py-12">
        <div class="max-w-md w-full mx-4">
          <div class="bg-white rounded-lg shadow-md p-8">
            {/* Header */}
            <div class="text-center mb-8">
              <h1 class="text-3xl font-display font-bold text-bakery-brown mb-2">
                Welcome Back
              </h1>
              <p class="text-gray-600">
                Sign in to your account to continue
              </p>
            </div>

            {/* Login Form */}
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
                />
              </div>

              {/* Password Field */}
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                  required
                  class="input-field"
                  placeholder="Enter your password"
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
                disabled={isSubmitting() || !email() || !password()}
                class="btn-primary w-full justify-center"
              >
                <Show when={!isSubmitting()} fallback="Signing In...">
                  Sign In
                </Show>
              </button>
            </form>

            {/* Demo Credentials */}
            <div class="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 class="text-sm font-semibold text-blue-800 mb-2">Demo Account</h3>
              <p class="text-xs text-blue-700 mb-2">Use these credentials to test the application:</p>
              <div class="text-xs font-mono text-blue-600">
                <div>Email: john.doe@example.com</div>
                <div>Password: password123</div>
              </div>
            </div>

            {/* Links */}
            <div class="mt-6 text-center space-y-2">
              <div>
                <A
                  href="/register"
                  class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Don't have an account? Sign up
                </A>
              </div>
              <div>
                <A
                  href="/forgot-password"
                  class="text-gray-600 hover:text-gray-700 text-sm"
                >
                  Forgot your password?
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
          </div>
        </div>
      </main>
    </>
  );
}