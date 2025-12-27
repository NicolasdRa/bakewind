import { Component, createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';

import { logger } from '~/utils/logger';
import * as authApi from '~/api/auth';
import AuthLayout from '~/layouts/AuthLayout';
import Button from '~/components/common/Button';
import Form from '~/components/common/Form';
import FormFooter from '~/components/common/FormFooter';
import TextField from '~/components/common/TextField';

const Login: Component = () => {
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      logger.auth(`Attempting login for: ${email()}`);

      const result = await authApi.login({
        email: email(),
        password: password(),
      });

      logger.auth(`Login successful: ${result.user.email}`);
      logger.auth('Redirecting to dashboard - auth will be initialized there...');

      navigate('/dashboard/overview', { replace: true });
    } catch (err) {
      logger.error('Login failed', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your bakery dashboard"
    >
      <Form onSubmit={handleSubmit} error={error()}>
        <TextField
          label="Email"
          type="email"
          id="email"
          value={email()}
          onInput={(e) => setEmail(e.currentTarget.value)}
          required
          autocomplete="email"
          placeholder="Enter your email"
        />

        <TextField
          label="Password"
          type="password"
          id="password"
          value={password()}
          onInput={(e) => setPassword(e.currentTarget.value)}
          required
          autocomplete="current-password"
          placeholder="Enter your password"
        />

        <Button
          type="submit"
          disabled={isLoading() || !email() || !password()}
          variant="primary"
          size="lg"
          fullWidth
        >
          {isLoading() ? 'Signing In...' : 'Sign In'}
        </Button>
      </Form>

      <FormFooter links={[
        { href: "/trial-signup", text: "Don't have an account? Start free trial" },
        { href: "/forgot-password", text: "Forgot your password?", variant: "secondary" }
      ]} />
    </AuthLayout>
  );
};

export default Login;
