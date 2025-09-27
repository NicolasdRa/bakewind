# Quickstart: BakeWind SaaS Landing & Customer Portal

**Date**: 2025-09-27
**Feature**: 002-bakewind-customer-landing

## Prerequisites

- Node.js 22+ installed
- PostgreSQL database running
- Stripe test account configured
- BakeWind API server running on localhost:5000
- BakeWind Customer frontend running on localhost:3001

## Environment Setup

```bash
# Backend environment variables
export VITE_API_URL=http://localhost:5000
export STRIPE_PUBLISHABLE_KEY=pk_test_...
export STRIPE_SECRET_KEY=sk_test_...
export JWT_SECRET=your-jwt-secret
export DATABASE_URL=postgresql://user:pass@localhost:5432/bakewind

# Frontend environment variables
export VITE_API_URL=http://localhost:5000
export VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Quick Validation Tests

### Test 1: Landing Page Load Performance
**Validates**: FR-001 (Public landing page showcasing software features)

```bash
# Start both servers
cd bakewind-api && npm run start:dev &
cd bakewind-customer && npm run dev &

# Test page load speed
curl -w "%{time_total}\n" -o /dev/null -s http://localhost:3001/

# Expected: Response time < 200ms
# Expected: Page shows BakeWind software features and trial CTA
```

**Manual Verification**:
1. Visit http://localhost:3001/
2. Verify hero section shows "Modern Bakery Management Made Simple"
3. Verify "Start Free Trial" button is prominently displayed
4. Verify features section shows 6 software capabilities
5. Verify responsive design on mobile viewport

### Test 2: Trial Signup Flow
**Validates**: FR-002, FR-006, FR-008, FR-009 (Trial account creation with validation)

```bash
# Test trial signup API endpoint
curl -X POST http://localhost:5000/auth/trial-signup \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Bakery",
    "fullName": "John Test",
    "email": "john@testbakery.com",
    "phone": "+1 555-123-4567",
    "password": "SecurePass123!",
    "locations": "2-3",
    "agreeToTerms": true
  }'

# Expected: 201 status with user object and JWT tokens
# Expected: Trial account created with 14-day expiration
```

**Manual Verification**:
1. Visit http://localhost:3001/trial-signup
2. Fill all required fields with valid business information
3. Submit form and verify:
   - Loading state appears during submission
   - Success redirect to dashboard occurs
   - Welcome email sent (check logs)
   - Database has new user with role=trial_user

### Test 3: Existing Subscriber Login
**Validates**: FR-003, FR-013, FR-015 (Subscriber authentication and dashboard redirect)

```bash
# Create test subscriber first
curl -X POST http://localhost:5000/auth/trial-signup \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Existing Bakery",
    "fullName": "Jane Subscriber",
    "email": "jane@existingbakery.com",
    "phone": "+1 555-987-6543",
    "password": "ExistingPass123!",
    "locations": "1",
    "agreeToTerms": true
  }'

# Update user to subscriber status (simulate conversion)
# Then test login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@existingbakery.com",
    "password": "ExistingPass123!"
  }'

# Expected: 200 status with user object and dashboard redirect URL
```

**Manual Verification**:
1. Visit http://localhost:3001/login
2. Enter existing subscriber credentials
3. Verify:
   - Authentication succeeds
   - Redirect to appropriate dashboard based on role
   - Session persists across page reloads
   - Logout functionality works

### Test 4: Pricing Page with Plan Comparison
**Validates**: FR-005 (Subscription pricing plans with feature comparison)

```bash
# Test subscription plans API
curl http://localhost:5000/subscriptions/plans

# Expected: Array of 4 plans (Starter, Professional, Business, Enterprise)
# Expected: Each plan has pricing, features, and metadata
```

**Manual Verification**:
1. Visit http://localhost:3001/pricing
2. Verify 4 subscription plans displayed
3. Verify "Most Popular" badge on Professional plan
4. Verify feature comparison shows clear differences
5. Verify all CTAs lead to trial signup or login
6. Verify responsive design and mobile usability

### Test 5: Software Feature Showcase
**Validates**: FR-004, FR-014 (Feature demos and marketing content)

```bash
# Test software features API
curl http://localhost:5000/features

