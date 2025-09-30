import { Title, Meta } from "@solidjs/meta";
import { createSignal, Show } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { useAuth } from "../auth/AuthContext";
import "../styles/globals.css";

export default function RegisterPage() {
  const { register, isLoading, user } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = createSignal("");
  const [lastName, setLastName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");
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

    // Validate passwords match
    if (password() !== confirmPassword()) {
      setError("Passwords do not match. Please check and try again.");
      return;
    }

    // Validate password strength
    if (password().length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await register({
        firstName: firstName(),
        lastName: lastName(),
        email: email(),
        password: password(),
      });

      if (success) {
        navigate("/account");
      } else {
        setError("Registration failed. Please check your information and try again.");
      }
    } catch (err) {
      setError("Registration failed. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Title>Register - BakeWind Bakery</Title>
      <Meta name="description" content="Create your BakeWind Bakery account to start ordering fresh baked goods." />

      <main class="min-h-screen bg-bakery-cream flex items-center justify-center py-12">
        <div class="max-w-md w-full mx-4">
          <div class="bg-white rounded-lg shadow-md p-8">
            {/* Header */}
            <div class="text-center mb-8">
              <h1 class="text-3xl font-display font-bold text-bakery-brown mb-2">
                Join BakeWind
              </h1>
              <p class="text-gray-600">
                Create your account to start ordering
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} class="space-y-6">
              {/* Name Fields */}
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName()}
                    onInput={(e) => setFirstName(e.currentTarget.value)}
                    required
                    class="input-field"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName()}
                    onInput={(e) => setLastName(e.currentTarget.value)}
                    required
                    class="input-field"
                    placeholder="Doe"
                  />
                </div>
              </div>

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
                <p class="text-xs text-gray-500 mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword()}
                  onInput={(e) => setConfirmPassword(e.currentTarget.value)}
                  required
                  class="input-field"
                  placeholder="Confirm your password"
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
                disabled={isSubmitting() || !firstName() || !lastName() || !email() || !password() || !confirmPassword()}
                class="btn-primary w-full justify-center"
              >
                <Show when={!isSubmitting()} fallback="Creating Account...">
                  Create Account
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
                  Already have an account? Sign in
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