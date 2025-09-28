# Tasks: BakeWind SaaS Landing & Customer Portal

**Input**: Design documents from `/Users/nuuk/Documents/apps/bakewind/specs/002-bakewind-customer-landing/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript 5.6, SolidStart 1.1, NestJS, Drizzle ORM, Tailwind CSS 4.1
   → Structure: web app with bakewind-customer frontend + bakewind-api backend
2. Load design documents:
   → data-model.md: 5 entities (SaaS User, Subscription Plan, Trial Account, Software Feature, User Session)
   → contracts/: saas-portal-api.yaml with 11 endpoints
   → quickstart.md: 6 test scenarios for validation
3. Generate tasks by category:
   → Setup: database migrations, Stripe integration, environment config
   → Tests: contract tests for 11 endpoints, integration tests for 6 scenarios
   → Core: 5 entity models, 5 service modules, 11 API endpoints
   → Integration: authentication middleware, database connections
   → Polish: frontend components, SEO optimization, performance testing
4. Applied task rules:
   → Different files = marked [P] for parallel execution
   → Same file = sequential (no [P])
   → Tests before implementation (TDD approach)
5. Tasks numbered T001-T055
6. Dependencies organized by phases
7. Parallel execution examples included
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Backend**: `/Users/nuuk/Documents/apps/bakewind/bakewind-api/src/`
- **Frontend**: `/Users/nuuk/Documents/apps/bakewind/bakewind-customer/src/`

## Phase 3.1: Database & Infrastructure Setup

- [x] T001 [P] Create Drizzle database schemas for SaaS entities in `bakewind-api/src/database/schemas/saas-users.ts`
- [x] T002 [P] Create Drizzle database schemas for subscription plans in `bakewind-api/src/database/schemas/subscription-plans.ts`
- [x] T003 [P] Create Drizzle database schemas for trial accounts in `bakewind-api/src/database/schemas/trial-accounts.ts`
- [x] T004 [P] Create Drizzle database schemas for software features in `bakewind-api/src/database/schemas/software-features.ts`
- [x] T005 [P] Create Drizzle database schemas for user sessions in `bakewind-api/src/database/schemas/user-sessions.ts`
- [x] T006 Generate and run database migration for SaaS schema in `bakewind-api/drizzle/migrations/`
- [x] T007 [P] Configure Stripe integration in `bakewind-api/src/stripe/stripe.module.ts`
- [x] T008 [P] Set up environment variables for SaaS portal in `bakewind-api/.env.example`

## Phase 3.2: Contract Tests (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

- [x] T009 [P] Create contract test for POST /auth/trial-signup in `bakewind-api/test/contracts/auth-trial-signup.test.ts`
- [x] T010 [P] Create contract test for POST /auth/login in `bakewind-api/test/contracts/auth-login.test.ts`
- [x] T011 [P] Create contract test for POST /auth/refresh in `bakewind-api/test/contracts/auth-refresh.test.ts`
- [x] T012 [P] Create contract test for POST /auth/logout in `bakewind-api/test/contracts/auth-logout.test.ts`
- [x] T013 [P] Create contract test for GET /auth/me in `bakewind-api/test/contracts/auth-me.test.ts`
- [x] T014 [P] Create contract test for GET /subscriptions/plans in `bakewind-api/test/contracts/subscriptions-plans.test.ts`
- [x] T015 [P] Create contract test for GET /features in `bakewind-api/test/contracts/features.test.ts`
- [x] T016 [P] Create contract test for PATCH /trials/{trialId}/onboarding in `bakewind-api/test/contracts/trials-onboarding.test.ts`

## Phase 3.3: Backend Service Layer

- [x] T017 [P] Create SaaS User service with validation in `bakewind-api/src/saas-users/saas-users.service.ts`
- [x] T018 [P] Create Subscription Plans service in `bakewind-api/src/subscriptions/subscription-plans.service.ts`
- [x] T019 [P] Create Trial Accounts service with conversion tracking in `bakewind-api/src/trials/trial-accounts.service.ts`
- [x] T020 [P] Create Software Features service in `bakewind-api/src/features/software-features.service.ts`
- [x] T021 [P] Create User Sessions service with JWT management in `bakewind-api/src/auth/user-sessions.service.ts`

## Phase 3.4: Backend API Controllers

- [x] T022 Create authentication controller for trial signup in `bakewind-api/src/auth/auth.controller.ts`
- [x] T023 Add login endpoint to authentication controller in `bakewind-api/src/auth/auth.controller.ts`
- [x] T024 Add refresh token endpoint to authentication controller in `bakewind-api/src/auth/auth.controller.ts`
- [x] T025 Add logout endpoint to authentication controller in `bakewind-api/src/auth/auth.controller.ts`
- [x] T026 Add user profile endpoint to authentication controller in `bakewind-api/src/auth/auth.controller.ts`
- [x] T027 [P] Create subscriptions controller for plans in `bakewind-api/src/subscriptions/subscriptions.controller.ts`
- [x] T028 [P] Create features controller for software catalog in `bakewind-api/src/features/features.controller.ts`
- [x] T029 [P] Create trials controller for onboarding in `bakewind-api/src/trials/trials.controller.ts`

## Phase 3.5: Backend Integration & Middleware

- [x] T030 [P] Create JWT authentication middleware in `bakewind-api/src/auth/jwt-auth.middleware.ts`
- [x] T031 [P] Create trial signup validation pipe in `bakewind-api/src/auth/trial-signup.validation.ts`
- [x] T032 [P] Configure CORS and security headers in `bakewind-api/src/main.ts`
- [x] T033 [P] Set up Stripe webhook handler in `bakewind-api/src/stripe/stripe-webhook.controller.ts`
- [x] T034 [P] Create database seed script for subscription plans in `bakewind-api/src/database/seeds/subscription-plans.seed.ts`
- [x] T035 [P] Create database seed script for software features in `bakewind-api/src/database/seeds/software-features.seed.ts`

## Phase 3.6: Frontend Infrastructure

- [ ] T036 [P] Generate TypeScript types from OpenAPI spec in `bakewind-customer/scripts/generate-api-types.js`
- [ ] T037 [P] Create API client with authentication in `bakewind-customer/src/lib/api-client.ts`
- [ ] T038 [P] Set up SolidStart app configuration in `bakewind-customer/app.config.ts`
- [ ] T039 [P] Configure Tailwind CSS for SaaS theme in `bakewind-customer/tailwind.config.js`
- [ ] T040 [P] Create authentication store with SolidJS signals in `bakewind-customer/src/stores/authStore.ts`

## Phase 3.7: Frontend SaaS Landing Pages

- [ ] T041 [P] Create enhanced landing page component in `bakewind-customer/src/routes/index.tsx`
- [ ] T042 [P] Create trial signup form component in `bakewind-customer/src/components/TrialSignupForm.tsx`
- [ ] T043 [P] Create pricing page with plan comparison in `bakewind-customer/src/routes/pricing/(pricing).tsx`
- [ ] T044 [P] Create software features showcase component in `bakewind-customer/src/components/FeaturesShowcase.tsx`
- [ ] T045 [P] Update login form for subscriber context in `bakewind-customer/src/components/LoginForm.tsx`

## Phase 3.8: Frontend API Integration

- [ ] T046 Create trial signup server action in `bakewind-customer/src/routes/api/auth/trial-signup.ts`
- [ ] T047 Update login server action for subscriber redirect in `bakewind-customer/src/routes/api/auth/login.ts`
- [ ] T048 [P] Create logout server action in `bakewind-customer/src/routes/api/auth/logout.ts`
- [ ] T049 [P] Create subscription plans API route in `bakewind-customer/src/routes/api/subscriptions/plans.ts`
- [ ] T050 [P] Create software features API route in `bakewind-customer/src/routes/api/features.ts`

## Phase 3.9: SEO & Performance Optimization

- [ ] T051 [P] Add SEO meta tags and structured data in `bakewind-customer/src/components/SEO/SEO.tsx`
- [ ] T052 [P] Create robots.txt and sitemap.xml in `bakewind-customer/public/`
- [ ] T053 [P] Optimize images and implement lazy loading in landing page components
- [ ] T054 [P] Add performance monitoring and Core Web Vitals tracking
- [ ] T055 [P] Configure CDN-friendly caching headers in SolidStart configuration

## Integration Test Scenarios

### Scenario 1: Landing Page Performance Test
**Tests**: T041, T051, T052
**Validation**: Page loads under 200ms, SEO meta tags present, responsive design

### Scenario 2: Trial Signup Flow Test
**Tests**: T009, T017, T019, T022, T042, T046
**Validation**: Complete trial account creation with 14-day expiration

### Scenario 3: Subscriber Login Test
**Tests**: T010, T013, T021, T023, T026, T047
**Validation**: Authentication with dashboard redirect based on subscription status

### Scenario 4: Pricing Page Test
**Tests**: T014, T018, T027, T043, T049
**Validation**: 4 subscription plans with accurate feature comparison

### Scenario 5: Software Features Test
**Tests**: T015, T020, T028, T044, T050
**Validation**: 6 feature cards with business benefit descriptions

### Scenario 6: Security & Performance Test
**Tests**: T030, T032, T040, T054
**Validation**: JWT security, CORS protection, performance benchmarks

## Parallel Execution Examples

### High Parallelism (Different Files)
```bash
# Phase 3.1 - All database schemas can be created simultaneously
Task agent "Create SaaS User schema" T001 &
Task agent "Create Subscription Plans schema" T002 &
Task agent "Create Trial Accounts schema" T003 &
Task agent "Create Software Features schema" T004 &
Task agent "Create User Sessions schema" T005 &
wait
```

### Medium Parallelism (Different Modules)
```bash
# Phase 3.3 - All service layers can be built in parallel
Task agent "Create SaaS User service" T017 &
Task agent "Create Subscription Plans service" T018 &
Task agent "Create Trial Accounts service" T019 &
Task agent "Create Software Features service" T020 &
Task agent "Create User Sessions service" T021 &
wait
```

### Sequential Execution (Same File)
```bash
# Phase 3.4 - Authentication controller endpoints must be sequential
Task agent "Create trial signup endpoint" T022
Task agent "Add login endpoint" T023
Task agent "Add refresh token endpoint" T024
Task agent "Add logout endpoint" T025
Task agent "Add user profile endpoint" T026
```

## Dependencies

- **Phase 3.1 → 3.2**: Database schemas must exist before contract tests
- **Phase 3.2 → 3.3**: Contract tests must pass before service implementation
- **Phase 3.3 → 3.4**: Services must exist before controller endpoints
- **Phase 3.4 → 3.5**: Controllers must exist before middleware integration
- **Phase 3.6 → 3.7**: Frontend infrastructure must be ready before component development
- **Phase 3.7 → 3.8**: Components must exist before API integration
- **Phase 3.8 → 3.9**: Core functionality must work before optimization

## Success Criteria

- ✅ All 16 contract tests pass with proper request/response validation
- ✅ All 5 database entities can be created, read, updated, and queried
- ✅ All 11 API endpoints return expected status codes and data structures
- ✅ Landing page loads under 200ms with complete feature showcase
- ✅ Trial signup creates user account and redirects to dashboard
- ✅ Existing subscribers can login and access appropriate dashboard
- ✅ Pricing page displays 4 plans with accurate feature comparison
- ✅ All security headers and authentication mechanisms function correctly
- ✅ Mobile responsive design works on all screen sizes
- ✅ SEO meta tags and structured data are properly implemented

When all tasks are complete, the BakeWind SaaS Landing & Customer Portal will be ready for production deployment with comprehensive trial signup and subscriber authentication capabilities.

---
*Tasks generated from plan.md, data-model.md, contracts/saas-portal-api.yaml, and quickstart.md*