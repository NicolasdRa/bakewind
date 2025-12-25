import { Component, createSignal, Show } from 'solid-js';
import { API_BASE_URL } from '../../config/constants';
import { logger } from '../../utils/logger';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '~/components/common/Button';
import TextField from '~/components/common/TextField';

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
      logger.auth(`Requesting password reset for: ${email()}`);

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Request failed');
      }

      logger.auth('Password reset email sent');
      setSuccess(true);
      setEmail('');
    } catch (err) {
      logger.error('Password reset request failed', err);
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
            <div
              class="p-4 rounded-lg"
              style={{
                "background-color": "var(--success-light)",
                color: "var(--success-color)"
              }}
            >
              <p class="font-medium mb-1">Check your email!</p>
              <p class="text-sm">
                We've sent password reset instructions to your email address.
              </p>
            </div>
            <div class="text-center">
              <a href="/login" style={{ color: "var(--primary-color)" }} class="text-sm font-medium hover:underline">
                ← Back to Login
              </a>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit} class="space-y-6">
          <TextField
            label="Email Address"
            type="email"
            id="email"
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
            required
            placeholder="your.email@example.com"
          />

          {/* Error message */}
          <Show when={error()}>
            <div
              class="p-4 rounded-lg"
              style={{
                "background-color": "var(--error-light)",
                color: "var(--error-color)"
              }}
            >
              {error()}
            </div>
          </Show>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isLoading() || !email()}
            variant="primary"
            size="lg"
            fullWidth
          >
            {isLoading() ? 'Sending...' : 'Send Reset Instructions'}
          </Button>
        </form>

        {/* Links */}
        <div class="mt-6 text-center space-y-2">
          <div>
            <a href="/login" style={{ color: "var(--text-secondary)" }} class="text-sm hover:underline">
              ← Back to Login
            </a>
          </div>
          <div>
            <a href="/trial-signup" style={{ color: "var(--primary-color)" }} class="text-sm font-medium hover:underline">
              Don't have an account? Start free trial
            </a>
          </div>
        </div>
      </Show>
    </AuthLayout>
  );
};

export default ForgotPassword;
