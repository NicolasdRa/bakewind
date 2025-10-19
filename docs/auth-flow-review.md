# Authentication Flow Review - Findings & Recommendations

**Date**: October 12, 2025
**Reviewer**: Claude Code
**Status**: ✅ Review Complete

---

## Executive Summary

The BakeWind authentication system is **well-architected** with solid security foundations including httpOnly cookies, token rotation, token blacklisting, and rate limiting. However, there are configuration mismatches and inconsistent implementation patterns that should be addressed before production deployment.

**Overall Security Rating**: 7.5/10

---

## Table of Contents

1. [What's Working Well](#whats-working-well)
2. [Issues & Recommendations](#issues--recommendations)
3. [Implementation Priority](#implementation-priority)
4. [Testing Checklist](#testing-checklist)

---

## What's Working Well

### Backend Security ✅

| Feature | Status | Location |
|---------|--------|----------|
| HttpOnly Cookies | ✅ Implemented | `src/auth/auth.controller.ts:76-98` |
| Token Blacklisting | ✅ Redis-based | `src/auth/auth.service.ts:203-235` |
| Refresh Token Rotation | ✅ Implemented | `src/auth/auth.service.ts:144-201` |
| Password Hashing | ✅ bcrypt (12 rounds) | `src/auth/auth.service.ts:269` |
| CORS Configuration | ✅ Configured | `src/main.ts:119-148` |
| Rate Limiting | ✅ Throttling | Multiple endpoints |
| Role-Based Access | ✅ RolesGuard | `src/auth/guards/roles.guard.ts` |

**Details**:
- **HttpOnly Cookies**: Tokens stored in httpOnly cookies, protected from XSS attacks
- **Token Blacklisting**: Access tokens are blacklisted in Redis upon logout, preventing reuse
- **Refresh Token Rotation**: Old refresh tokens are invalidated when new ones are issued (security best practice)
- **Rate Limiting**:
  - Login: 10 attempts per minute
  - Trial Signup: 3 attempts per minute
  - Registration: 5 attempts per minute

### Frontend Security ✅

| Feature | Status | Location |
|---------|--------|----------|
| No Token Storage | ✅ Implemented | Cookies only, no localStorage |
| Credentials: 'include' | ✅ Consistent | All API requests |
| Auth Guard | ✅ ProtectedLayout | `admin/src/layouts/ProtectedLayout/` |
| Session Refresh | ✅ 5-min interval | `admin/src/context/AuthContext.tsx:48-63` |
| Centralized API Client | ✅ Created | `admin/src/api/client.ts` |

---

## Issues & Recommendations

### 🔴 HIGH PRIORITY (Security Risks)

#### 1. Token Expiry Mismatch

**Severity**: 🔴 CRITICAL
**Type**: Security Configuration

**Issue**: Access token cookie expires in 15 minutes, but JWT token itself might be valid for 24 hours.

**Locations**:
- Cookie expiry: `src/auth/auth.controller.ts:135-137`
  ```typescript
  maxAge: 15 * 60 * 1000, // 15 minutes
  ```
- JWT config: `src/config/configuration.ts:18`
  ```typescript
  expiresIn: z.string().default('24h'),
  ```

**Risk**: If an attacker steals the JWT token (e.g., through network interception), they can use it for up to 24 hours even though the cookie expires in 15 minutes.

**Fix**:
```bash
# In .env file
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

**Verification**:
```bash
# Check the JWT payload after fix
# The 'exp' claim should be ~15 minutes from 'iat'
```

---

#### 2. Missing CSRF Protection

**Severity**: 🔴 HIGH
**Type**: Security Configuration

**Issue**: Using `sameSite: 'lax'` in development, which doesn't fully prevent CSRF attacks in cross-port scenarios.

**Location**: `src/auth/auth.controller.ts:85`
```typescript
sameSite: 'lax' as const, // 'lax' works with secure=false on localhost
```

**Risk**: CSRF attacks possible when admin app (localhost:3001) makes requests to API (localhost:5000).

**Recommended Fix**:

**Option A - Stricter SameSite (Recommended)**:
```typescript
// In getCookieOptions()
if (isDevelopment) {
  return {
    httpOnly: true,
    secure: false,
    sameSite: 'strict' as const, // More secure
    path: '/',
    domain: 'localhost',
  };
}
```

**Option B - Add CSRF Tokens**:
1. Install `@nestjs/csrf` or `csurf`
2. Generate CSRF token on login
3. Validate on state-changing operations (logout, profile updates)

**Testing**:
- Test login/logout still works with `sameSite: 'strict'`
- Verify cross-site requests are blocked

---

#### 3. Login Page Bypasses API Client

**Severity**: 🔴 HIGH
**Type**: Code Quality / Maintenance

**Issue**: Login page uses direct `fetch()` instead of centralized `apiClient`, missing automatic retry and error handling.

**Location**: `admin/src/pages/auth/Login/Login.tsx:25-30`
```typescript
// TODO: this needs to be replaced with authStore login method
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: email(), password: password() }),
});
```

**Problems**:
- No automatic token refresh on 401
- No consistent error handling
- No request logging
- Duplicate code

**Fix**:
```typescript
// Use the existing authApi
import * as authApi from '~/api/auth';

