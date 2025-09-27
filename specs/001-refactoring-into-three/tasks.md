# Tasks: Application Architecture Refactoring

**Input**: Design documents from `/specs/001-refactoring-into-three/`
**Prerequisites**: plan.md (required), research.md
**Architecture**: Three-application system (API, Customer, Admin)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **API**: `bakewind-api/` (NestJS)
- **Customer App**: `bakewind-customer/` (SolidStart - SSR/SEO)
- **Admin App**: `bakewind-admin/` (SolidJS SPA - client-side only)
- **Shared**: Repository root for Docker and configuration

## Phase 3.1: Environment Setup

### Initial Setup & Migration Planning
- [x] T001 Create backup of existing bakewind-backend and bakewind-front-solidstart directories
- [x] T002 Create new directory structure: bakewind-api/, bakewind-customer/, bakewind-admin/
- [x] T003 Copy bakewind-backend to bakewind-api as starting point for API service
- [x] T004 Initialize bakewind-customer with `npm create solid@latest` choosing SolidStart with TypeScript
- [x] T005 Initialize bakewind-admin with `npm create vite@latest` choosing SolidJS with TypeScript (SPA template)

### Docker Configuration
- [x] T006 Create root docker-compose.yml with nginx, api, customer, admin, postgres services
- [x] T007 [P] Create Dockerfile for bakewind-api with Node.js 22 and NestJS setup
- [x] T008 [P] Create Dockerfile for bakewind-customer with Node.js 22 and SolidStart SSR setup
- [x] T009 [P] Create Dockerfile for bakewind-admin with Node.js 22 for SolidJS SPA (static build)
- [x] T010 Create nginx/nginx.conf with reverse proxy configuration for all three apps
- [x] T011 Create .env.example with all required environment variables for three apps

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

### API Authentication Tests
- [ ] T012 [P] Write test for POST /api/v1/auth/login in bakewind-api/tests/integration/auth.test.ts
- [ ] T013 [P] Write test for POST /api/v1/auth/refresh in bakewind-api/tests/integration/auth.test.ts
- [ ] T014 [P] Write test for POST /api/v1/auth/logout in bakewind-api/tests/integration/auth.test.ts
- [ ] T015 [P] Write test for JWT validation middleware in bakewind-api/tests/unit/auth-middleware.test.ts

### Customer API Tests
- [ ] T016 [P] Write test for GET /api/v1/products in bakewind-api/tests/integration/products.test.ts
- [ ] T017 [P] Write test for POST /api/v1/orders in bakewind-api/tests/integration/orders.test.ts
- [ ] T018 [P] Write test for GET /api/v1/orders/:id in bakewind-api/tests/integration/orders.test.ts
- [ ] T019 [P] Write test for POST /api/v1/customers/register in bakewind-api/tests/integration/customers.test.ts

### Admin API Tests
- [ ] T020 [P] Write test for GET /api/v1/admin/orders in bakewind-api/tests/integration/admin-orders.test.ts
- [ ] T021 [P] Write test for PATCH /api/v1/admin/orders/:id in bakewind-api/tests/integration/admin-orders.test.ts
- [ ] T022 [P] Write test for GET /api/v1/admin/inventory in bakewind-api/tests/integration/admin-inventory.test.ts
- [ ] T023 [P] Write test for GET /api/v1/admin/analytics in bakewind-api/tests/integration/admin-analytics.test.ts

### Cross-Application Integration Tests
- [ ] T024 Write end-to-end test for customer order flow in tests/e2e/customer-order-flow.test.ts
- [ ] T025 Write end-to-end test for admin order management in tests/e2e/admin-order-management.test.ts
- [ ] T026 Write test for WebSocket real-time updates in tests/e2e/websocket-sync.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### API Service Refactoring
- [ ] T027 Refactor bakewind-api auth module to support JWT with refresh tokens
- [ ] T028 Add API versioning with /api/v1 prefix to all endpoints in bakewind-api
- [ ] T029 Implement CORS configuration for customer and admin origins in bakewind-api
- [ ] T030 Add correlation ID middleware for request tracking in bakewind-api
- [ ] T031 Implement rate limiting middleware using Nginx configuration
- [ ] T032 Create OpenAPI specification generation in bakewind-api/src/swagger.ts

### Customer Application (SolidStart - SSR/SSG)
- [ ] T033 Configure SolidStart for SSR with SEO meta tags in bakewind-customer/app.config.ts
- [ ] T034 Create product browsing pages with server-side data fetching in bakewind-customer/src/routes/products/
- [ ] T035 Create shopping cart store with client persistence in bakewind-customer/src/stores/cart.ts
- [ ] T036 Create checkout flow with form validation in bakewind-customer/src/routes/checkout/
- [ ] T037 Create customer account pages with protected routes in bakewind-customer/src/routes/account/
- [ ] T038 Create API client using openapi-typescript in bakewind-customer/src/api/
- [ ] T039 Implement customer authentication with SSR support in bakewind-customer/src/auth/
- [ ] T040 Add SEO components (sitemap, robots.txt, structured data) in bakewind-customer/

### Admin Application (SolidJS SPA - Client-side only)
- [ ] T041 Set up SolidJS router for client-side navigation in bakewind-admin/src/App.tsx
- [ ] T042 Create admin authentication with JWT storage in bakewind-admin/src/auth/
- [ ] T043 Migrate dashboard components from bakewind-front-solidstart to bakewind-admin/src/components/
- [ ] T044 Create order management pages in bakewind-admin/src/pages/orders/
- [ ] T045 Create inventory management pages in bakewind-admin/src/pages/inventory/
- [ ] T046 Create production planning pages in bakewind-admin/src/pages/production/
- [ ] T047 Create analytics dashboard in bakewind-admin/src/pages/analytics/
- [ ] T048 Create API client using openapi-typescript in bakewind-admin/src/api/
- [ ] T049 Set up global state management with solid-js/store in bakewind-admin/src/stores/

