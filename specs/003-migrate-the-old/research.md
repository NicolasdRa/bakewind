# Phase 0: Research & Technical Decisions

**Feature**: Dashboard Routes Migration from SolidStart to Solid.js SPA
**Date**: 2025-09-30

## Research Areas

### 1. WebSocket/SSE Strategy for Real-Time Updates

**Decision**: WebSocket using Socket.IO (NestJS @nestjs/websockets + socket.io-client)

**Rationale**:
- Socket.IO provides automatic reconnection with exponential backoff (matches FR-016b requirement)
- Built-in fallback mechanisms (WebSocket → HTTP long-polling)
- NestJS has first-class support via @nestjs/websockets and @nestjs/platform-socket.io
- Bidirectional communication needed for order locking (server-initiated lock notifications)
- Better browser compatibility than pure WebSocket
- Room/namespace support useful for per-user widget updates and order-specific channels

**Alternatives Considered**:
- **Server-Sent Events (SSE)**: Simpler, but unidirectional (server→client only). Would require separate HTTP requests for client→server (order lock acquisition). Less efficient for bidirectional needs.
- **Native WebSocket**: Lower-level control, but requires manual reconnection logic and no built-in fallbacks. More complex to implement exponential backoff correctly.
- **GraphQL Subscriptions**: Adds complexity, requires separate GraphQL server or federation. Overkill for dashboard metrics.

### 2. Order Locking Mechanism

**Decision**: Redis-backed pessimistic locks with TTL + WebSocket notifications

**Rationale**:
- Pessimistic locking prevents concurrent edits (FR-022a requirement)
- Redis provides atomic operations (SET NX EX) and automatic TTL expiration
- TTL prevents orphaned locks if user closes browser without explicit unlock
- WebSocket notifies other users instantly when lock acquired/released
- Low latency (<10ms) for lock checks
- Existing Redis instance can be reused (likely already in infra for caching)

**Implementation Pattern**:
```
Lock Key: order_lock:{orderId}
Lock Value: {userId}:{sessionId}:{timestamp}
TTL: 300 seconds (5 minutes, renewable on activity)
```

**Alternatives Considered**:
- **Database row-level locks**: Higher latency (~50ms), requires transaction management, risk of lock escalation
- **Optimistic locking (version field)**: Allows concurrent edits, shows conflict only at save. Poor UX for collaborative editing.
- **In-memory locks (NestJS)**: Lost on server restart, doesn't work with horizontal scaling

### 3. Predictive Inventory Calculations

**Decision**: Background job calculates consumption rates daily + on-demand API endpoint

**Rationale**:
- Predictive threshold = (current_stock / avg_daily_consumption) < lead_time_days
- Daily batch job computes 7-day rolling average consumption from order history
- Stores result in `inventory_consumption` table (indexed by ingredient_id)
- On-demand recalculation endpoint for immediate updates after manual inventory adjustments
- Frontend queries pre-calculated values for instant <100ms response
- User overrides stored in same table, take precedence over predictions

**Algorithm**:
```typescript
low_stock = (current_stock / avg_consumption_per_day) < (lead_time_days + safety_buffer)
// Example: 50 units / 20 units/day = 2.5 days supply < (3 days lead time + 1 day buffer)
```

**Alternatives Considered**:
- **Real-time calculation on every request**: Too slow (requires aggregating order history), violates <200ms p95 latency
- **Fixed threshold (e.g., <10 units)**: Doesn't account for high-volume vs low-volume items
- **ML-based forecasting**: Overkill for MVP, requires training data and model deployment

### 4. Widget Configuration Storage

**Decision**: PostgreSQL `widget_configurations` table with JSONB column for widget state

**Rationale**:
- User-specific widget layouts need persistence across sessions (FR-015)
- JSONB allows flexible widget state (type, position, size, data filters) without schema changes
- PostgreSQL JSONB supports indexing and querying (GIN index on common filters)
- Max 20 widgets per user × ~500 bytes each = ~10KB per user (reasonable)
- Relational integrity with user_id foreign key
- Atomic updates prevent race conditions

**Schema**:
```sql
widget_configurations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  layout_type VARCHAR(20), -- 'grid' | 'list' | 'masonry'
  widgets JSONB, -- [{type, position, config}, ...]
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  CONSTRAINT max_widgets CHECK (jsonb_array_length(widgets) <= 20)
)
```

**Alternatives Considered**:
- **LocalStorage only**: Lost on device change, no backup, can't sync across devices
- **Separate widgets table (normalized)**: Over-normalized for flexible schema, requires many JOINs
- **Redis**: Ephemeral, no persistent backup, harder to query/audit

### 5. Theme Persistence Strategy

**Decision**: Hybrid - LocalStorage (immediate) + backend sync (optional multi-device)

**Rationale**:
- LocalStorage provides instant theme application on page load (no flash)
- Backend stores theme in `users.preferences` JSONB column for multi-device sync
- Sync on theme change: update localStorage immediately, async POST to backend
- On login: fetch backend preference, merge with localStorage (backend wins on conflict)
- Fallback: if backend fails, localStorage still works (graceful degradation)

