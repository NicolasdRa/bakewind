# Migration: Admin-Centric Authentication

**Date**: 2025-10-04
**Status**: Completed

## Overview

Migrated from dual-frontend authentication (with transfer sessions) to admin-centric authentication where all auth flows happen exclusively in the admin app. The website is now completely stateless and serves only marketing content.

## Problem Statement

The previous architecture had authentication split between two apps:
- **Website**: Handled login/signup with SolidStart SSR
- **Admin**: Dashboard requiring auth via transfer session mechanism
- **Backend**: Complex transfer session management for cross-domain auth

This caused:
- 404 errors during login redirects
- Complex token transfer mechanism
- Code duplication (~1565 lines)
- Difficult to debug auth flows

## Solution

### New Architecture

1. **Website (localhost:3000)**:
   - Pure marketing/landing pages (SSR for SEO)
   - NO authentication state
   - Links to admin app for auth (`<a href={APP_URLS.login}>`)

2. **Admin App (localhost:3001)**:
   - Owns ALL authentication (login, signup, forgot password)
   - Uses httpOnly cookies for secure token storage
   - Direct API calls to backend
   - Client-side SPA after auth

3. **Backend API (localhost:5000)**:
   - Sets httpOnly cookies in login/signup responses
   - Deprecated transfer session endpoints
   - Environment-aware cookie security

## Changes Summary

### Phase 1: Admin Auth Pages
Created complete auth UI in admin app:
- `admin/src/pages/auth/Login.tsx`
- `admin/src/pages/auth/TrialSignup.tsx`
- `admin/src/pages/auth/Register.tsx`
- `admin/src/pages/auth/ForgotPassword.tsx`
- `admin/src/components/auth/AuthLayout.tsx`

### Phase 2: Backend Updates
- Updated cookie configuration (`sameSite: 'lax'`, environment-aware `secure`)
- Deprecated transfer session endpoints (kept as comments for rollback)
- Removed unused DTOs

### Phase 3: Website Simplification
- Created `website/src/lib/app-urls.ts` for cross-app navigation
- Updated all auth links to point to admin app
- Deleted 14 auth-related files (~1565 lines)

### Phase 4: Documentation & Cleanup
- Updated `CLAUDE.md` with new auth flow
- Updated `.env.example` files with correct descriptions
- Created this migration doc
- **Removed reverse proxy setup** (Caddy/nginx no longer needed)
  - Deleted `Caddyfile`, `dev-proxy-start.sh`, `dev-proxy-stop.sh`
  - Deleted `PROXY-SETUP.md` and `.env.proxy` files
  - Removed nginx from `docker-compose.yml`
  - Apps now run independently on separate ports

## Files Modified

### Created (6 files)
- `admin/src/pages/auth/Login.tsx`
- `admin/src/pages/auth/TrialSignup.tsx`
- `admin/src/pages/auth/Register.tsx`
- `admin/src/pages/auth/ForgotPassword.tsx`
- `admin/src/components/auth/AuthLayout.tsx`
- `website/src/lib/app-urls.ts`

### Modified (9 files)
- `admin/src/App.tsx` - Added auth routes, removed basePath proxy config
- `api/src/auth/auth.controller.ts` - Updated cookies, deprecated transfer sessions
- `api/src/auth/auth.service.ts` - Deprecated transfer session methods
- `website/src/routes/index.tsx` - Updated auth links
- `website/src/routes/pricing/(pricing).tsx` - Updated auth links
- `website/src/routes/404/[...404].tsx` - Simplified 404 page
- `CLAUDE.md` - Updated architecture docs, removed proxy references
- `website/.env.example` - Simplified config
- `admin/.env.example` - Updated comments
- `api/.env.example` - Updated frontend URLs
- `docker-compose.yml` - Removed nginx, updated service names

### Deleted (22 files/directories, ~1700+ lines)

**Auth-related files:**
- `website/src/routes/login/` (directory)
- `website/src/routes/register.tsx`
- `website/src/routes/forgot-password.tsx`
- `website/src/routes/trial-signup/` (directory)
- `website/src/routes/logout/` (directory)
- `website/src/routes/select-location/` (directory)
- `website/src/routes/api/auth/login.ts`
- `website/src/routes/api/auth/trial-signup.ts`
- `website/src/routes/api/auth/change-password.ts`
- `website/src/routes/api/auth/logout.ts`
- `website/src/routes/api/auth/select-location.ts`
- `admin/src/pages/AuthCallback.tsx`

**Proxy-related files:**
- `Caddyfile`
- `dev-proxy-start.sh`
- `dev-proxy-stop.sh`
- `PROXY-SETUP.md`
- `admin/.env.proxy`
- `website/.env.proxy`
- `nginx/` (directory)

## Authentication Flow (New)

```
1. User visits website (localhost:3000)
   ↓
2. Clicks "Sign In" or "Start Trial"
   ↓
3. Redirects to admin app (localhost:3001/login or /trial-signup)
   ↓
4. User submits credentials
   ↓
5. Admin app POSTs to backend (/api/v1/auth/login)
   ↓
6. Backend validates, sets httpOnly cookies:
   - accessToken (15min)
   - refreshToken (7 days)
   ↓
7. Admin app updates auth store, redirects to /dashboard/overview
   ↓
8. All subsequent requests automatically include cookies
```

## Cookie Configuration

```typescript
// api/src/auth/auth.controller.ts
private getCookieOptions() {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  return {
    httpOnly: true,
    secure: !isDevelopment, // HTTPS in prod, HTTP in dev
    sameSite: 'lax' as const,
    path: '/',
    // No domain - scoped to serving domain
  };
}
```

## Environment Variables

### Website (.env)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_ADMIN_APP_URL=http://localhost:3001
```

### Admin (.env)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_CUSTOMER_APP_URL=http://localhost:3000
```

### Backend (.env)
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
DASHBOARD_URL=http://localhost:3001/dashboard/overview
LOGIN_URL=http://localhost:3001/login
```

## Rollback Plan

If issues arise, the deprecated transfer session code is preserved as comments in:
- `api/src/auth/auth.controller.ts` (lines 362-466)

To rollback:
1. Uncomment transfer session endpoints
2. Uncomment transfer session DTOs import
3. Restore deleted website auth files from git history
4. Revert website link changes

## Testing Checklist

- [ ] Login from website → admin redirect works
- [ ] Trial signup from website → admin redirect works
- [ ] Direct admin login works
- [ ] Cookies are set correctly (check DevTools)
- [ ] Dashboard loads after auth
- [ ] Refresh token rotation works
- [ ] Logout clears cookies
- [ ] 404 errors resolved

## Benefits

1. **Simplified Architecture**: Single source of truth for auth
2. **Better Security**: httpOnly cookies prevent XSS
3. **Reduced Code**: Removed ~1700+ lines of duplicate auth and proxy code
4. **Industry Standard**: Pattern used by Stripe, Linear, Supabase
5. **Easier Debugging**: Clear separation of concerns
6. **Better UX**: Direct auth flow, no complex handoff
7. **No Reverse Proxy Needed**: Apps run independently, simpler deployment
8. **Easier Development**: No proxy setup, just run `npm run dev` in each app

## Next Steps

1. Deploy to staging environment
2. Test with production-like setup (HTTPS)
3. Update any integration tests
4. Monitor for auth-related errors
5. Consider adding auth analytics

## References

- Original issue: Login leads to 404 instead of dashboard
- Root cause: Transfer session URL construction error
- Solution: Complete elimination of transfer session pattern
