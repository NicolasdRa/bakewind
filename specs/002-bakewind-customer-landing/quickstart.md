# Quickstart Guide: BakeWind SaaS Landing & Dashboard Separation

**Feature**: BakeWind SaaS Landing & Dashboard Separation
**Date**: 2025-09-28
**Branch**: `002-bakewind-customer-landing`

## Overview

This guide provides step-by-step validation scenarios to verify the implementation of the BakeWind three-tier architecture with proper separation between landing pages and dashboard functionality.

## Prerequisites

Before starting validation:
1. All three applications running locally:
   - `api` on http://localhost:5000
   - `website` on http://localhost:3000
   - `admin` on http://localhost:3001
2. PostgreSQL database with migrations applied
3. Stripe test keys configured
4. Seed data loaded (plans, features)

## Test Scenarios

### Scenario 1: Landing Page Experience
**Objective**: Verify SEO-optimized landing pages load correctly

1. Navigate to http://localhost:3001
2. Verify landing page loads with:
   - Hero section with clear value proposition
   - Feature highlights (at least 3)
   - Testimonials section
   - Clear CTA for trial signup
3. View page source and verify:
   - Server-side rendered HTML (no loading spinners)
   - Meta tags present for SEO
   - Structured data for rich snippets
4. Check performance:
   - First Contentful Paint < 1s
   - No layout shifts after load

✅ **Success**: Landing page is fully rendered server-side with good performance

### Scenario 2: Trial Signup Flow
**Objective**: Verify new users can create trial accounts

1. Click "Start Free Trial" from landing page
2. Navigate to /trial-signup
3. Fill form with:
   - Email: test@bakery.com
   - Password: TestPass123!
   - Company: Test Bakery LLC
   - Phone: 555-0123
4. Submit form
5. Verify:
   - Account created (201 response)
   - JWT tokens received
   - Redirected to onboarding flow
   - Welcome email sent (check logs)
6. Check database:
   - User record created
   - Trial account active
   - End date = start date + 14 days

✅ **Success**: Trial account created with proper expiration date

### Scenario 3: Authentication Handoff
**Objective**: Verify seamless redirect between apps

1. Navigate to http://localhost:3000/login
2. Login with trial account credentials
3. Verify:
   - Authentication successful
   - JWT token in response
   - Redirect URL points to admin app
4. Follow redirect to http://localhost:3001
5. Verify in admin app:
   - User is authenticated
   - JWT token passed correctly
   - User data available
   - Dashboard loads without re-login

✅ **Success**: User authenticated in both apps without re-authentication

### Scenario 4: Pricing Page & Plans
**Objective**: Verify subscription plans display correctly

1. Navigate to http://localhost:3000/pricing
2. Verify 4 plans displayed:
   - Starter
   - Professional
   - Enterprise
   - Custom
3. For each plan verify:
   - Monthly and yearly prices
   - Feature list
   - Limits clearly shown
   - CTA button active
4. Click "Subscribe" on Professional plan
5. Verify:
   - Requires authentication
   - Creates Stripe checkout session
   - Redirects to Stripe payment page

✅ **Success**: All plans display with working Stripe integration

### Scenario 5: Dashboard Migration Verification
**Objective**: Ensure dashboard features are NOT in customer app

1. Check `website/src/routes/`:
   - NO dashboard routes present
   - NO order management routes
   - NO inventory routes
   - NO production routes
2. Check `admin/src/pages/`:
   - Dashboard page exists
   - Orders management exists
   - Inventory tracking exists
   - Production planning exists
   - All features migrated
3. Test navigation in admin app:
   - All dashboard routes work
   - State management functional
   - API calls successful

✅ **Success**: Complete separation of concerns between apps

### Scenario 6: Trial Expiration
**Objective**: Verify trial expiration handling

1. Create trial account
2. Manually update trial end date to past date in DB
3. Run trial expiration job
4. Verify:
   - Trial status = 'expired'
   - Expiration email sent
   - User cannot access dashboard
   - Prompted to subscribe
5. Navigate to pricing page
6. Select plan and complete payment
7. Verify:
   - Trial status = 'converted'
   - Full access restored
   - Subscription active

✅ **Success**: Trial expiration and conversion flow working

## Integration Tests

### API Contract Tests
Run from `api` directory:
```bash
npm run test:contracts
```

Expected output:
- ✅ POST /auth/trial-signup
- ✅ POST /auth/login
- ✅ POST /auth/refresh
- ✅ POST /auth/logout
- ✅ GET /auth/me
- ✅ GET /subscriptions/plans
- ✅ POST /subscriptions/create-checkout
- ✅ GET /features
- ✅ PATCH /trials/{id}/onboarding
- ✅ POST /users/{id}/verify-email

### Frontend E2E Tests
Run from `website` directory:
```bash
npm run test:e2e
```

Expected scenarios:
- ✅ Landing page loads
- ✅ Trial signup completes
- ✅ Login redirects to admin
- ✅ Pricing page displays plans
- ✅ Features showcase works

### Admin Dashboard Tests
Run from `admin` directory:
```bash
npm run test:e2e
```

Expected scenarios:
- ✅ Dashboard loads with auth
- ✅ Orders page functional
- ✅ Inventory management works
- ✅ Production planning active
- ✅ Analytics displays charts

## Performance Benchmarks

### Customer App (SSR)
```bash
npm run lighthouse
```
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 95

### Admin App (SPA)
```bash
npm run bundle-analyze
```
- Initial bundle: < 200KB gzipped
- Lazy loaded chunks: < 50KB each
- Time to Interactive: < 2s

## Security Checklist

- [ ] JWT tokens not in localStorage (httpOnly cookies)
- [ ] CORS configured for known origins only
- [ ] Rate limiting on auth endpoints
- [ ] Input validation on all forms
- [ ] XSS protection headers set
- [ ] CSRF tokens for state-changing operations
- [ ] Stripe webhooks signature verified
- [ ] SQL injection prevented (parameterized queries)

## Deployment Validation

### Environment Variables
Verify all required in each app:

**api**:
- DATABASE_URL
- JWT_SECRET
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- CORS_ORIGIN

**website**:
- VITE_API_URL
- VITE_STRIPE_PUBLIC_KEY
- VITE_ADMIN_APP_URL

**admin**:
- VITE_API_URL
- VITE_CUSTOMER_APP_URL

### Health Checks
- http://localhost:5000/health - API health
- http://localhost:3000/api/health - Customer app health
- http://localhost:3001/health - Admin app health

## Troubleshooting

### Issue: Authentication fails between apps
**Solution**: Verify CORS settings and cookie domain configuration

### Issue: Dashboard features in customer app
**Solution**: Run migration cleanup tasks T056-T064

### Issue: Trial doesn't expire
**Solution**: Check cron job for trial expiration is running

### Issue: Stripe webhook fails
**Solution**: Verify webhook secret and endpoint URL

## Success Criteria

✅ All test scenarios pass
✅ Contract tests 100% passing
✅ E2E tests 100% passing
✅ Performance benchmarks met
✅ Security checklist complete
✅ Health checks responding
✅ No console errors in any app
✅ Clean separation between apps verified

When all criteria are met, the BakeWind SaaS Landing & Dashboard Separation is ready for production deployment.