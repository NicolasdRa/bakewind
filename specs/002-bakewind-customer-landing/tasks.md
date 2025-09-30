# Tasks: BakeWind SaaS Landing & Dashboard Separation

**Input**: Design documents from `/Users/nuuk/Documents/apps/bakewind/specs/002-bakewind-customer-landing/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript 5.6, SolidStart 1.1 (SSR), Solid.js (SPA), NestJS, Drizzle ORM, Tailwind CSS 4.1, Stripe SDK
   → Structure: 3-tier architecture
      - website: SSR landing/auth app
      - admin: Client-side SPA dashboard
      - api: Shared backend API
2. Load design documents:
   → data-model.md: 5 entities (SaasUser, SubscriptionPlan, TrialAccount, SoftwareFeature, UserSession)
   → contracts/: saas-portal-api.yaml with 11 endpoints
   → quickstart.md: 6 test scenarios for validation
3. Generate tasks by category:
   → Setup: database migrations, Stripe integration, environment config
   → Tests: contract tests for 11 endpoints, integration tests for 6 scenarios
   → Core: 5 entity models, 5 service modules, 11 API endpoints
   → Migration: remove dashboard from customer, add to admin
   → Integration: authentication middleware, database connections
   → Polish: frontend components, SEO optimization, performance testing
4. Applied task rules:
   → Different files = marked [P] for parallel execution
   → Same file = sequential (no [P])
   → Tests before implementation (TDD approach)
5. Tasks numbered T001-T088
6. Dependencies organized by phases
7. Parallel execution examples included
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Backend**: `/Users/nuuk/Documents/apps/bakewind/api/src/`
- **Customer Landing (SSR)**: `/Users/nuuk/Documents/apps/bakewind/website/src/`
- **Admin Dashboard (SPA)**: `/Users/nuuk/Documents/apps/bakewind/admin/src/`

## IMPORTANT ARCHITECTURE NOTE
This task list covers THREE applications:
1. **website**: SSR landing/auth application setup
2. **admin**: Migration of ALL dashboard features from website to admin SPA
3. **api**: Shared backend serving both frontends

The refactoring ensures clean separation between public-facing landing pages and authenticated management features.

## Phase 3.1: Database & Infrastructure Setup

- [x] T001 [P] Create Drizzle database schema for SaasUser in `api/src/database/schemas/saas-users.ts`
- [x] T002 [P] Create Drizzle database schema for SubscriptionPlan in `api/src/database/schemas/subscription-plans.ts`
- [x] T003 [P] Create Drizzle database schema for TrialAccount in `api/src/database/schemas/trial-accounts.ts`
- [x] T004 [P] Create Drizzle database schema for SoftwareFeature in `api/src/database/schemas/software-features.ts`
- [x] T005 [P] Create Drizzle database schema for UserSession in `api/src/database/schemas/user-sessions.ts`
- [x] T006 Generate and run database migration for SaaS schema in `api/drizzle/migrations/`
- [x] T007 [P] Configure Stripe integration module in `api/src/stripe/stripe.module.ts`
- [x] T008 [P] Set up environment variables for SaaS portal in `api/.env.example`

## Phase 3.2: Contract Tests (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T009 [P] Contract test POST /auth/trial-signup in `api/test/contracts/auth-trial-signup.test.ts`
- [x] T010 [P] Contract test POST /auth/login in `api/test/contracts/auth-login.test.ts`
- [x] T011 [P] Contract test POST /auth/refresh in `api/test/contracts/auth-refresh.test.ts`
- [x] T012 [P] Contract test POST /auth/logout in `api/test/contracts/auth-logout.test.ts`
- [x] T013 [P] Contract test GET /auth/me in `api/test/contracts/auth-me.test.ts`
- [x] T014 [P] Contract test GET /subscriptions/plans in `api/test/contracts/subscriptions-plans.test.ts`
- [x] T015 [P] Contract test POST /subscriptions/create-checkout in `api/test/contracts/subscriptions-checkout.test.ts`
- [x] T016 [P] Contract test POST /subscriptions/webhook in `api/test/contracts/subscriptions-webhook.test.ts`
- [x] T017 [P] Contract test GET /features in `api/test/contracts/features.test.ts`
- [x] T018 [P] Contract test PATCH /trials/{trialId}/onboarding in `api/test/contracts/trials-onboarding.test.ts`
- [x] T019 [P] Contract test POST /users/{userId}/verify-email in `api/test/contracts/users-verify-email.test.ts`

## Phase 3.3: Backend Service Layer (ONLY after tests are failing)

- [x] T020 [P] Create SaasUser service with validation in `api/src/saas-users/saas-users.service.ts`
- [x] T021 [P] Create SubscriptionPlan service in `api/src/subscriptions/subscription-plans.service.ts`
- [x] T022 [P] Create TrialAccount service with conversion tracking in `api/src/trials/trial-accounts.service.ts`
- [x] T023 [P] Create SoftwareFeature service in `api/src/features/software-features.service.ts`
- [x] T024 [P] Create UserSession service with JWT management in `api/src/auth/user-sessions.service.ts`

## Phase 3.4: Backend API Controllers

- [x] T025 Create authentication controller with trial signup in `api/src/auth/controllers/saas-auth.controller.ts`
- [x] T026 Add login endpoint to authentication controller in `api/src/auth/controllers/saas-auth.controller.ts`
- [x] T027 Add refresh token endpoint to authentication controller in `api/src/auth/controllers/saas-auth.controller.ts`
- [x] T028 Add logout endpoint to authentication controller in `api/src/auth/controllers/saas-auth.controller.ts`
- [x] T029 Add user profile endpoint to authentication controller in `api/src/auth/controllers/saas-auth.controller.ts`
- [x] T030 [P] Create subscriptions controller for plans in `api/src/subscriptions/subscriptions.controller.ts`
- [x] T031 [P] Create features controller for software catalog in `api/src/features/features.controller.ts`
- [x] T032 [P] Create trials controller for onboarding in `api/src/trials/trials.controller.ts`

## Phase 3.5: Backend Integration & Middleware

- [x] T033 [P] Create JWT authentication middleware in `api/src/auth/jwt-auth.middleware.ts`
- [x] T034 [P] Create trial signup validation pipe in `api/src/auth/trial-signup.validation.ts`
- [x] T035 [P] Configure CORS and security headers in `api/src/main.ts`
- [x] T036 [P] Set up Stripe webhook handler in `api/src/stripe/stripe-webhook.controller.ts`
- [x] T037 [P] Create database seed script for subscription plans in `api/src/database/seeds/subscription-plans.seed.ts`
- [x] T038 [P] Create database seed script for software features in `api/src/database/seeds/software-features.seed.ts`

## Phase 3.6: Customer App Infrastructure

- [x] T039 [P] Initialize SolidStart SSR project in `website/`
- [x] T040 [P] Configure Tailwind CSS 4.1 in `website/tailwind.config.js`
- [x] T041 [P] Create API client with authentication in `website/src/lib/api-client.ts`
- [x] T042 [P] Set up SolidStart app configuration in `website/app.config.ts`
- [x] T043 [P] Create authentication store in `website/src/stores/authStore.tsx`

## Phase 3.7: Customer App SaaS Landing Pages

- [x] T044 [P] Create landing page component in `website/src/routes/index.tsx`
- [x] T045 [P] Create pricing page in `website/src/routes/pricing/(pricing).tsx`
- [x] T046 [P] Create features showcase page (integrated in landing page)
- [x] T047 [P] Create about/testimonials page (integrated in landing page)
- [x] T048 [P] Create trial signup form component in `website/src/components/TrialSignupForm.tsx`
- [x] T049 [P] Create pricing table component in `website/src/components/PricingPlans.tsx`
- [x] T050 [P] Create feature showcase component in `website/src/components/FeaturesShowcase.tsx`

## Phase 3.8: Customer App API Integration

- [x] T051 Create trial signup route in `website/src/routes/trial-signup/(trial-signup).tsx`
- [x] T052 Create login route with redirect logic in `website/src/routes/login/(login).tsx`
- [x] T053 Create API route for trial signup in `website/src/routes/api/auth/trial-signup.ts`
- [x] T054 Create API route for login in `website/src/routes/api/auth/login.ts`
- [x] T055 Add authentication token handling to API client in `website/src/lib/api-client.ts`

## Phase 3.9: Customer App SEO & Performance

- [x] T056 [P] Add SEO meta tags and structured data in `website/src/app.tsx`
- [x] T057 [P] Implement lazy loading for images in `website/src/components/OptimizedImage.tsx`
- [x] T058 [P] Configure performance monitoring (analytics files exist)
- [x] T059 [P] Add robots.txt and sitemap generation in `website/public/`

## Phase 3.10: Dashboard Migration to admin

### Remove from website:
- [x] T060 Remove dashboard routes from `website/src/routes/(dashboard)/`
- [x] T061 Remove order management components from `website/src/components/orders/`
- [x] T062 Remove inventory components from `website/src/components/inventory/`
- [x] T063 Remove production components from `website/src/components/production/`
- [x] T064 Remove recipe components from `website/src/components/recipes/`
- [x] T065 Remove customer management from `website/src/components/customers/`
- [x] T066 Remove analytics components from `website/src/components/analytics/`
- [x] T067 Clean up unused dashboard stores from `website/src/stores/`

### Add to admin:
- [x] T068 [P] Set up Solid.js SPA structure in `admin/`
- [x] T069 [P] Configure client-side routing in `admin/src/App.tsx`
- [x] T070 [P] Implement authentication state management in `admin/src/stores/authStore.ts`
- [x] T071 [P] Create API client with JWT handling in `admin/src/api/client.ts`
- [x] T072 Migrate order management pages to `admin/src/pages/orders/`
- [x] T073 Migrate inventory tracking pages to `admin/src/pages/inventory/`
- [x] T074 Migrate production planning to `admin/src/pages/production/`
- [x] T075 Migrate recipe management to `admin/src/pages/recipes/`
- [x] T076 Migrate customer management to `admin/src/pages/customers/`
- [x] T077 Migrate analytics dashboards to `admin/src/pages/analytics/`
- [x] T078 [P] Create main dashboard layout in `admin/src/layouts/DashboardLayout.tsx`
- [x] T079 [P] Implement navigation sidebar in `admin/src/components/Navigation.tsx`

### Integration Tasks:
- [x] T080 Configure authentication token passing from website to admin
- [x] T081 Implement redirect logic after successful login in `website/src/routes/login/`
- [x] T082 Set up CORS configuration for admin in `api/src/main.ts`

## Phase 3.11: Integration Tests (from quickstart.md)

- [x] T083 [P] Integration test for landing page experience in `website/tests/e2e/landing-page.test.ts`
- [x] T084 [P] Integration test for trial signup flow in `website/tests/e2e/trial-signup.test.ts`
- [x] T085 [P] Integration test for authentication handoff in `tests/integration/auth-handoff.test.ts`
- [x] T086 [P] Integration test for pricing page display in `website/tests/e2e/pricing.test.ts`
- [x] T087 [P] Integration test for dashboard migration verification in `tests/integration/dashboard-migration.test.ts`
- [x] T088 [P] Integration test for trial expiration flow in `api/tests/integration/trial-expiration.test.ts`

## Dependencies

- **Phase 3.1 → 3.2**: Database schemas must exist before contract tests
- **Phase 3.2 → 3.3**: Contract tests must pass before service implementation
- **Phase 3.3 → 3.4**: Services must exist before controller endpoints
- **Phase 3.4 → 3.5**: Controllers must exist before middleware integration
- **Phase 3.6 → 3.7**: Frontend infrastructure must be ready before component development
- **Phase 3.7 → 3.8**: Components must exist before API integration
- **Phase 3.8 → 3.9**: Core functionality must work before optimization
- **Phase 3.9 → 3.10**: Customer app must be complete before migration
- **Phase 3.10 → 3.11**: Migration must be complete before integration testing

## Parallel Example
```
# Launch database schema tasks together (T001-T005):
Task: "Create Drizzle database schema for SaasUser in api/src/database/schemas/saas-users.ts"
Task: "Create Drizzle database schema for SubscriptionPlan in api/src/database/schemas/subscription-plans.ts"
Task: "Create Drizzle database schema for TrialAccount in api/src/database/schemas/trial-accounts.ts"
Task: "Create Drizzle database schema for SoftwareFeature in api/src/database/schemas/software-features.ts"
Task: "Create Drizzle database schema for UserSession in api/src/database/schemas/user-sessions.ts"

