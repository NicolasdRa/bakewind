import { Component, createSignal, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from '../../stores/authStore';
import AuthLayout from '../../components/auth/AuthLayout';

const Login: Component = () => {
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(false);
  const navigate = useNavigate();
  const auth = useAuth();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

      console.log('[Login] Attempting login for:', email());

      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ email: email(), password: password() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Login failed');
      }

      const data = await response.json();
      console.log('[Login] Login successful:', data.user.email);

      // Update auth store
      auth.login(data.user);

      console.log('[Login] Redirecting to dashboard...');

      // Navigate to dashboard
      navigate('/dashboard/overview', { replace: true });
    } catch (err) {
      console.error('[Login] Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Sign In to BakeWind" subtitle="Access your bakery dashboard">
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

        {/* Password input */}
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
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••"
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
          disabled={isLoading() || !email() || !password()}
          class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {isLoading() ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      {/* Links */}
      <div class="mt-6 text-center space-y-2">
        <div>
          <a href="/trial-signup" class="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Don't have an account? Start free trial
          </a>
        </div>
        <div>
          <a href="/forgot-password" class="text-gray-600 hover:text-gray-700 text-sm">
            Forgot your password?
          </a>
        </div>
      </div>

      {/* Demo credentials */}
      <div class="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 class="text-sm font-semibold text-blue-800 mb-2">Demo Account</h3>
        <p class="text-xs text-blue-700 mb-2">Test the application with:</p>
        <div class="text-xs font-mono text-blue-600">
          <div>Email: admin@bakewind.com</div>
          <div>Password: password123</div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