# Expected: Array of BakeWind software features
# Expected: Features categorized and include demo links
```

**Manual Verification**:
1. Visit landing page features section
2. Verify 6 feature cards with icons and descriptions
3. Verify each feature focuses on business benefits
4. Verify demo links work (if implemented)
5. Verify features map to subscription plans correctly

### Test 6: Authentication Security
**Validates**: Security requirements and session management

```bash
# Test JWT token validation
TOKEN=$(curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@existingbakery.com","password":"ExistingPass123!"}' \
  | jq -r '.accessToken')

# Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/auth/me

# Expected: 200 status with user profile
# Test invalid token
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:5000/auth/me

# Expected: 401 status
```

**Manual Verification**:
1. Verify passwords are hashed in database (never plaintext)
2. Verify JWT tokens expire appropriately
3. Verify refresh token rotation works
4. Verify CORS headers prevent unauthorized origins
5. Verify rate limiting on auth endpoints

## Database Validation

### Verify Schema Creation
```sql
-- Check required tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'users', 'trial_accounts', 'subscription_plans',
  'software_features', 'user_sessions'
);

-- Verify trial user creation
SELECT id, email, role, subscription_status, trial_ends_at
FROM users
WHERE email = 'john@testbakery.com';

-- Verify trial account record
SELECT signup_source, business_size, onboarding_completed
FROM trial_accounts
WHERE user_id = (SELECT id FROM users WHERE email = 'john@testbakery.com');
```

### Test Data Setup
```sql
-- Insert subscription plans
INSERT INTO subscription_plans (id, name, description, price_monthly_usd, price_annual_usd, max_locations, sort_order) VALUES
('plan-starter', 'Starter', 'Perfect for small bakeries', 4900, 47040, 1, 1),
('plan-professional', 'Professional', 'Ideal for growing bakeries', 14900, 143040, 3, 2),
('plan-business', 'Business', 'Comprehensive solution', 39900, 383040, 10, 3),
('plan-enterprise', 'Enterprise', 'Custom enterprise solution', 0, 0, NULL, 4);

-- Insert software features
INSERT INTO software_features (id, name, description, icon_name, category, available_in_plans, sort_order) VALUES
('feat-orders', 'Order Management', 'Track customer orders in real-time', 'orders', 'orders', '["plan-starter","plan-professional","plan-business","plan-enterprise"]', 1),
('feat-inventory', 'Inventory Control', 'Monitor ingredients and supplies', 'inventory', 'inventory', '["plan-professional","plan-business","plan-enterprise"]', 2);
```

## Performance Benchmarks

### Target Metrics
- Landing page load: < 200ms initial response
- Trial signup: < 1s form submission to redirect
- Login flow: < 500ms authentication response
- Pricing page: < 150ms with plan data
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Test landing page performance
artillery quick --count 10 --num 100 http://localhost:3001/

# Test trial signup under load
artillery quick --count 5 --num 20 \
  -p '{"businessName":"Load Test","fullName":"Test User","email":"test{{$randomInt(1,10000)}}@test.com","phone":"+15551234567","password":"TestPass123!","locations":"1","agreeToTerms":true}' \
  http://localhost:5000/auth/trial-signup
```

## SEO Validation

### Meta Tags and Structure
```bash
# Test meta tags and structured data
curl -s http://localhost:3001/ | grep -E '<meta|<title|application/ld\+json'

# Expected: Title, description, OpenGraph tags
# Expected: Software application structured data
```

### Search Engine Optimization
1. Verify robots.txt allows indexing
2. Verify sitemap.xml includes all public pages
3. Verify canonical URLs prevent duplicate content
4. Verify semantic HTML structure (h1, h2, h3 hierarchy)
5. Verify alt text on all images
6. Verify page speed metrics meet Google standards

## Troubleshooting Common Issues

### Trial Signup Fails
1. Check database connection and migrations
2. Verify Stripe test keys are configured
3. Check email validation and uniqueness constraints
4. Verify password complexity requirements

### Login Redirect Issues
1. Check JWT secret configuration
2. Verify session cookie settings
3. Check redirect URL configuration based on user role
4. Verify CORS settings for cross-origin requests

### Performance Issues
1. Check database indexes on frequently queried fields
2. Verify CDN configuration for static assets
3. Check bundle size and code splitting
4. Verify server response caching headers

## Success Criteria

✅ **All API endpoints return expected status codes and data**
✅ **Landing page loads under 200ms with all content**
✅ **Trial signup creates user and redirects to dashboard**
✅ **Existing users can login and access appropriate dashboard**
✅ **Pricing page displays plans with accurate feature comparison**
✅ **Security headers and authentication work correctly**
✅ **Mobile responsive design functions on all screen sizes**
✅ **SEO meta tags and structured data are properly implemented**

When all tests pass, the SaaS landing and customer portal is ready for production deployment.

---
*Quickstart validation complete - ready for task generation*