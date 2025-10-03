import { Component, createSignal, Show } from 'solid-js';
import AuthLayout from '../../components/auth/AuthLayout';

const ForgotPassword: Component = () => {
  const [email, setEmail] = createSignal('');
  const [error, setError] = createSignal('');
  const [success, setSuccess] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

      console.log('[ForgotPassword] Requesting password reset for:', email());

      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Request failed');
      }

      console.log('[ForgotPassword] Password reset email sent');
      setSuccess(true);
      setEmail('');
    } catch (err) {
      console.error('[ForgotPassword] Request failed:', err);
      setError(err instanceof Error ? err.message : 'Request failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email to receive reset instructions">
      <Show
        when={!success()}
        fallback={
          <div class="space-y-4">
            <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <p class="font-medium mb-1">Check your email!</p>
              <p class="text-sm">
                We've sent password reset instructions to your email address.
              </p>
            </div>
            <div class="text-center">
              <a href="/login" class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                ← Back to Login
              </a>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit} class="space-y-6">
          {/* Email input */}
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your.email@example.com"
            />
          </div>

          {/* Error message */}
          <Show when={error()}>
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error()}
            </div>
          </Show>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading() || !email()}
            class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isLoading() ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </form>

        {/* Links */}
        <div class="mt-6 text-center space-y-2">
          <div>
            <a href="/login" class="text-gray-600 hover:text-gray-700 text-sm">
              ← Back to Login
            </a>
          </div>
          <div>
            <a href="/trial-signup" class="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Don't have an account? Start free trial
            </a>
          </div>
        </div>
      </Show>
    </AuthLayout>
  );
};

export default ForgotPassword;
