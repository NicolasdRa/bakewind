/**
 * Development-Only Direct Login Page
 *
 * This bypasses the cross-domain cookie issue in localhost development
 * by storing tokens directly in the auth store (memory) instead of cookies.
 *
 * ONLY FOR DEVELOPMENT - Remove or disable in production
 */

import { Component, createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from '../stores/authStore';

const DevLogin: Component = () => {
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);
  const navigate = useNavigate();
  const auth = useAuth();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      // Login directly to API
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email(),
          password: password(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      console.log('[DevLogin] Login successful:', data.user.email);

      // Store user data in auth store
      auth.login(data.user);

      // Navigate to dashboard
      navigate('/', { replace: true });
    } catch (err) {
      console.error('[DevLogin] Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-900 text-center">
            Dev Login
          </h2>
          <p class="text-sm text-gray-600 text-center mt-2">
            Development-only direct login
          </p>
        </div>

        {error() && (
          <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{error()}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@bakewind.com"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading()}
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading() ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div class="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p class="text-xs text-yellow-800">
            <strong>⚠️ Development Only:</strong> This page bypasses the secure cross-domain cookie flow.
            Use the website login (localhost:3000) for testing the production flow.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DevLogin;
