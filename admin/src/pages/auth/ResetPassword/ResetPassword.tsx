import { Component, createSignal, Show, onMount } from 'solid-js';
import { useSearchParams, useNavigate } from '@solidjs/router';
import { API_BASE_URL } from '~/config/constants';
import { logger } from '~/utils/logger';
import AuthLayout from '~/layouts/AuthLayout';
import Button from '~/components/common/Button';
import Form from '~/components/common/Form';
import FormFooter from '~/components/common/FormFooter';
import FormMessage from '~/components/common/FormMessage';
import { FormRow } from '~/components/common/FormRow';
import TextField from '~/components/common/TextField';
import { Text } from '~/components/common/Typography';

const ResetPassword: Component = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword] = createSignal('');
  const [confirmPassword, setConfirmPassword] = createSignal('');
  const [error, setError] = createSignal('');
  const [success, setSuccess] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(false);
  const [tokenValid, setTokenValid] = createSignal(true);

  onMount(() => {
    // Check if token is present
    if (!searchParams.token) {
      setTokenValid(false);
      setError('Invalid reset link. Please request a new password reset.');
    }
  });

  const validatePassword = (): string | null => {
    if (password().length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (password() !== confirmPassword()) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      logger.auth('Resetting password...');

      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: searchParams.token,
          password: password(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      logger.auth('Password reset successful');
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      logger.error('Password reset failed', err);
      setError(err instanceof Error ? err.message : 'Password reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Set New Password" subtitle="Enter your new password below">
      <Show when={!tokenValid()}>
        <FormMessage variant="error" title="Invalid Reset Link">
          This password reset link is invalid or has expired.
        </FormMessage>
        <FormFooter links={[
          { href: "/forgot-password", text: "Request a new reset link" }
        ]} />
      </Show>

      <Show when={tokenValid() && !success()}>
        <Form onSubmit={handleSubmit} error={error()} gap="lg">
          <FormRow>
            <TextField
              label="New Password"
              type="password"
              id="password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              required
              placeholder="Enter new password"
            />
            <TextField
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={confirmPassword()}
              onInput={(e) => setConfirmPassword(e.currentTarget.value)}
              required
              placeholder="Confirm new password"
            />
          </FormRow>

          <Text variant="body-sm" color="secondary">
            Password must be at least 8 characters long.
          </Text>

          <Button
            type="submit"
            disabled={isLoading() || !password() || !confirmPassword()}
            variant="primary"
            size="lg"
            fullWidth
          >
            {isLoading() ? 'Resetting...' : 'Reset Password'}
          </Button>
        </Form>

        <FormFooter links={[
          { href: "/login", text: "← Back to Login", variant: "secondary" }
        ]} />
      </Show>

      <Show when={success()}>
        <FormMessage variant="success" title="Password Reset Successful!">
          Your password has been updated. Redirecting to login...
        </FormMessage>
        <FormFooter links={[
          { href: "/login", text: "Go to Login" }
        ]} />
      </Show>
    </AuthLayout>
  );
};

export default ResetPassword;
