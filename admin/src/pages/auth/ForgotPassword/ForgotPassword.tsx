import { Component, createSignal, Show } from 'solid-js';
import { API_BASE_URL } from '~/config/constants';
import { logger } from '~/utils/logger';
import AuthLayout from '~/layouts/AuthLayout';
import Button from '~/components/common/Button';
import Form from '~/components/common/Form';
import FormFooter from '~/components/common/FormFooter';
import FormMessage from '~/components/common/FormMessage';
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
          <>
            <FormMessage variant="success" title="Check your email!">
              We've sent password reset instructions to your email address.
            </FormMessage>
            <FormFooter links={[
              { href: "/login", text: "← Back to Login" }
            ]} />
          </>
        }
      >
        <Form onSubmit={handleSubmit} error={error()} gap="lg">
          <TextField
            label="Email Address"
            type="email"
            id="email"
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
            required
            placeholder="your.email@example.com"
          />

          <Button
            type="submit"
            disabled={isLoading() || !email()}
            variant="primary"
            size="lg"
            fullWidth
          >
            {isLoading() ? 'Sending...' : 'Send Reset Instructions'}
          </Button>
        </Form>

        <FormFooter links={[
          { href: "/login", text: "← Back to Login", variant: "secondary" },
          { href: "/trial-signup", text: "Don't have an account? Start free trial" }
        ]} />
      </Show>
    </AuthLayout>
  );
};

export default ForgotPassword;
