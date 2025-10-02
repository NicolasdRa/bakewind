import { Component, onMount, createSignal } from 'solid-js';
import { useNavigate, useSearchParams } from '@solidjs/router';
import { useAuth } from '../stores/authStore';

/**
 * Auth Callback Page
 *
 * This page handles the secure auth callback from the customer website.
 * It exchanges the session ID for tokens via server-to-server communication.
 */
const AuthCallback: Component = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [error, setError] = createSignal<string | null>(null);
  const [isProcessing, setIsProcessing] = createSignal(true);

  onMount(async () => {
    console.log('[AuthCallback] Processing auth callback...');

    try {
      const sessionId = searchParams.session;

      if (!sessionId) {
        console.error('[AuthCallback] No session ID in URL');
        setError('Invalid authentication session');
        setIsProcessing(false);
        return;
      }

      console.log('[AuthCallback] Exchanging session ID for tokens:', sessionId);

      // Exchange session ID for tokens via API
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/auth/exchange-transfer-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to exchange session');
      }

      const { accessToken, refreshToken, userId } = await response.json();
      console.log('[AuthCallback] Tokens received for user:', userId);

      // Store tokens in httpOnly cookies via login endpoint
      // This will set the cookies and return user data
      const loginResponse = await fetch(`${apiUrl}/auth/create-cookie-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: allow cookies to be set
        body: JSON.stringify({ accessToken, refreshToken }),
      });

      if (!loginResponse.ok) {
        throw new Error('Failed to create cookie session');
      }

      // Get user profile (now using cookies)
      const profileResponse = await fetch(`${apiUrl}/auth/me`, {
        credentials: 'include', // Send cookies
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const userProfile = await profileResponse.json();
      console.log('[AuthCallback] User profile loaded:', userProfile.email);

      // Store user data in auth store (tokens are in cookies now)
      auth.login(userProfile);

      console.log('[AuthCallback] Auth successful, redirecting to dashboard...');

      // Clean up URL and redirect to dashboard
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('[AuthCallback] Auth callback failed:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setIsProcessing(false);
    }
  });

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {isProcessing() ? (
          <>
            <div class="flex justify-center mb-4">
              <div class="loading-spinner w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 class="text-xl font-semibold text-center text-gray-800 mb-2">
              Authenticating...
            </h2>
            <p class="text-center text-gray-600">
              Please wait while we securely log you in.
            </p>
          </>
        ) : (
          <>
            <div class="flex justify-center mb-4">
              <svg class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-center text-gray-800 mb-2">
              Authentication Failed
            </h2>
            <p class="text-center text-gray-600 mb-6">
              {error() || 'An error occurred during authentication'}
            </p>
            <button
              onClick={() => {
                const customerAppUrl = import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:3000';
                window.location.href = `${customerAppUrl}/login`;
              }}
              class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              type="button"
            >
              Return to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
