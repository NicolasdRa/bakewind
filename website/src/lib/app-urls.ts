/**
 * Application URL Configuration
 *
 * Provides consistent URLs for cross-app navigation.
 * Auth routes now point to admin app since it owns authentication.
 */

// Admin app base URL
const ADMIN_APP_URL = import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:3001';

// Customer app base URL (this app)
const CUSTOMER_APP_URL = import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:3000';

export const APP_URLS = {
  // Admin app base
  ADMIN: ADMIN_APP_URL,

  // Customer app base
  CUSTOMER: CUSTOMER_APP_URL,

  // Auth routes (all in admin app now)
  login: `${ADMIN_APP_URL}/login`,
  trialSignup: `${ADMIN_APP_URL}/trial-signup`,
  register: `${ADMIN_APP_URL}/register`,
  forgotPassword: `${ADMIN_APP_URL}/forgot-password`,

  // Dashboard
  dashboard: `${ADMIN_APP_URL}/dashboard/overview`,
} as const;
