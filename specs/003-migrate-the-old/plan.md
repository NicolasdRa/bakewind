
# Implementation Plan: Dashboard Routes Migration

**Branch**: `003-migrate-the-old` | **Date**: 2025-09-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-migrate-the-old/spec.md`

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
Migrate the comprehensive bakery management dashboard from the legacy SolidStart SSR application to the new Solid.js SPA (admin project), including both frontend migration and missing backend API endpoints. This involves: (1) Backend - implementing missing API endpoints for dashboard features, real-time WebSocket/SSE support, order locking mechanism, predictive inventory calculations, and widget configuration persistence; (2) Frontend - recreating all dashboard routes (Overview, Orders, Inventory, Recipes, Products, Production, Customers, Analytics, Profile, Settings) with identical structure and styling, integrating with the NestJS backend API (port 5000) and authentication flow from the website project (port 3000). The admin SPA (port 3001) will support real-time updates via WebSocket/SSE, customizable dashboard widgets (up to 20 per user), order locking for concurrent editing, predictive inventory alerts, and comprehensive responsive design with light/dark theme support.

## Technical Context
**Language/Version**: TypeScript (strict mode), Node.js >= 22
**Primary Dependencies**:
  - Backend: NestJS, Fastify, Drizzle ORM, PostgreSQL, @nestjs/websockets, @nestjs/platform-socket.io
  - Frontend: Solid.js 1.x, @solidjs/router, Tailwind CSS v4, socket.io-client
**Storage**: PostgreSQL (widget configs, order locks, inventory consumption tracking) + Browser localStorage (auth tokens, UI preferences)
**Testing**: Backend: Jest (unit/integration/E2E) | Frontend: Vitest (unit/component) + Playwright (E2E)
**Target Platform**: Backend: Linux/Docker | Frontend: Modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
**Project Type**: web (frontend SPA + backend API - both require implementation)
**Performance Goals**: API <200ms p95 latency, UI <100ms response time, <2s initial page load, 60fps animations
**Constraints**: Real-time connection with exponential backoff (2s, 4s, 8s, 16s), max 20 widgets per user, responsive design (320px to 4K), order locks with TTL
**Scale/Scope**: Backend: 15+ new API endpoints, WebSocket gateway, 3 new DB schemas | Frontend: 10 dashboard routes, ~30 UI components

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Core Principles Compliance**:
- [x] Database-First: New schemas designed first (widget_configurations, order_locks, inventory_consumption_tracking) via Drizzle migrations
- [x] Type Safety: All TypeScript interfaces fully typed (backend DTOs, frontend models), strict mode enabled, no 'any' types
- [x] TDD: Tests written before implementation (backend: Jest contract/integration tests | frontend: Vitest component tests, Playwright E2E)
- [x] Separation: Clear boundaries - Backend: Controllers → Services → Repositories | Frontend: Pages → Components → API Services → Stores
- [x] Observability: Structured logging with correlation IDs, performance metrics for DB queries and API calls, health checks, error context

**Standards Compliance**:
- [x] API follows RESTful conventions: New endpoints follow existing patterns, versioned (/api/v1/...), standard HTTP methods
- [x] Database changes via migrations only: All new schemas via Drizzle migrations, no direct SQL except documented cases
- [x] Security requirements addressed: JWT auth (existing), input validation (zod pipes), SQL injection prevention (parameterized), rate limiting, CORS

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
```
api/                                    # Backend NestJS API (EXISTING - EXTEND)
├── src/
│   ├── database/
│   │   └── schemas/
│   │       ├── widget-configurations.ts    # NEW: User dashboard widget prefs
│   │       ├── order-locks.ts              # NEW: Order editing lock state
│   │       └── inventory-consumption.ts    # NEW: Consumption rate tracking
│   ├── widgets/                            # NEW MODULE
│   │   ├── dto/
│   │   ├── widgets.controller.ts
│   │   ├── widgets.service.ts
│   │   └── widgets.module.ts
│   ├── order-locks/                        # NEW MODULE
│   │   ├── dto/
│   │   ├── order-locks.gateway.ts          # WebSocket
│   │   ├── order-locks.service.ts
│   │   └── order-locks.module.ts
│   ├── inventory/                          # EXISTING - EXTEND
│   │   └── inventory.service.ts            # Add predictive calculations
│   ├── analytics/                          # EXISTING - EXTEND
│   │   └── analytics.controller.ts         # Add dashboard metrics
│   └── realtime/                           # NEW MODULE
│       ├── realtime.gateway.ts             # WebSocket gateway
│       └── realtime.module.ts
└── test/
    ├── widgets.e2e-spec.ts
    ├── order-locks.e2e-spec.ts
    └── realtime.e2e-spec.ts

