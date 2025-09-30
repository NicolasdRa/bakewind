
# Implementation Plan: BakeWind SaaS Landing & Dashboard Separation

**Branch**: `002-bakewind-customer-landing` | **Date**: 2025-09-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/nuuk/Documents/apps/bakewind/specs/002-bakewind-customer-landing/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Refactor BakeWind into a proper three-tier SaaS architecture by:
1. Creating an SEO-optimized SSR landing/auth app (website)
2. Migrating all dashboard features to a separate Solid.js SPA (admin)
3. Ensuring both frontends communicate with the shared NestJS API (api)

The primary requirement is to provide a public-facing, SEO-optimized entry point where potential customers can discover the software, view pricing plans, sign up for 14-day free trials, and existing subscribers can log in to be redirected to the separate BakeWind Dashboard application. Technical approach includes SSR SolidStart for SEO, client-side Solid.js for dashboard interactivity, Stripe for subscription billing, and shared NestJS API.

## Technical Context
**Language/Version**: TypeScript 5.6, Node.js 22+
**Primary Dependencies**: SolidStart 1.1 (SSR), Solid.js (SPA), NestJS, Drizzle ORM, Tailwind CSS 4.1, Stripe SDK
**Storage**: PostgreSQL (backend), no local database for customer app
**Testing**: Vitest (frontend), Jest (backend), contract testing for APIs
**Target Platform**: Web browsers (SSR + SPA), Linux server deployment
**Project Type**: web - SSR frontend + SPA dashboard + backend API
**Performance Goals**: <200ms page loads, <1s trial signup flow, 60fps animations
**Constraints**: SEO optimized, mobile responsive, WCAG 2.1 AA compliance
**Scale/Scope**: 10k+ trial signups/month, 1k concurrent users, 82+ tasks across 3 apps

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Core Principles Compliance**:
- [x] Database-First: User/subscription schema design drives API contracts and frontend state
- [x] Type Safety: TypeScript strict mode, Drizzle typed schemas, SolidJS reactive types
- [x] TDD: Contract tests before API implementation, component tests before UI
- [x] Separation: Frontend (presentation), Backend (business logic), Database (persistence) layers
- [x] Observability: Structured logging for auth flows, metrics for trial conversions

**Standards Compliance**:
- [x] API follows RESTful conventions: POST /auth/trial-signup, GET /auth/user, etc.
- [x] Database changes via migrations only: Drizzle migrations for user/subscription tables
- [x] Security requirements addressed: JWT tokens, input validation, CORS, rate limiting

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->
```
api/                              # NestJS Backend API (shared)
├── src/
│   ├── auth/                     # Authentication module
│   ├── users/                    # User management
│   ├── subscriptions/            # Subscription management (NEW)
│   ├── database/                 # Drizzle schemas & migrations
│   └── health/                   # Health checks
└── test/                         # Jest tests

website/                          # SSR SolidStart Landing App (NEW/REFACTORED)
├── src/
│   ├── components/               # Landing/marketing UI components ONLY
│   │   ├── LoginForm.tsx         # Authentication form
│   │   ├── TrialSignupForm.tsx   # Trial registration form
│   │   ├── PricingTable.tsx      # Subscription plans display
│   │   ├── FeatureShowcase.tsx   # Software feature demos
│   │   └── Logo/                 # Brand components
│   ├── routes/                   # SSR routes (NO dashboard routes)
│   │   ├── index.tsx             # Landing page
│   │   ├── pricing/              # Pricing page
│   │   ├── features/             # Feature showcase
│   │   ├── about/                # About/testimonials
│   │   ├── login/                # Login (redirects to admin)
│   │   ├── trial-signup/         # Trial signup
│   │   └── api/auth/             # Auth API actions
│   ├── lib/                      # Utilities & helpers
│   │   └── api-client.ts         # API communication
│   └── stores/                   # Minimal auth state only
│       └── authStore.tsx         # Authentication state
└── tests/                        # Vitest tests

admin/                            # Solid.js Dashboard SPA (EXISTING - TO BE ENHANCED)
├── src/
│   ├── pages/                    # Dashboard management pages (MIGRATE HERE)
│   │   ├── dashboard/            # Main dashboard
│   │   ├── orders/               # Order management (MOVE from website)
│   │   ├── inventory/            # Inventory tracking (MOVE from website)
│   │   ├── production/           # Production planning (MOVE from website)
│   │   ├── recipes/              # Recipe management (MOVE from website)
│   │   ├── customers/            # Customer management (MOVE from website)
│   │   └── analytics/            # Business analytics (MOVE from website)
│   ├── components/               # Dashboard UI components
│   ├── stores/                   # Application state management
│   └── lib/                      # Utilities and API client
└── tests/                        # Testing suite
```

**Structure Decision**: Three-tier web application architecture with clear separation:
1. **website**: SSR SolidStart app for public landing, marketing, and authentication only
2. **admin**: Solid.js SPA for ALL dashboard/management features (migrated from website)
3. **api**: Shared NestJS backend serving both frontend applications

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load existing `tasks.md` (already created with 82 tasks)
- Enhance with Phase 1 design artifacts:
  - data-model.md: 5 entities → database schema tasks
  - contracts/saas-portal-api.yaml: 11 endpoints → contract test tasks
  - quickstart.md: 6 scenarios → integration test tasks
- Verify migration tasks align with data model
- Add implementation tasks for TDD workflow

**Three-Tier Architecture Tasks**:
1. **Backend (bakewind-api)**: Database schemas, API services, contract tests
2. **Customer App (bakewind-customer)**: SSR components, landing pages, auth flow
3. **Admin App (bakewind-admin)**: SPA dashboard, migrated features, client-side routing

**Ordering Strategy**:
- Phase 3.1-3.5: Backend foundation (database → tests → services → controllers)
- Phase 3.6-3.9: Customer app SSR implementation
- Phase 3.10: Dashboard migration and integration
- TDD approach: Contract tests before implementation
- Mark [P] for parallel execution (different files)

**Current Status**: 82 tasks already defined covering:
- Database setup: T001-T008
- Contract tests: T009-T016
- Backend services: T017-T035
- Frontend customer app: T036-T055
- Dashboard migration: T056-T082

**Estimated Completion**: All tasks defined and ready for execution

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*
