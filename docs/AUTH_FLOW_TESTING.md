# Authentication Flow Testing Guide

## Overview
This guide explains how to test the complete authentication flow between the BakeWind customer app and admin dashboard.

## System Architecture

- **Customer App** (bakewind-customer): Port 3000 - SSR SolidStart app for landing pages and authentication
- **Admin Dashboard** (bakewind-admin): Port 3001 - Client-side SPA for bakery management
- **Backend API** (bakewind-api): Port 5000 - NestJS API with PostgreSQL

## Authentication Flow

### 1. Unauthenticated User Visits Admin Dashboard
- User goes to `http://localhost:3001`
- Admin app checks for stored tokens in localStorage
- If no valid tokens found, displays "Authentication Required" page
- User clicks "Go to Login" button
- Redirects to `http://localhost:3000/login` (customer app)

### 2. User Logs In
- User enters credentials on customer app login page
- Customer app sends credentials to API (`POST /api/v1/auth/login`)
- API validates credentials and returns:
  - `user` object with role and profile data
  - `accessToken` (15 min expiry)
  - `refreshToken` (7 day expiry)

### 3. Permission-Based Redirect
The customer app checks the user's role and determines where to redirect:

#### Roles That Redirect to Admin Dashboard:
- `ADMIN` - Full access to all features
- `MANAGER` - Management features
- `HEAD_BAKER` - Production and inventory
- `BAKER` - Basic dashboard access
- `HEAD_PASTRY_CHEF` - Production features
- `PASTRY_CHEF` - Basic dashboard access
- `CASHIER` - Orders and customers
- `VIEWER` - Read-only dashboard access
- `trial_user` - Trial account
- `subscriber` - Paid subscriber

#### Roles That Stay in Customer App:
- `CUSTOMER` - Profile page only
- `GUEST` - Profile page only

### 4. Token Handoff to Admin Dashboard
When redirecting to admin dashboard, the customer app:
1. Gets tokens from auth state
2. Encodes user data as URL parameter
3. Redirects to: `http://localhost:3001?accessToken=xxx&refreshToken=xxx&user=<encoded_user_data>`

### 5. Admin Dashboard Receives Authentication
1. Admin app detects URL parameters with tokens
2. Stores tokens in localStorage
3. Parses and stores user data
4. Cleans up URL (removes tokens from browser history)
5. User is now authenticated and can access dashboard

### 6. Session Management
- Access tokens expire in 15 minutes
- Admin app automatically refreshes tokens before expiry
- Refresh tokens expire in 7 days
- Session check runs every 5 minutes to verify user is still authenticated
- If refresh fails, user is logged out and redirected to login

## Testing Steps

### Setup
1. Start the backend API:
   ```bash
   cd bakewind-api
   npm run start:dev
   ```

2. Start the customer app:
   ```bash
   cd bakewind-customer
   npm run dev
   # Should start on http://localhost:3000
   ```

3. Start the admin dashboard:
   ```bash
   cd bakewind-admin
   npm run dev
   # Should start on http://localhost:3001
   ```

### Test Case 1: Fresh Login Flow
1. Clear browser localStorage and cookies
2. Visit `http://localhost:3001`
3. Verify: "Authentication Required" page displays
4. Click "Go to Login" button
5. Verify: Redirects to `http://localhost:3000/login`
6. Enter credentials:
   - Email: `admin@bakewind.com`
   - Password: `password123`
7. Click "Sign In"
8. Verify: Automatically redirects to `http://localhost:3001`
9. Verify: Dashboard loads with user info displayed
10. Verify: Navigation menu shows user email
11. Verify: URL is clean (no tokens visible)

### Test Case 2: Already Authenticated
1. With valid session from Test Case 1
2. Visit `http://localhost:3001`
3. Verify: Dashboard loads immediately (no redirect)
4. Verify: User stays logged in

### Test Case 3: Direct Admin Dashboard Access
1. Clear localStorage
2. Try to visit `http://localhost:3001/orders`
3. Verify: Shows "Authentication Required" page
4. Click "Go to Login"
5. Login with credentials
6. Verify: Redirects back to admin dashboard root

### Test Case 4: Different Role Access
Test with different user accounts:

- **Admin**: `admin@bakewind.com` / `password123`
  - Should have access to all features

- **Manager**: `manager@bakewind.com` / `password123`
  - Should have access to management features

- **Staff (Baker)**: `staff@bakewind.com` / `password123`
  - Should have limited dashboard access

### Test Case 5: Logout Flow
1. From authenticated admin dashboard
2. Click "Logout" button
3. Verify: Tokens are cleared from localStorage
4. Verify: Redirects to `http://localhost:3000/login`
5. Try to go back to `http://localhost:3001`
6. Verify: Shows "Authentication Required" again

### Test Case 6: Token Expiration
1. Login successfully
2. Wait 15+ minutes for access token to expire
3. Make an API call (navigate to different page)
4. Verify: Admin app automatically refreshes token
5. Verify: User stays logged in seamlessly

### Test Case 7: Invalid Credentials
1. Go to `http://localhost:3000/login`
2. Enter invalid credentials
3. Verify: Error message displays
4. Verify: Does not redirect to admin dashboard

## Environment Configuration

### Customer App (.env)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_ADMIN_APP_URL=http://localhost:3001
```

### Admin Dashboard (.env)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_CUSTOMER_APP_URL=http://localhost:3000
```

## Available Test Accounts

All accounts use password: `password123`

| Email | Role | Access Level |
|-------|------|-------------|
| admin@bakewind.com | ADMIN | Full access |
| manager@bakewind.com | MANAGER | Management features |
| staff@bakewind.com | BAKER | Production access |
| viewer@bakewind.com | VIEWER | Read-only |

## Common Issues & Solutions

### Issue: Port Already in Use
**Symptoms**: App can't start on configured port
**Solution**: Kill existing process or use different port
```bash
# Find process on port
lsof -i :3000
# Kill process
kill <PID>
```

### Issue: Redirect Loop
**Symptoms**: Constant redirecting between apps
**Solution**:
- Clear localStorage and cookies
- Verify environment variables are correct
- Check that both apps use correct URLs

### Issue: Tokens Not Being Passed
**Symptoms**: Login successful but admin dashboard shows "Authentication Required"
**Solution**:
- Check browser console for errors
- Verify `authStore.dashboardUrl()` is being called
- Check URL parameters are being passed correctly

### Issue: CORS Errors
**Symptoms**: API requests fail with CORS errors
**Solution**:
- Verify backend CORS configuration allows frontend origins
- Check API is running on correct port (5000)

## Debugging Tips

1. **Check Browser Console**: Look for errors in both customer and admin apps
2. **Check Network Tab**: Verify API calls are being made correctly
3. **Check localStorage**: Verify tokens are being stored
4. **Check URL Parameters**: Verify tokens are being passed during redirect
5. **Check Backend Logs**: Verify API is receiving and processing requests

## Security Notes

- Tokens are passed via URL parameters during handoff (single use)
- Tokens are immediately stored in localStorage and removed from URL
- Access tokens have short expiry (15 min)
- Refresh tokens have longer expiry (7 days)
- All API requests use HTTPS in production
- Tokens are never logged or exposed in browser history after initial handoff