import { Component, createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import * as authApi from '~/api/auth';
import { logger } from '~/utils/logger';
import AuthLayout from '~/layouts/AuthLayout';
import Button from '~/components/common/Button';
import Form from '~/components/common/Form';
import FormFooter from '~/components/common/FormFooter';
import { FormRow } from '~/components/common/FormRow';
import TextField from '~/components/common/TextField';

const Register: Component = () => {
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [confirmPassword, setConfirmPassword] = createSignal('');
  const [firstName, setFirstName] = createSignal('');
  const [lastName, setLastName] = createSignal('');
  const [error, setError] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    if (password() !== confirmPassword()) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      logger.auth(`Attempting registration for: ${email()}`);

      // Use centralized authApi for consistent error handling, logging, and token refresh
      const result = await authApi.register({
        email: email(),
        password: password(),
        firstName: firstName(),
        lastName: lastName(),
      });

      logger.auth(`Registration successful: ${result.user.email}`);
      logger.auth('Redirecting to dashboard - auth will be initialized there...');

      // Navigate to dashboard - ProtectedLayout will initialize auth
      navigate('/dashboard/overview', { replace: true });
    } catch (err) {
      logger.error('Registration failed', err);
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join BakeWind to manage your bakery">
      <Form onSubmit={handleSubmit} error={error()}>
        <FormRow>
          <TextField
            label="First Name"
            type="text"
            id="firstName"
            value={firstName()}
            onInput={(e) => setFirstName(e.currentTarget.value)}
            required
            autocomplete="given-name"
            placeholder="John"
          />
          <TextField
            label="Last Name"
            type="text"
            id="lastName"
            value={lastName()}
            onInput={(e) => setLastName(e.currentTarget.value)}
            required
            autocomplete="family-name"
            placeholder="Smith"
          />
        </FormRow>

        <TextField
          label="Email Address"
          type="email"
          id="email"
          value={email()}
          onInput={(e) => setEmail(e.currentTarget.value)}
          required
          autocomplete="email"
          placeholder="your.email@example.com"
        />

        <FormRow>
          <TextField
            label="Password"
            type="password"
            id="password"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            required
            autocomplete="new-password"
            placeholder="••••••••"
          />
          <TextField
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            value={confirmPassword()}
            onInput={(e) => setConfirmPassword(e.currentTarget.value)}
            required
            autocomplete="new-password"
            placeholder="••••••••"
          />
        </FormRow>

        <Button
          type="submit"
          disabled={isLoading()}
          variant="primary"
          size="lg"
          fullWidth
        >
          {isLoading() ? 'Creating Account...' : 'Create Account'}
        </Button>
      </Form>

      <FormFooter links={[
        { href: "/login", text: "Already have an account? Sign in" }
      ]} />
    </AuthLayout>
  );
};

export default Register;
