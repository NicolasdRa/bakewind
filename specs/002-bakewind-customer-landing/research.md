# Research Document: BakeWind SaaS Landing & Dashboard Separation

**Feature**: BakeWind SaaS Landing & Dashboard Separation
**Date**: 2025-09-28
**Branch**: `002-bakewind-customer-landing`

## Research Summary

This document captures research findings and decisions for implementing the BakeWind three-tier architecture with proper separation between landing pages and dashboard functionality.

## Key Decisions

### 1. Frontend Architecture Split
**Decision**: Separate SSR landing app (website) and SPA dashboard (admin)
**Rationale**:
- SSR provides optimal SEO for marketing pages and faster initial page loads
- SPA offers better interactivity for authenticated dashboard features
- Clear separation prevents feature bleeding and improves maintainability
**Alternatives considered**:
- Single SPA with SSR for specific routes (rejected: complexity and SEO limitations)
- Multiple micro-frontends (rejected: overhead for current scale)

### 2. Authentication Handoff
**Decision**: JWT token passing with secure redirect between apps
**Rationale**:
- Industry standard for token-based auth across applications
- Maintains session continuity without re-authentication
- Secure when implemented with httpOnly cookies and CORS
**Alternatives considered**:
- OAuth2 flow (rejected: overkill for internal app handoff)
- Session-based auth (rejected: doesn't work well across domains)

### 3. Stripe Integration
**Decision**: Direct Stripe SDK integration in backend with webhook handlers
**Rationale**:
- Stripe is the specified payment processor per clarifications
- Webhook pattern ensures reliable subscription state updates
- PCI compliance maintained by keeping payment details server-side
**Alternatives considered**:
- Stripe Connect (rejected: for marketplace model, not SaaS)
- Payment abstraction layer (rejected: unnecessary complexity)

### 4. Trial Management
**Decision**: Database-driven trial state with automatic expiration
**Rationale**:
- 14-day trial period specified in clarifications
- Database tracking enables conversion analytics
- Automatic expiration prevents manual intervention
**Alternatives considered**:
- Stripe trial periods (rejected: less control over trial features)
- Feature flags only (rejected: doesn't track conversion properly)

### 5. Dashboard Migration Strategy
**Decision**: Gradual migration with feature parity verification
**Rationale**:
- Reduces risk of breaking existing functionality
- Allows testing of each migrated feature independently
- Maintains backward compatibility during transition
**Alternatives considered**:
- Big bang migration (rejected: too risky)
- Iframe embedding (rejected: poor UX and performance)

## Technology Stack Validation

### SolidStart 1.1 for SSR
- ✅ Excellent SEO capabilities with server-side rendering
- ✅ File-based routing simplifies page organization
- ✅ Built-in API routes for backend communication
- ✅ TypeScript first-class support

### Solid.js for Dashboard SPA
- ✅ Reactive fine-grained reactivity perfect for dashboards
- ✅ Smaller bundle size than React/Vue alternatives
- ✅ No virtual DOM overhead for better performance
- ✅ Easy migration path from existing components

### NestJS Backend
- ✅ Modular architecture aligns with constitutional principles
- ✅ Built-in dependency injection for testability
- ✅ Decorators enable auto-generated OpenAPI docs
- ✅ TypeScript throughout with strict typing

### Drizzle ORM
- ✅ Type-safe database queries
- ✅ Migration system for schema versioning
- ✅ Lightweight with good PostgreSQL support
- ✅ Generates TypeScript types from schema

## Integration Patterns

### API Communication
- RESTful endpoints with consistent naming
- JWT in Authorization header
- Request/response DTOs with zod validation
- Error responses follow RFC 7807 (Problem Details)

### State Management
- Customer app: Minimal auth state only
- Admin app: Comprehensive stores for each domain
- No shared state between applications
- Local storage for non-sensitive preferences

### Deployment Architecture
- All three apps deployable independently
- Shared PostgreSQL database
- Environment-based configuration
- CORS configured for known origins only

## Security Considerations

### Authentication
- JWT with 15-minute access tokens
- Refresh tokens with 7-day expiry
- Secure httpOnly cookies for tokens
- CSRF protection via double-submit cookies

### Data Protection
- All API endpoints require authentication except public pages
- Rate limiting on auth endpoints (10 attempts per minute)
- Input sanitization at API boundaries
- SQL injection prevention via parameterized queries

### Compliance
- GDPR-ready with data export capabilities
- PCI DSS compliance via Stripe
- WCAG 2.1 AA accessibility standards
- Cookie consent for marketing pages

## Performance Targets

### Landing Pages (SSR)
- Time to First Byte: <200ms
- First Contentful Paint: <1s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1

### Dashboard (SPA)
- Initial bundle size: <200KB gzipped
- Route transitions: <100ms
- API response times: <500ms p95
- 60fps for all animations

## Migration Risks & Mitigations

### Risk: Breaking existing dashboard functionality
**Mitigation**: Feature flag system for gradual rollout

### Risk: Authentication failures between apps
**Mitigation**: Comprehensive integration tests for auth flow

### Risk: Performance degradation
**Mitigation**: Performance benchmarks before/after migration

### Risk: SEO impact during transition
**Mitigation**: 301 redirects and sitemap updates

## Open Questions Resolved

1. **Q: How to handle feature access control?**
   **A**: Plan-based feature flags stored in user JWT claims

2. **Q: Where to implement onboarding flow?**
   **A**: Initial onboarding in customer app, detailed setup in admin dashboard

3. **Q: How to manage shared components?**
   **A**: No sharing - each app maintains its own components for independence

4. **Q: Session timeout handling?**
   **A**: Automatic redirect to login with return URL preservation

## Next Steps

With research complete, we can proceed to Phase 1 design artifacts:
1. Data model definition for new SaaS entities
2. API contract specifications
3. Integration test scenarios
4. Quickstart validation guide

All technical decisions align with constitutional principles and support the three-tier architecture for optimal separation of concerns.