import { Component, createSignal, Show } from 'solid-js';
import { useNavigate, A } from '@solidjs/router';

import styles from './Login.module.css';
import { logger } from '~/utils/logger';
import * as authApi from '~/api/auth';


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

      // Use centralized authApi for consistent error handling, logging, and token refresh
      const result = await authApi.login({
        email: email(),
        password: password(),
      });

      logger.auth(`Login successful: ${result.user.email}`);
      logger.auth('Redirecting to dashboard - auth will be initialized there...');

      // Navigate to dashboard - ProtectedLayout will initialize auth
      navigate('/dashboard/overview', { replace: true });
    } catch (err) {
      logger.error('Login failed', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class={styles.container}>
      {/* Header */}
      <header class={styles.header}>
        <div class={styles.logoLink}>
          <svg width="32" height="32" viewBox="0 0 100 100" fill="none" style="color: var(--primary-color)">
            <path d="M50 10 L90 90 L10 90 Z" fill="currentColor" />
          </svg>
        </div>
      </header>

      <main class={styles.main}>
        <div class={styles.headerText}>
          <h2 class={styles.title}>Welcome back</h2>
          <p class={styles.subtitle}>Sign in to access your bakery dashboard</p>
        </div>

        <form onSubmit={handleSubmit} class={styles.form}>
          <label class={styles.label}>
            Email
            <input
              type="email"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              required
              autocomplete="email"
              placeholder="Enter your email"
              class={styles.input}
            />
          </label>

          <label class={styles.label}>
            Password
            <input
              type="password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              required
              autocomplete="current-password"
              placeholder="Enter your password"
              class={styles.input}
            />
          </label>

          <Show when={error()}>
            <div class={styles.error}>
              {error()}
            </div>
          </Show>

          <button
            type="submit"
            disabled={isLoading() || !email() || !password()}
            class={styles.submitButton}
          >
            {isLoading() ? 'Signing In...' : 'Sign In'}
          </button>

          <div class={styles.links}>
            <div>
              <A href="/trial-signup" class={styles.link}>
                Don't have an account? Start free trial
              </A>
            </div>
            <div>
              <A href="/forgot-password" class={styles.linkSecondary}>
                Forgot your password?
              </A>
            </div>
          </div>

          <div class={styles.demo}>
            <h3 class={styles.demoTitle}>Demo Account</h3>
            <p class={styles.demoText}>Test the application with:</p>
            <div class={styles.demoCredentials}>
              <div>Email: admin@bakewind.com</div>
              <div>Password: password123</div>
            </div>
          </div>
        </form>
      </main>

      <footer class={styles.footer}>
        <a href="#" class={styles.footerLink}>
          About Us
        </a>
        <a href="#" class={styles.footerLink}>
          Privacy Policy & Terms →
        </a>
      </footer>
    </div>
  );
};

export default Login;