**Alternatives Considered**:
- **LocalStorage only**: No multi-device sync, lost on cache clear
- **Backend only**: Theme flash on page load (waits for API response), poor UX
- **CSS system preference (@media prefers-color-scheme)**: No user control override

### 6. Dashboard Metrics Real-Time Update Strategy

**Decision**: Room-based WebSocket broadcasts with throttling

**Rationale**:
- Each user joins `dashboard:{userId}` Socket.IO room on connection
- Server emits metrics updates to room when relevant data changes
- Throttle broadcasts to max 1 per second per metric type (prevents spam)
- Delta updates (only changed fields) to minimize payload size
- Frontend merges deltas with existing state reactively

**Event Flow**:
```
1. Order status changes (orders.service.ts)
   → orderMetricsGateway.broadcastOrderMetrics(userId, deltaMetrics)
2. Socket.IO emits to room('dashboard:' + userId)
3. Frontend socket.on('metrics:update') → store.mergeMetrics(delta)
4. Solid.js reactivity updates UI automatically
```

**Alternatives Considered**:
- **Polling**: Wasteful (99% of requests return no changes), 1-5s delay, higher server load
- **SSE**: Can't send lock notifications (unidirectional), requires separate endpoint
- **Broadcast to all users**: Privacy leak, too much traffic

### 7. Component Styling Strategy

**Decision**: Tailwind CSS v4 with component-scoped module.css files

**Rationale**:
- Tailwind v4 utility classes for rapid development (matches CLAUDE.md)
- Module CSS for complex component-specific styles (prevents global conflicts per FR-056)
- Design tokens defined in Tailwind config (colors, spacing, animations)
- Consistent amber/orange brand colors from existing design system (FR-050)
- Dark mode via Tailwind's `dark:` variants
- Scoped styles prevent dashboard migration from breaking existing admin UI

**Alternatives Considered**:
- **Styled Components**: Runtime cost, larger bundle size, not in project stack
- **Global CSS**: Risk of conflicts during migration, hard to refactor
- **Inline styles**: No media queries, poor maintainability

### 8. Testing Strategy

**Decision**: Three-tier testing pyramid

**Backend**:
- **Unit tests (Jest)**: Service logic, calculations (inventory predictions, lock logic)
- **Integration tests (Jest + Supertest)**: API endpoints with in-memory DB
- **E2E tests (Jest)**: Critical flows (WebSocket connection, order locking race conditions)

**Frontend**:
- **Component tests (Vitest + @solidjs/testing-library)**: Individual components (widgets, cards, forms)
- **Integration tests (Vitest)**: Store logic, API client error handling
- **E2E tests (Playwright)**: Critical user flows (login → dashboard → edit order → lock handling)

**Test-First Order** (per TDD principle):
1. Write failing contract tests for new API endpoints
2. Write failing component tests for UI
3. Implement backend to pass contract tests
4. Implement frontend to pass component tests
5. Write E2E tests for acceptance scenarios
6. Refactor while keeping tests green

**Alternatives Considered**:
- **Manual testing only**: Violates TDD constitution principle
- **E2E tests only**: Slow feedback loop, hard to isolate failures
- **No integration tests**: Misses API contract mismatches

## Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Backend Runtime | Node.js | >=22 | Server execution |
| Backend Framework | NestJS | Latest | API structure, DI |
| Backend HTTP | Fastify | via NestJS | Performance |
| Database | PostgreSQL | Latest | Persistence |
| ORM | Drizzle | Latest | Type-safe queries |
| Real-time | Socket.IO | Latest | WebSocket + fallbacks |
| Cache/Locks | Redis | Latest | Order locks, sessions |
| Frontend Framework | Solid.js | 1.x | Reactive UI |
| Frontend Router | @solidjs/router | Latest | Client-side routing |
| Styling | Tailwind CSS | v4 | Utility-first CSS |
| Backend Testing | Jest | Latest | Unit/integration/E2E |
| Frontend Testing | Vitest | Latest | Component tests |
| E2E Testing | Playwright | Latest | Full flow validation |

## Open Questions Resolved

All NEEDS CLARIFICATION items from Technical Context have been resolved:
- ✅ Real-time strategy: Socket.IO WebSocket
- ✅ Order locking: Redis pessimistic locks
- ✅ Inventory predictions: Daily batch job + on-demand
- ✅ Widget storage: PostgreSQL JSONB
- ✅ Theme persistence: Hybrid localStorage + backend
- ✅ Testing approach: Three-tier pyramid with TDD

## Next Steps

Proceed to **Phase 1: Design & Contracts** to:
1. Define database schemas (widget_configurations, order_locks, inventory_consumption)
2. Generate API contracts for new endpoints
3. Create contract tests
4. Extract quickstart scenarios
5. Update CLAUDE.md context

---
*Research complete: 2025-09-30*