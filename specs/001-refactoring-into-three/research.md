# Research: Application Architecture Refactoring

**Feature**: Three-Application Architecture
**Date**: 2025-01-26
**Status**: Complete

## Research Areas

### 1. API Versioning Strategy

**Decision**: URL-based versioning with `/api/v1` prefix
**Rationale**:
- Clear and explicit versioning visible in URLs
- Easy to maintain multiple versions simultaneously
- Simple to deprecate old versions
- Works well with OpenAPI documentation

**Alternatives Considered**:
- Header-based versioning: More complex for client implementation
- Query parameter versioning: Less RESTful and harder to cache
- Media type versioning: Too complex for this use case

### 2. Authentication Architecture

**Decision**: JWT with refresh tokens stored in httpOnly cookies
**Rationale**:
- Stateless authentication scales well across multiple applications
- Refresh tokens provide security without frequent re-authentication
- HttpOnly cookies prevent XSS attacks
- Works seamlessly across SPA applications

**Alternatives Considered**:
- Session-based auth: Requires sticky sessions, harder to scale
- OAuth2: Overkill for internal applications
- API keys only: Less secure for user-facing applications

### 3. Deployment Strategy

**Decision**: Docker Compose deployment on Hetzner VPS
**Rationale**:
- Simple and maintainable for bakery-scale operations
- Cost-effective for expected load (10k customers, 100 staff)
- Easy debugging and monitoring with direct server access
- Quick rollback via Docker image tags
- Proven reliability with Hetzner infrastructure

**Implementation Details**:
- Single Hetzner VPS (initially, can scale vertically)
- Docker Compose orchestrating all three applications
- Nginx reverse proxy for routing
- PostgreSQL in Docker with volume mounts
- Automated backups to Hetzner Storage Box

**Alternatives Considered**:
- Kubernetes: Overkill for this scale, unnecessary complexity
- Serverless: Too complex for stateful operations
- PaaS (Railway/Render): Less control, potentially higher costs
- Traditional VMs: Less efficient resource usage

### 4. Real-time Data Synchronization

**Decision**: WebSocket connections via Socket.IO for real-time updates
**Rationale**:
- Bi-directional communication for order updates
- Fallback to polling for unreliable connections
- Room-based architecture for efficient broadcasting
- Well-supported in both NestJS and SolidStart

**Alternatives Considered**:
- Server-Sent Events: One-way only, less flexible
- Long polling: Higher latency and resource usage
- GraphQL subscriptions: More complex setup

### 5. API Client Generation

**Decision**: OpenAPI-based client generation using openapi-typescript
**Rationale**:
- Type-safe API clients generated from single source of truth
- Automatic synchronization between API and clients
- Reduces manual typing errors
- Supports both customer and admin applications

**Alternatives Considered**:
- Manual client creation: Error-prone and time-consuming
- GraphQL: Requires complete API rewrite
- tRPC: Too tightly coupled for independent deployments

### 6. Database Migration Strategy

**Decision**: Staged migration with dual-write period
**Rationale**:
- Zero-downtime migration
- Ability to rollback if issues arise
- Gradual validation of new architecture
- Data consistency maintained throughout

**Migration Phases**:
1. API reads from existing database
2. Dual-write to both old and new structures
3. Gradual migration of read operations
4. Final cutover and cleanup

### 7. Error Handling and Monitoring

**Decision**: Structured logging with correlation IDs and distributed tracing
**Rationale**:
- Track requests across all three applications
- Identify performance bottlenecks
- Debug issues in production
- Meet observability constitution requirements

**Implementation**:
- Correlation ID generation at API gateway
- Propagation through all service calls
- Structured JSON logging
- Docker logs aggregation
- Optional: Grafana/Loki stack for visualization

### 8. CORS Configuration

**Decision**: Strict origin validation with environment-based configuration
**Rationale**:
- Security through explicit origin allowlisting
- Different origins for development and production
- Credentials support for authentication cookies
- Preflight caching for performance

**Configuration**:
- Customer app origin: configurable via environment
- Admin app origin: configurable via environment
- Methods: GET, POST, PUT, DELETE, PATCH
- Credentials: true for authentication

## Docker Compose Architecture

**Service Layout**:
```yaml
services:
  nginx:         # Reverse proxy and static file serving
  bakewind-api:  # NestJS API service
  bakewind-customer: # SolidStart customer app
  bakewind-admin:    # SolidStart admin app
  postgres:      # PostgreSQL database
  redis:         # Cache and session storage (optional)
```

**Network Configuration**:
- Internal Docker network for service communication
- Only Nginx exposed to host
- SSL termination at Nginx level
- Let's Encrypt for certificates

**Resource Allocation** (for Hetzner VPS):
- Initial: 4-8 vCPU, 16GB RAM, 160GB SSD
- Can scale vertically as needed
- Database on SSD for performance
- Regular backups to Hetzner Storage Box

## Performance Targets (Resolved)

Based on industry standards and bakery business requirements:

**Customer Website**:
- Primary page load: <2 seconds
- Time to interactive: <3 seconds
- Lighthouse score: >90

**API Service**:
- Throughput: 500 requests/second
- P95 latency: <200ms
- P99 latency: <500ms

**Admin System**:
- Concurrent users: 50
- Dashboard load: <3 seconds
- Real-time updates: <1 second delay

## Security Considerations

1. **API Gateway**: Rate limiting via Nginx
2. **Authentication**: Separate JWT secrets per environment
3. **Authorization**: Role-based access control (RBAC)
4. **Data Validation**: Zod schemas at API boundaries
5. **SQL Injection**: Parameterized queries via Drizzle ORM
6. **XSS Prevention**: Content Security Policy headers
7. **HTTPS**: Enforced via Nginx with Let's Encrypt
8. **Firewall**: UFW rules limiting exposed ports
9. **Updates**: Automated security updates for OS
10. **Backups**: Daily encrypted backups to separate location

## Deployment Workflow

1. **Local Development**: Docker Compose with hot reload
2. **CI/CD**: GitHub Actions for testing and building
3. **Deployment**:
   - SSH deploy action to Hetzner VPS
   - Blue-green deployment with Docker Compose
   - Health checks before traffic switch
   - Automatic rollback on failure

## Technology Stack Validation

**Confirmed Technologies**:
- NestJS: Proven for enterprise APIs
- SolidStart: Modern, performant for SPAs
- PostgreSQL: Reliable for transactional data
- Drizzle ORM: Type-safe database operations
- Jest/Vitest: Comprehensive testing coverage
- Docker & Docker Compose: Container orchestration
- Nginx: Battle-tested reverse proxy
- Hetzner VPS: Reliable, cost-effective hosting

All research items resolved. Ready for Phase 1 design.