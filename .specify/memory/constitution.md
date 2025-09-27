<!-- Sync Impact Report
Version change: 0.0.0 → 1.0.0 (initial constitution)
Modified principles: N/A (initial creation)
Added sections: All sections (initial creation)
Removed sections: N/A (initial creation)
Templates requiring updates:
  ✅ plan-template.md - Constitution check references updated
  ✅ spec-template.md - Aligned with scope requirements
  ✅ tasks-template.md - Task categorization consistent
  ✅ agent-file-template.md - No updates required
Follow-up TODOs: None - all fields completed
-->

# BakeWind Constitution

## Core Principles

### I. Database-First Architecture
Every feature implementation MUST begin with database schema design.
Data models drive API contracts, which drive UI components. Changes
flow in one direction: database → backend → frontend. This ensures
data integrity and prevents UI-driven compromises to the data layer.

### II. Type Safety Throughout
All code MUST be fully typed with no implicit 'any' types. TypeScript
strict mode is mandatory for both backend and frontend. Database schemas
MUST generate typed interfaces via Drizzle. API contracts MUST be typed
with DTOs in NestJS and validated at runtime. This principle prevents
runtime errors and ensures compile-time correctness.

### III. Test-Driven Development (NON-NEGOTIABLE)
Tests MUST be written before implementation following Red-Green-Refactor:
1. Write failing tests that define expected behavior
2. Implement minimal code to pass tests
3. Refactor while keeping tests green
Integration tests are required for all API endpoints. Unit tests are
required for business logic. E2E tests validate critical user flows.

### IV. Separation of Concerns
Backend handles all business logic and data persistence via NestJS modules.
Frontend is purely presentational with SolidStart managing UI state.
Database operations stay within their respective service layers.
No direct database queries in controllers or components.
Each module owns its complete vertical slice.

### V. Observability First
Every service action MUST emit structured logs with correlation IDs.
Performance metrics MUST be collected for all database queries and API calls.
Health checks MUST exist for all external dependencies.
Errors MUST include actionable context for debugging.

## Development Standards

### API Design
- RESTful conventions with consistent resource naming
- Versioned endpoints when breaking changes are necessary
- Standardized error responses with proper HTTP status codes
- Request/response validation via zod validation pipes
- OpenAPI documentation auto-generated from decorators
- Repository pattern for data access abstraction

### Database Practices
- All schema changes through versioned Drizzle migrations
- No direct SQL unless absolutely necessary (document why)
- Soft deletes for audit trail maintenance
- UUID primary keys for distributed system readiness
- Indexes on all foreign keys and commonly queried fields

### Security Requirements
- JWT tokens with refresh token rotation
- Input sanitization at API boundaries
- SQL injection prevention via parameterized queries
- CORS configuration restricted to known origins
- Rate limiting on all public endpoints
- No secrets in code - environment variables only

## Governance

This constitution supersedes all project practices and conventions.
Amendments require:
1. Documented rationale for the change
2. Impact assessment on existing code
3. Migration plan for affected components
4. Team consensus or project lead approval

All code reviews MUST verify constitutional compliance.
Violations require explicit justification in complexity tracking.
Non-negotiable principles (marked as such) cannot be violated.
Use CLAUDE.md for runtime development guidance.

**Version**: 1.0.0 | **Ratified**: 2025-01-26 | **Last Amended**: 2025-01-26