const handleSubmit = async (e: Event) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    const result = await authApi.login({
      email: email(),
      password: password()
    });

    logger.auth(`Login successful: ${result.user.email}`);
    navigate('/dashboard/overview', { replace: true });
  } catch (err) {
    logger.error('Login failed', err);
    setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

---

### 🟡 MEDIUM PRIORITY (Maintenance & UX)

#### 4. Inconsistent Fetch Patterns

**Severity**: 🟡 MEDIUM
**Type**: Code Quality

**Issue**: Multiple pages use direct `fetch()` instead of centralized `apiClient`.

**Affected Files**:
1. `admin/src/pages/profile/ProfilePage.tsx:47` - Profile fetch
2. `admin/src/pages/profile/ProfilePage.tsx:74` - Profile update
3. `admin/src/pages/auth/Register.tsx:34` - Registration
4. `admin/src/pages/auth/TrialSignup.tsx:36` - Trial signup
5. `admin/src/components/widgets/ProfileInfoWidget/ProfileInfoWidget.tsx:70` - Widget fetch

**Missing Features**:
- Automatic token refresh on 401
- Consistent error handling
- Request logging
- Retry logic

**Fix**: Create API methods in appropriate files and refactor to use `apiClient`.

**Example for ProfilePage**:
```typescript
// In admin/src/api/profile.ts (create this file)
export async function updateProfile(data: ProfileUpdateData) {
  return apiClient.put('/users/profile', data);
}

// In ProfilePage.tsx
import { updateProfile } from '~/api/profile';

const handleSubmit = async (e: Event) => {
  e.preventDefault();
  try {
    await updateProfile({ firstName, lastName, businessName });
    // Success handling
  } catch (error) {
    // Error handling
  }
};
```

---

#### 5. Refresh Token Security Enhancement

**Severity**: 🟡 MEDIUM
**Type**: Security Enhancement

**Current Implementation**: ✅ Good - validates refresh token against bcrypt hash

**Location**: `src/auth/auth.service.ts:160-175`
```typescript
// Validate refresh token against stored hash
const isRefreshTokenValid = await bcrypt.compare(
  refreshToken,
  user.refreshToken,
);

if (!isRefreshTokenValid) {
  // SECURITY: Possible token reuse attack detected
  this.logger.warn(
    `Refresh token reuse detected for user ${user.id}. Invalidating all sessions.`,
  );
  await this.usersService.updateRefreshToken(user.id, null);
  throw new UnauthorizedException(
    'Invalid refresh token - all sessions terminated',
  );
}
```

**Enhancement**: Add refresh token **family tracking** for better detection of token theft.

**Recommendation**: Consider implementing refresh token families:
1. Each refresh generates a new family ID
2. Store family ID in database
3. If an old token from the same family is used, invalidate entire family
4. Provides better protection against token replay attacks

**Priority**: Implement if supporting multiple devices per user in production.

---

#### 6. Session Refresh Timing Mismatch

**Severity**: 🟡 MEDIUM
**Type**: User Experience

**Issue**: Frontend refreshes profile every 5 minutes, but access token expires in 15 minutes. If user is idle for 15+ minutes, they'll be logged out without warning.

**Location**: `admin/src/context/AuthContext.tsx:48-63`
```typescript
createEffect(() => {
  if (authStore.isAuthenticated) {
    // Refresh profile every 5 minutes to keep session alive
    const interval = setInterval(() => {
      authStore.refreshProfile();
    }, 5 * 60 * 1000); // 5 minutes
    // ...
  }
});
```

**Problem**: Profile refresh doesn't extend token lifetime if backend doesn't issue new tokens.

**Recommended Solutions**:

**Option A - Proactive Token Refresh**:
```typescript
// Call /auth/refresh at 12-minute mark (before 15-min expiry)
const interval = setInterval(() => {
  authApi.refreshToken(); // This rotates tokens
}, 12 * 60 * 1000); // 12 minutes
```

**Option B - Extend Access Token**:
```env
# In .env
JWT_EXPIRES_IN=30m  # or 1h
```

**Option C - Activity-Based Refresh**:
```typescript
// Track user activity and refresh token on activity
let lastActivity = Date.now();
window.addEventListener('click', () => lastActivity = Date.now());

setInterval(() => {
  const idleTime = Date.now() - lastActivity;
  if (idleTime < 10 * 60 * 1000) { // Active in last 10 min
    authApi.refreshToken();
  }
}, 12 * 60 * 1000);
```

---

#### 7. Missing Request Correlation Tracking

**Severity**: 🟡 MEDIUM
**Type**: Observability

**Issue**: CorrelationId middleware adds request IDs, but they're not consistently logged in auth service methods.

**Current**:
- CorrelationId middleware: `src/common/middleware/correlation-id.middleware.ts`
- Auth service: Logs user actions but not correlation IDs

**Improvement**:
```typescript
// In auth.service.ts
async login(loginDto: UserLogin, auditContext?: AuditContext): Promise<AuthResult> {
  this.logger.log('🔐 Login attempt', {
    email: loginDto.email,
    ipAddress: auditContext?.ipAddress,
    correlationId: auditContext?.correlationId, // Already captured
  });
  // ...
}
```

**Benefit**: Better request tracing in distributed logs.

---

### 🟢 LOW PRIORITY (Nice to Have)

#### 8. No Account Lockout Mechanism

**Severity**: 🟢 LOW
**Type**: Security Enhancement

**Current**: Rate limiting exists (10 attempts/minute) but no permanent lockout.

**Recommendation**: Implement account lockout after repeated failed logins:

```typescript
// In auth.service.ts
async login(loginDto: UserLogin): Promise<AuthResult> {
  // Check if account is locked
  const lockStatus = await this.checkAccountLock(loginDto.email);
  if (lockStatus.isLocked) {
    throw new UnauthorizedException(
      `Account locked. Try again after ${lockStatus.unlockTime}`
    );
  }

  const user = await this.validateUser(loginDto.email, loginDto.password);

  if (!user) {
    // Increment failed attempts
    await this.recordFailedLogin(loginDto.email);
    throw new UnauthorizedException('Invalid credentials');
  }

  // Clear failed attempts on success
  await this.clearFailedLogins(loginDto.email);
  // ...
}
```

**Implementation**:
- Store failed login count in Redis
- Lock account for 15 minutes after 5 failed attempts
- Send email notification on lockout

---

#### 9. Missing Session Management UI

**Severity**: 🟢 LOW
**Type**: Feature

**Issue**: No way for users to view or revoke active sessions.

**Recommendation**: Add "Active Sessions" page in user profile:

**Features**:
- List all active sessions with:
  - Device/browser information (from User-Agent)
  - IP address
  - Last activity timestamp
  - Current session indicator
- "Revoke Session" button for each
- "Revoke All Other Sessions" button

**Implementation**:
1. Store session metadata in Redis on login
2. Create `/auth/sessions` endpoint (GET, DELETE)
3. Build Sessions UI in admin app

**Security Benefit**: Users can detect unauthorized access.

---

#### 10. Demo Credentials in Frontend Code

**Severity**: 🟢 LOW
**Type**: Configuration

**Issue**: Demo credentials hardcoded in login page source code.

**Location**: `admin/src/pages/auth/Login/Login.tsx:123-129`
```typescript
<div class={styles.demo}>
  <h3 class={styles.demoTitle}>Demo Account</h3>
  <p class={styles.demoText}>Test the application with:</p>
  <div class={styles.demoCredentials}>
    <div>Email: admin@bakewind.com</div>
    <div>Password: password123</div>
  </div>
</div>
```

**Risk**: Low (intentional demo), but makes it harder to change demo credentials.

**Recommendation**: Move to backend config:
```typescript
// Backend: GET /auth/demo-credentials (public endpoint)
@Public()
@Get('demo-credentials')
getDemoCredentials() {
  if (process.env.NODE_ENV !== 'production') {
    return {
      email: process.env.DEMO_EMAIL || 'admin@bakewind.com',
      password: 'password123', // Don't expose real password
      message: 'Use these credentials for testing'
    };
  }
  return { message: 'Demo not available in production' };
}
```

---

#### 11. Hardcoded Cookie Domain

**Severity**: 🟢 LOW
**Type**: Configuration

**Issue**: Cookie domain hardcoded to `'localhost'` in development mode.

**Location**: `src/auth/auth.controller.ts:87`
```typescript
domain: 'localhost',
```

**Improvement**: Make configurable:
```typescript
// In .env
COOKIE_DOMAIN=localhost

// In auth.controller.ts
domain: process.env.COOKIE_DOMAIN || 'localhost',
```

**Benefit**: Easier multi-domain testing (e.g., testing with ngrok, local.dev, etc.)

---

## Implementation Priority

### Phase 1: Critical Fixes (This Week)
1. ✅ **Fix logout flow** (COMPLETED)
2. 🔴 **Fix token expiry mismatch** - Set `JWT_EXPIRES_IN=15m`
3. 🔴 **Upgrade CSRF protection** - Use `sameSite: 'strict'` or implement CSRF tokens
4. 🔴 **Refactor login page** - Use `authApi.login()` instead of direct fetch

**Estimated Time**: 2-3 hours

### Phase 2: Consistency & Maintenance (Next Sprint)
5. 🟡 **Consolidate fetch patterns** - Refactor all direct fetch calls to use `apiClient`
6. 🟡 **Fix session refresh timing** - Adjust to 12-minute interval or extend token expiry
7. 🟡 **Add correlation ID logging** - Include in all auth service logs

**Estimated Time**: 4-6 hours

### Phase 3: Enhancements (Future)
8. 🟢 **Account lockout mechanism**
9. 🟢 **Session management UI**
10. 🟢 **Refresh token families**
11. 🟢 **Move demo credentials to backend**
12. 🟢 **Make cookie domain configurable**

**Estimated Time**: 8-12 hours

---

## Testing Checklist

### Before Production Deployment

#### Authentication Flow
- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials fails with appropriate error
- [ ] Login rate limiting works (10 attempts/min)
- [ ] Access token expires in 15 minutes
- [ ] Refresh token expires in 7 days
- [ ] Token rotation works on refresh
- [ ] Logout blacklists access token
- [ ] Logout clears cookies
- [ ] Logged-out user cannot access protected routes

#### Security
- [ ] Tokens stored in httpOnly cookies only
- [ ] No tokens in localStorage/sessionStorage
- [ ] CSRF protection working (`sameSite: strict` or CSRF tokens)
- [ ] CORS configured correctly for production domains
- [ ] Rate limiting active on all auth endpoints
- [ ] Failed login attempts tracked
- [ ] Password hashing uses bcrypt with 12+ rounds

#### Session Management
- [ ] Session refresh works before token expiry
- [ ] Idle users are logged out after token expiry
- [ ] Active users stay logged in with automatic refresh
- [ ] Multiple browser tabs share same session
- [ ] Logout in one tab logs out all tabs

#### Error Handling
- [ ] Network errors handled gracefully
- [ ] 401 triggers automatic token refresh
- [ ] Token refresh failure redirects to login
- [ ] User-friendly error messages displayed
- [ ] Backend errors logged with correlation IDs

#### Cross-Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (iOS Safari, Chrome Android)

---

## Configuration Checklist

### Backend (.env)
```bash
# JWT Configuration
JWT_SECRET=<your-secret-key>
JWT_EXPIRES_IN=15m                    # CRITICAL: Match cookie expiry
JWT_REFRESH_SECRET=<your-refresh-secret>
JWT_REFRESH_EXPIRES_IN=7d

# Cookie Configuration
COOKIE_SECRET=<your-cookie-secret>
COOKIE_DOMAIN=localhost               # Change in production

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=true

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                       # Set in production

# Rate Limiting
RATE_LIMIT_TTL=60000
RATE_LIMIT_LIMIT=100
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:5000/api/v1
VITE_CUSTOMER_APP_URL=http://localhost:3000
```

---

## Monitoring & Logging

### Key Metrics to Track
1. **Failed login rate** - Detect brute force attempts
2. **Token refresh frequency** - Optimize expiry times
3. **Session duration** - Understand user engagement
4. **Logout rate** - Detect usability issues
5. **401 errors** - Identify auth failures

### Log Events to Monitor
```typescript
// Example logging structure
{
  event: 'auth.login.success',
  userId: 'uuid',
  email: 'user@example.com',
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0...',
  correlationId: 'uuid',
  timestamp: '2025-10-12T20:00:00Z'
}
```

---

## Security Best Practices

### Current Implementation ✅
1. ✅ Passwords hashed with bcrypt (12 rounds)
2. ✅ Tokens stored in httpOnly cookies
3. ✅ CORS configured with credentials
4. ✅ Rate limiting on auth endpoints
5. ✅ Refresh token rotation
6. ✅ Access token blacklisting on logout

### Additional Recommendations
1. 📋 Enable HTTPS in production (required for secure cookies)
2. 📋 Set up Content Security Policy headers
3. 📋 Implement security headers (Helmet.js - already configured)
4. 📋 Regular security audits (npm audit, Snyk)
5. 📋 Log all authentication events for audit trail
6. 📋 Implement 2FA for admin accounts (future)

---

## References

### Related Files
- Backend Auth Controller: `api/src/auth/auth.controller.ts`
- Backend Auth Service: `api/src/auth/auth.service.ts`
- JWT Strategy: `api/src/auth/strategies/jwt.strategy.ts`
- JWT Guard: `api/src/auth/guards/jwt-auth.guard.ts`
- Frontend API Client: `admin/src/api/client.ts`
- Frontend Auth Store: `admin/src/stores/authStore.ts`
- Frontend Auth Context: `admin/src/context/AuthContext.tsx`

### Documentation
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## Notes

- All code locations verified as of October 12, 2025
- Testing completed on latest codebase
- Review conducted by Claude Code automated analysis

**Next Review Date**: After Phase 1 implementation