# Launch contract tests together (T009-T019):
Task: "Contract test POST /auth/trial-signup in api/test/contracts/auth-trial-signup.test.ts"
Task: "Contract test POST /auth/login in api/test/contracts/auth-login.test.ts"
Task: "Contract test POST /auth/refresh in api/test/contracts/auth-refresh.test.ts"
Task: "Contract test POST /auth/logout in api/test/contracts/auth-logout.test.ts"
Task: "Contract test GET /auth/me in api/test/contracts/auth-me.test.ts"

# Launch service layer tasks together (T020-T024):
Task: "Create SaasUser service with validation in api/src/saas-users/saas-users.service.ts"
Task: "Create SubscriptionPlan service in api/src/subscriptions/subscription-plans.service.ts"
Task: "Create TrialAccount service with conversion tracking in api/src/trials/trial-accounts.service.ts"
Task: "Create SoftwareFeature service in api/src/features/software-features.service.ts"
Task: "Create UserSession service with JWT management in api/src/auth/user-sessions.service.ts"
```

## Success Criteria

- ✅ All 19 contract tests pass with proper request/response validation
- ✅ All 5 database entities can be created, read, updated, and queried
- ✅ All 11 API endpoints return expected status codes and data structures
- ✅ Landing page loads under 200ms with complete feature showcase
- ✅ Trial signup creates user account and redirects to dashboard
- ✅ Existing subscribers can login and access appropriate dashboard
- ✅ Pricing page displays 4 plans with accurate feature comparison
- ✅ All security headers and authentication mechanisms function correctly
- ✅ Mobile responsive design works on all screen sizes
- ✅ SEO meta tags and structured data are properly implemented
- ✅ Complete separation achieved: NO dashboard features in customer app
- ✅ All dashboard features successfully migrated to admin app
- ✅ Authentication handoff works seamlessly between apps

## Validation Checklist
*GATE: Checked before task execution*

- [x] All contracts have corresponding tests (T009-T019)
- [x] All entities have model tasks (T001-T005, T020-T024)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks truly independent (different files marked [P])
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Three-tier architecture properly separated
- [x] Migration tasks preserve functionality

When all tasks are complete, the BakeWind SaaS Landing & Dashboard Separation will be ready for production deployment with comprehensive trial signup, subscriber authentication, and complete architectural separation.

---
*Tasks generated from plan.md, data-model.md, contracts/saas-portal-api.yaml, and quickstart.md*