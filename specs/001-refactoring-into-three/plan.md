# Implementation Plan: Application Architecture Refactoring

**Branch**: `001-refactoring-into-three` | **Date**: 2025-01-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-refactoring-into-three/spec.md`

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
Refactor the existing BakeWind monolithic architecture into three distinct applications: a customer-facing website for online ordering, a central API service managing all business logic and data operations, and an administration system for bakery staff operations. This separation enables independent scaling, improved security boundaries, and optimized user experiences for different user groups.

## Technical Context
**Language/Version**: TypeScript 5.x / Node.js 22+
**Primary Dependencies**:
  - API: NestJS, Fastify, Drizzle ORM, PostgreSQL
  - Customer Website: SolidStart, Tailwind CSS v4
  - Admin System: SolidStart, Tailwind CSS v4
**Storage**: PostgreSQL (central database), SQLite (frontend local caching)
**Testing**: Jest (backend), Vitest (frontend)
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: web - three-app architecture
**Performance Goals**:
  - Customer website: <2s page load time
  - API: 500 req/s throughput
  - Admin system: Support 50 concurrent users
**Constraints**:
  - <200ms p95 API response time
  - Maintain zero-downtime deployment capability
  - Preserve all existing functionality
**Scale/Scope**:
  - 10k+ customers
  - 100+ staff users
  - 3 separate deployable applications

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Core Principles Compliance**:
- [x] Database-First: Schema design precedes API design
- [x] Type Safety: All interfaces fully typed, no 'any'
- [x] TDD: Tests written before implementation
- [x] Separation: Clear module boundaries maintained
- [x] Observability: Logging and metrics planned

**Standards Compliance**:
- [x] API follows RESTful conventions
- [x] Database changes via migrations only
- [x] Security requirements addressed

## Project Structure

### Documentation (this feature)
```
specs/001-refactoring-into-three/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
bakewind-api/                    # Central API Service (refactored from bakewind-backend)
├── src/
│   ├── modules/                 # Business domain modules
│   │   ├── auth/
│   │   ├── users/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── inventory/
│   │   ├── production/
│   │   └── analytics/
│   ├── database/
│   │   ├── schemas/
│   │   └── migrations/
│   └── common/                  # Shared utilities
└── tests/
    ├── contract/
    ├── integration/
    └── unit/

bakewind-customer/               # Customer Website (new)
├── src/
│   ├── routes/                  # Page routes
│   │   ├── products/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── account/
│   ├── components/
│   ├── stores/                  # State management
│   └── api/                     # API client
└── tests/

bakewind-admin/                  # Admin System (refactored from bakewind-front-solidstart)
├── src/
│   ├── routes/
│   │   ├── (dashboard)/         # Protected routes
│   │   ├── orders/
│   │   ├── inventory/
│   │   ├── production/
│   │   └── analytics/
│   ├── components/
│   ├── stores/
│   └── api/                     # API client
└── tests/
```

**Structure Decision**: Three-application architecture with clear separation:
- `bakewind-api`: Central NestJS API service managing all business logic
- `bakewind-customer`: New SolidStart customer-facing website
- `bakewind-admin`: Refactored SolidStart admin system from existing frontend

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - API versioning strategy for backward compatibility
   - Authentication flow between applications (JWT vs session)
   - Deployment orchestration for three apps
   - Data synchronization patterns

2. **Generate and dispatch research agents**:
   ```
   Task: "Research API versioning strategies for multi-client architecture"
   Task: "Find best practices for JWT authentication across multiple SPAs"
   Task: "Research deployment patterns for microservices architecture"
   Task: "Investigate real-time data sync patterns between applications"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Shared entities across applications
   - Application-specific data models
   - Authentication/authorization models

2. **Generate API contracts** from functional requirements:
   - Authentication endpoints
   - Customer-facing endpoints
   - Admin operation endpoints
   - Output OpenAPI schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - Authentication flow tests
   - Customer operations tests
   - Admin operations tests

4. **Extract test scenarios** from user stories:
   - Customer order placement flow
   - Admin order management flow
   - Cross-application data sync validation

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
   - Add three-app architecture context
   - Update with new API patterns

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Setup tasks for three applications
- Migration tasks for existing code
- API endpoint implementation tasks
- Frontend integration tasks
- Testing tasks for each application
- Deployment configuration tasks

**Ordering Strategy**:
- API setup and migration first
- Customer and Admin apps in parallel after API
- Integration testing after all apps ready
- Deployment configuration last

**Estimated Output**: 40-50 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No constitution violations - architecture follows all principles*

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
- [x] Complexity deviations documented

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*