## Phase 3.4: Integration

### WebSocket Implementation
- [ ] T050 Implement Socket.IO server in bakewind-api for real-time updates
- [ ] T051 [P] Add Socket.IO client to bakewind-customer for order status updates
- [ ] T052 [P] Add Socket.IO client to bakewind-admin for real-time dashboard
- [ ] T053 Create room-based broadcasting for efficient updates

### Database Migration
- [ ] T054 Create migration scripts for any schema changes in bakewind-api/src/database/migrations/
- [ ] T055 Implement dual-write logic for gradual migration if needed
- [ ] T056 Create database backup and restore procedures
- [ ] T057 Test rollback procedures with production data copy

### Deployment Configuration
- [ ] T058 Create GitHub Actions workflow for CI/CD in .github/workflows/deploy.yml
- [ ] T059 Configure Docker registry for image storage
- [ ] T060 Create deployment script for Hetzner VPS in scripts/deploy.sh
- [ ] T061 Set up SSL certificates with Let's Encrypt in nginx configuration
- [ ] T062 Configure firewall rules (UFW) on Hetzner VPS
- [ ] T063 Configure nginx to serve admin SPA as static files from /admin path

## Phase 3.5: Polish

### Performance Optimization
- [ ] T064 [P] Implement SSG for static pages in bakewind-customer (about, contact, etc.)
- [ ] T065 [P] Add response caching to frequently accessed API endpoints
- [ ] T066 [P] Implement database connection pooling optimization
- [ ] T067 [P] Add CDN configuration for static assets
- [ ] T068 [P] Optimize bundle sizes for admin SPA with code splitting
- [ ] T069 [P] Implement lazy loading for admin dashboard components

### Monitoring & Logging
- [ ] T070 Set up structured JSON logging across all applications
- [ ] T071 Configure log aggregation with Docker logging driver
- [ ] T072 Create health check endpoints for all services
- [ ] T073 Set up monitoring dashboards (optional Grafana)

### Documentation
- [ ] T074 [P] Update README.md with three-app architecture overview
- [ ] T075 [P] Create deployment documentation in docs/deployment.md
- [ ] T076 [P] Create API documentation from OpenAPI spec
- [ ] T077 [P] Update CLAUDE.md with new architecture details
- [ ] T078 [P] Document the distinction between SolidStart (customer) and SolidJS (admin)

### Final Validation
- [ ] T079 Run full test suite across all applications
- [ ] T080 Perform load testing to verify performance targets
- [ ] T081 Test SEO implementation for customer site (meta tags, structured data)
- [ ] T082 Verify admin SPA works offline with service worker
- [ ] T083 Conduct security audit of all endpoints
- [ ] T084 Execute disaster recovery test
- [ ] T085 Final deployment to Hetzner VPS

## Dependencies

### Critical Path
1. Environment setup (T001-T011) blocks everything
2. Tests (T012-T026) must complete before implementation
3. API refactoring (T027-T032) blocks both frontend apps
4. Frontend apps (T033-T049) can proceed in parallel after API
5. Integration (T050-T063) requires all core implementation
6. Polish (T064-T085) comes last

### Parallel Execution Groups

**Group 1: Docker Setup** (after T006)
```
Task: "Create Dockerfile for bakewind-api"
Task: "Create Dockerfile for bakewind-customer (SolidStart)"
Task: "Create Dockerfile for bakewind-admin (SolidJS SPA)"
```

**Group 2: API Tests** (can all run in parallel)
```
Task: "Write test for POST /api/v1/auth/login"
Task: "Write test for POST /api/v1/auth/refresh"
Task: "Write test for POST /api/v1/auth/logout"
Task: "Write test for GET /api/v1/products"
Task: "Write test for POST /api/v1/orders"
```

**Group 3: Frontend Development** (after API is ready)
```
Task: "Build customer application with SolidStart (SSR/SEO)"
Task: "Build admin application with SolidJS (SPA)"
```

**Group 4: Polish Tasks** (all can run in parallel)
```
Task: "Implement SSG for static pages"
Task: "Add response caching"
Task: "Optimize bundle sizes"
Task: "Update documentation"
```

## Architecture Clarification

### Customer Application (bakewind-customer)
- **Framework**: SolidStart
- **Rendering**: SSR/SSG hybrid
- **Why**: SEO requirements, public-facing, needs fast initial load
- **Features**: Server-side data fetching, meta tags, sitemap generation
- **Deployment**: Node.js server required for SSR

### Admin Application (bakewind-admin)
- **Framework**: SolidJS (Vite template)
- **Rendering**: Client-side SPA
- **Why**: Internal tool, no SEO needs, simpler deployment
- **Features**: Client-side routing, lazy loading, offline support
- **Deployment**: Static files served by nginx

## Notes
- Customer app uses SolidStart for SEO and performance
- Admin app uses plain SolidJS for simplicity (no SSR needed)
- All [P] tasks work on different files and have no dependencies
- Tests must fail first (TDD requirement from constitution)
- Commit after each completed task

## Risk Mitigation
- Backup before any destructive operations
- Test with production data copy first
- Implement feature flags for gradual rollout
- Monitor error rates during deployment
- Have rollback plan for each phase

## Success Criteria
- All tests passing
- Zero downtime during migration
- Customer site has excellent SEO scores
- Admin app loads quickly as SPA
- Performance targets met (<2s page load, <200ms API response)
- All existing functionality preserved
- Three independently deployable applications