admin/                                  # Frontend Solid.js SPA (EXISTING - MIGRATE DASHBOARD)
├── src/
│   ├── pages/                          # NEW: Migrate dashboard routes
│   │   ├── Overview.tsx
│   │   ├── Orders.tsx
│   │   ├── Inventory.tsx
│   │   ├── Recipes.tsx
│   │   ├── Products.tsx
│   │   ├── Production.tsx
│   │   ├── Customers.tsx
│   │   ├── Analytics.tsx
│   │   ├── Profile.tsx
│   │   └── Settings.tsx
│   ├── components/                     # NEW: Dashboard UI components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── MobileMenu.tsx
│   │   ├── widgets/
│   │   │   ├── WidgetGrid.tsx
│   │   │   ├── MetricsWidget.tsx
│   │   │   └── ChartWidget.tsx
│   │   └── orders/
│   │       ├── OrderCard.tsx
│   │       ├── OrderModal.tsx
│   │       └── OrderLockIndicator.tsx
│   ├── api/                            # NEW: API client services
│   │   ├── client.ts                   # HTTP client with auth
│   │   ├── widgets.ts
│   │   ├── orders.ts
│   │   └── realtime.ts                 # WebSocket client
│   ├── stores/                         # EXISTING - EXTEND
│   │   ├── auth.ts                     # EXISTING: Auth store
│   │   ├── widgets.ts                  # NEW: Widget state
│   │   ├── theme.ts                    # NEW: Theme state
│   │   └── realtime.ts                 # NEW: Connection state
│   └── App.tsx                         # EXISTING - EXTEND: Add dashboard routes
└── tests/
    ├── components/
    ├── pages/
    └── e2e/
```

**Structure Decision**: Web application with separate backend API and frontend SPA. Backend extends existing NestJS API with 3 new modules (widgets, order-locks, realtime) and 3 new database schemas. Frontend migrates dashboard routes from legacy SSR app into existing admin/ SPA base structure, integrating with existing auth store and routing. Both follow project patterns from CLAUDE.md.

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
1. Load `.specify/templates/tasks-template.md` as base
2. Generate tasks from Phase 1 artifacts:
   - **From data-model.md**: 3 schema creation tasks (widget_configurations, order_locks, inventory_consumption_tracking)
   - **From contracts/**: 12 contract test tasks (widgets API, order-locks API, inventory extensions, WebSocket events)
   - **From quickstart.md**: 9 E2E test scenario tasks (auth, navigation, widgets, realtime, orders, locks, inventory, theme, mobile)
3. Task categorization:
   - **Database** [P]: Schema definitions, migrations
   - **Backend** [P within modules]: DTO validation, services, controllers, gateways
   - **Frontend** [P within layers]: API clients, stores, components, pages
   - **Tests**: Contract tests → Unit tests → Integration tests → E2E tests
   - **Integration**: Wire modules together, configure WebSocket, seed data

**Ordering Strategy** (TDD + Dependency):
1. **Phase A - Foundation** [P]: Database schemas, migrations, Drizzle type generation
2. **Phase B - Backend Contract Tests** [P]: Write failing tests for all API endpoints
3. **Phase C - Backend Implementation**:
   - Services layer (business logic) [P per module]
   - Controllers/Gateways (HTTP/WS handlers) [P per module]
   - Wire into NestJS app module
4. **Phase D - Frontend Contract Tests** [P]: Component tests, API client tests
5. **Phase E - Frontend Implementation**:
   - API client services [P]
   - Stores (state management) [P]
   - UI components [P within categories]
   - Pages (route components) [P]
   - Router integration
6. **Phase F - E2E Tests**: Critical flows from quickstart.md (Playwright)
7. **Phase G - Validation**: Run all tests, performance benchmarks, quickstart scenarios

**Estimated Task Breakdown**:
- Database: 5 tasks (schemas, migrations, seed data)
- Backend: 25 tasks (3 modules × ~8 tasks each + WebSocket)
- Frontend: 30 tasks (API clients, stores, components, pages)
- Tests: 20 tasks (contract + E2E)
- Integration: 5 tasks (wiring, config, documentation)
- **Total**: ~85 tasks

**Parallel Execution Markers**:
- [P] = Fully parallelizable (no dependencies)
- [P*] = Parallelizable within phase (depends on previous phase completion)
- [S] = Sequential (blocking dependency)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

**No constitutional violations detected.** All design decisions comply with:
- ✅ Database-First: 3 new schemas designed before API contracts
- ✅ Type Safety: Drizzle generates types, DTOs use Zod validation
- ✅ TDD: Contract tests defined in quickstart.md, to be written before implementation
- ✅ Separation: Clear module boundaries (widgets/, order-locks/, realtime/)
- ✅ Observability: Logging and metrics planned in research.md
- ✅ API Standards: RESTful endpoints + WebSocket events documented in contracts/
- ✅ Database Migrations: All schema changes via Drizzle migrations
- ✅ Security: JWT auth, input validation, rate limiting addressed


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - research.md created
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/, quickstart.md created
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command) - NEXT STEP
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS (all principles addressed)
- [x] Post-Design Constitution Check: PASS (no violations detected)
- [x] All NEEDS CLARIFICATION resolved (no placeholders in Technical Context)
- [x] Complexity deviations documented (N/A - no violations)

**Artifacts Generated**:
- [x] plan.md (this file)
- [x] research.md (8 research areas, tech stack decisions)
- [x] data-model.md (3 new entities, relationships, validation)
- [x] contracts/widgets-api.yaml (OpenAPI spec)
- [x] contracts/order-locks-api.yaml (OpenAPI spec)
- [x] contracts/inventory-api.yaml (OpenAPI spec)
- [x] contracts/realtime-events.yaml (WebSocket events)
- [x] quickstart.md (9 validation scenarios)
- [x] CLAUDE.md updated (agent context synced)

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*
