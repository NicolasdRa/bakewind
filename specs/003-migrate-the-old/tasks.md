# Tasks: Dashboard Routes Migration

**Feature**: Dashboard Routes Migration from SolidStart to Solid.js SPA
**Branch**: `003-migrate-the-old`
**Input**: Design documents from `/specs/003-migrate-the-old/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Execution Summary

This task list implements the dashboard migration feature with **85 tasks** across 7 phases:
- **Phase 3.1**: Setup (5 tasks)
- **Phase 3.2**: Tests First - TDD (20 tasks) ⚠️ MUST COMPLETE BEFORE 3.3
- **Phase 3.3**: Backend Implementation (25 tasks)
- **Phase 3.4**: Frontend Implementation (30 tasks)
- **Phase 3.5**: Integration & Wiring (5 tasks)
- **Phase 3.6**: E2E Tests (9 tasks)
- **Phase 3.7**: Polish & Validation (5 tasks)

**Tech Stack**: TypeScript (strict), NestJS, Solid.js, PostgreSQL, Socket.IO
**Project Structure**: Web app with `api/` (backend) and `admin/` (frontend)

---

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **File paths**: All paths are relative to repository root

---

## Phase 3.1: Setup & Dependencies

- [x] **T001** [P] Install backend dependencies in `api/`
  - Add: `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`, `ioredis`
  - Run: `cd api && npm install @nestjs/websockets @nestjs/platform-socket.io socket.io ioredis`
  - Verify: `package.json` updated

- [x] **T002** [P] Install frontend dependencies in `admin/`
  - Add: `socket.io-client`
  - Run: `cd admin && npm install socket.io-client`
  - Verify: `package.json` updated

- [x] **T003** [P] Configure TypeScript strict mode in both projects
  - Backend: Verify `api/tsconfig.json` has `"strict": true`
  - Frontend: Verify `admin/tsconfig.json` has `"strict": true`
  - No 'any' types allowed per constitution

- [x] **T004** [P] Set up Redis connection for order locks
  - Create: `api/src/config/redis.config.ts`
  - Configure: Redis client with connection pooling
  - Environment: Add `REDIS_URL` to `.env.example`

- [x] **T005** Create directory structure per plan.md
  - Backend: `api/src/widgets/`, `api/src/order-locks/`, `api/src/realtime/`
  - Frontend: `admin/src/pages/`, `admin/src/components/layout/`, `admin/src/components/widgets/`, `admin/src/components/orders/`, `admin/src/api/`, `admin/src/stores/`
  - Tests: `api/test/`, `admin/tests/components/`, `admin/tests/e2e/`

---

## Phase 3.2: Tests First (TDD) ⚠️ CRITICAL

**IMPORTANT**: All tests in this phase MUST be written and MUST FAIL before ANY implementation in Phase 3.3/3.4.

### Backend Contract Tests (Parallel - Different Files)

- [x] **T006** [P] Contract test: GET /api/v1/widgets/config
  - File: `api/test/widgets/widgets-get-config.e2e-spec.ts`
  - Test: Authenticated user retrieves widget configuration
  - Assert: 200 response with valid WidgetConfiguration schema
  - **MUST FAIL**: Endpoint not implemented yet

- [x] **T007** [P] Contract test: PUT /api/v1/widgets/config
  - File: `api/test/widgets/widgets-update-config.e2e-spec.ts`
  - Test: Update widget configuration with max 20 widgets
  - Assert: 200 on success, 400 if >20 widgets
  - **MUST FAIL**: Endpoint not implemented yet

- [x] **T008** Contract test: POST /api/v1/order-locks/acquire ✓
  - File: `api/test/order-locks/order-locks-acquire.e2e-spec.ts`
  - Test: Acquire lock on order, fail if already locked
  - Assert: 200 with OrderLock, 409 if conflict

- [x] **T009** Contract test: DELETE /api/v1/order-locks/release/:orderId ✓
  - File: `api/test/order-locks/order-locks-release.e2e-spec.ts`
  - Test: Release lock, 404 if not owner
  - Assert: 204 on success

- [x] **T010** Contract test: POST /api/v1/order-locks/renew/:orderId ✓
  - File: `api/test/order-locks/order-locks-renew.e2e-spec.ts`
  - Test: Extend lock TTL, 404 if expired
  - Assert: 200 with updated expires_at

- [x] **T011** Contract test: GET /api/v1/order-locks/status/:orderId ✓
  - File: `api/test/order-locks/order-locks-status.e2e-spec.ts`
  - Test: Check lock status (locked or unlocked)
  - Assert: 200 with OrderLock or UnlockedStatus

- [x] **T012** Contract test: GET /api/v1/inventory (with low_stock flag) ✓
  - File: `api/test/inventory/inventory-list-lowstock.e2e-spec.ts`
  - Test: List inventory with low_stock boolean
  - Assert: 200 with InventoryItemWithTracking[] schema

- [x] **T013** Contract test: GET /api/v1/inventory/:itemId/consumption ✓
  - File: `api/test/inventory/inventory-consumption-get.e2e-spec.ts`
  - Test: Get consumption tracking data
  - Assert: 200 with ConsumptionTracking schema

- [x] **T014** Contract test: PUT /api/v1/inventory/:itemId/consumption/threshold ✓
  - File: `api/test/inventory/inventory-consumption-set-threshold.e2e-spec.ts`
  - Test: Set custom reorder threshold
  - Assert: 200 with updated ConsumptionTracking

- [x] **T015** Contract test: DELETE /api/v1/inventory/:itemId/consumption/threshold ✓
  - File: `api/test/inventory/inventory-consumption-delete-threshold.e2e-spec.ts`
  - Test: Remove custom threshold, revert to predictive
  - Assert: 204 on success

- [x] **T016** Contract test: POST /api/v1/inventory/:itemId/consumption/recalculate ✓
  - File: `api/test/inventory/inventory-consumption-recalculate.e2e-spec.ts`
  - Test: Trigger on-demand recalculation
  - Assert: 200 with updated avg_daily_consumption

### WebSocket Event Tests (Parallel - Different Files)

- [x] **T017** [P] WebSocket test: connection with JWT auth
  - File: `api/test/realtime/realtime-connection.e2e-spec.ts`
  - Test: Client connects with valid JWT token
  - Assert: Connection accepted, invalid token rejected
  - ✅ Tests created and passing

- [x] **T018** [P] WebSocket test: dashboard:join event
  - File: `api/test/realtime/realtime-dashboard-join.e2e-spec.ts`
  - Test: Client joins user-specific dashboard room
  - Assert: Joined room `dashboard:{userId}`
  - ✅ Tests created and passing

- [x] **T019** [P] WebSocket test: metrics:update emission
  - File: `api/test/realtime/realtime-metrics-update.e2e-spec.ts`
  - Test: Server pushes metric updates to room
  - Assert: Client receives delta updates
  - ✅ Tests created and passing

- [x] **T020** [P] WebSocket test: order:locked notification
  - File: `api/test/realtime/realtime-order-locked.e2e-spec.ts`
  - Test: All clients notified when order locked
  - Assert: order:locked event with OrderLock payload
  - ✅ Tests created and passing

- [x] **T021** [P] WebSocket test: order:unlocked notification
  - File: `api/test/realtime/realtime-order-unlocked.e2e-spec.ts`
  - Test: All clients notified when order unlocked
  - Assert: order:unlocked event with order_id
  - ✅ Tests created and passing

### Frontend Component Tests (Parallel - Different Files)

- [x] **T022** [P] Component test: Sidebar navigation ✓ **(2025-12-16)**
  - File: `admin/tests/components/layout/Sidebar.test.tsx`
  - Tests: 13 passing - appStore localStorage persistence, nav items config, state management
  - Covers: sidebar collapse/expand, theme toggle, dashboard layout persistence

- [x] **T023** [P] Component test: WidgetGrid/DashboardContent ✓ **(2025-12-16)**
  - File: `admin/tests/components/widgets/WidgetGrid.test.tsx`
  - Tests: 17 passing - widget configuration, sizes, localStorage, defaults
  - Covers: widget types, ID generation, titles, persistence, max 20 limit

- [x] **T024** [P] Component test: OrderLockIndicator ✓ **(2025-12-16)**
  - File: `admin/tests/components/orders/OrderLockIndicator.test.tsx`
  - Tests: 14 passing - lock time formatting, data structure, display logic
  - Covers: time formatting (mins/hours), expiration detection, badge text

- [x] **T025** [P] Integration test: Real-time connection with exponential backoff ✓ **(2025-12-16)**
  - File: `admin/tests/stores/realtime.test.ts`
  - Tests: 28 passing - backoff calculation, sequence, connection status, heartbeat
  - Covers: 2s/4s/8s/16s intervals, max 10 attempts, token management, event types

---

## Phase 3.3: Backend Implementation

**PREREQUISITE**: All Phase 3.2 tests MUST be failing before starting this phase.

### Database Schemas & Migrations (Parallel - Different Files)

- [x] **T026** [P] Create widget_configurations schema
  - File: `api/src/database/schemas/widget-configurations.ts`
  - Schema: id, user_id, layout_type, widgets (JSONB), timestamps
  - Constraint: `CHECK (jsonb_array_length(widgets) <= 20)`
  - Export: Drizzle schema with inferred types

- [x] **T027** Create order_locks schema ✓
  - File: `api/src/database/schemas/order-locks.ts`
  - Schema: id, order_id, locked_by_user_id, session_id, locked_at, expires_at, last_activity_at
  - Constraint: `UNIQUE(order_id)`, expires_at default 5 minutes
  - Export: Drizzle schema with inferred types

- [x] **T028** Create inventory_consumption_tracking schema ✓
  - File: `api/src/database/schemas/inventory-consumption.ts`
  - Schema: id, inventory_item_id, avg_daily_consumption, calculation_period_days, last_calculated_at, custom_reorder_threshold, sample_size
  - Constraint: `UNIQUE(inventory_item_id)`
  - Export: Drizzle schema with inferred types

- [x] **T029** Generate Drizzle migration for new schemas
  - Command: `cd api && npm run db:generate`
  - Verify: Migration file created in `api/src/database/migrations/`
  - Review: Check migration SQL for correctness

- [x] **T030** Apply migration to database
  - Command: `cd api && npm run db:migrate`
  - Verify: Tables exist via `npm run db:studio`
  - Test: Insert/query sample data

### Widgets Module (Sequential within module)

- [x] **T031** [P] Create WidgetConfiguration DTOs
  - File: `api/src/widgets/dto/create-widget-config.dto.ts`
  - DTOs: `CreateWidgetConfigDto`, `UpdateWidgetConfigDto`, `WidgetDto`
  - Validation: Zod schemas with max 20 widgets, valid position values

- [x] **T032** Create WidgetsService with CRUD logic
  - File: `api/src/widgets/widgets.service.ts`
  - Methods: `getConfig(userId)`, `updateConfig(userId, dto)`, `createDefault(userId)`
  - Logic: Drizzle queries, enforce 20 widget limit
  - Dependency: T026, T031

- [x] **T033** Create WidgetsController with endpoints
  - File: `api/src/widgets/widgets.controller.ts`
  - Endpoints: GET /widgets/config, PUT /widgets/config
  - Guards: JWT auth guard
  - Decorators: @ApiTags, @ApiResponse per OpenAPI spec
  - Dependency: T032

- [x] **T034** Create WidgetsModule and wire dependencies
  - File: `api/src/widgets/widgets.module.ts`
  - Imports: DatabaseModule
  - Providers: WidgetsService
  - Controllers: WidgetsController
  - Export: WidgetsService for testing

- [x] **T035** Unit tests for WidgetsService
  - File: `api/test/widgets/widgets.service.e2e-spec.ts`
  - Tests: Max 20 widgets validation, JSONB storage, user isolation
  - Mocks: Drizzle DB
  - ✅ Unit tests created and comprehensive

### Order Locks Module (Sequential within module)

- [x] **T036** Create OrderLock DTOs ✓
  - File: `api/src/order-locks/dto/acquire-lock.dto.ts`
  - DTOs: `AcquireLockDto`, `OrderLockResponseDto`
  - Validation: order_id (UUID), session_id (string)

- [x] **T037** Create OrderLocksService with Redis logic ✓
  - File: `api/src/order-locks/order-locks.service.ts`
  - Methods: `acquireLock(orderId, userId, sessionId)`, `releaseLock(orderId, userId)`, `renewLock(orderId, userId)`, `getLockStatus(orderId)`, `cleanupExpired()`
  - Logic: Redis atomic operations (SET NX EX), PostgreSQL backup
  - TTL: 5 minutes, renewable

- [x] **T038** Create OrderLocksController with REST endpoints ✓
  - File: `api/src/order-locks/order-locks.controller.ts`
  - Endpoints: POST /acquire, DELETE /release/:orderId, POST /renew/:orderId, GET /status/:orderId
  - Guards: JWT auth guard
  - Error handling: 409 Conflict for locked orders

- [x] **T039** Create OrderLocksGateway for WebSocket notifications ✓
  - File: Integrated into OrderLocksService with RealtimeService
  - Events: Emit `order:locked`, `order:unlocked` to all clients
  - Integration: Called by OrderLocksService on lock state changes
  - Dependency: T037, T042

- [x] **T040** Create OrderLocksModule and wire dependencies ✓
  - File: `api/src/order-locks/order-locks.module.ts`
  - Imports: DatabaseModule
  - Providers: OrderLocksService, OrderLocksController
  - Wired into AppModule

- [x] **T041** Unit tests for OrderLocksService
  - File: `api/test/order-locks/order-locks.service.e2e-spec.ts`
  - Tests: Lock acquisition, conflict detection, TTL expiration, renewal
  - Mocks: Redis, Drizzle DB
  - ✅ Unit tests created and comprehensive

### Realtime Module (Sequential within module)

- [x] **T042** Create RealtimeGateway with Socket.IO ✓
  - File: `api/src/realtime/realtime.gateway.ts`
  - Setup: WebSocket server with JWT auth middleware
  - Events: `connection`, `dashboard:join`, `heartbeat`
  - Emit: `metrics:update`, `connection:status`, `error`
  - Rooms: `dashboard:{userId}` per user

- [x] **T043** Create RealtimeService for metric broadcasting ✓
  - File: `api/src/realtime/realtime.service.ts`
  - Methods: `broadcastMetrics(userId, deltaMetrics)`, `broadcastToAll(event, data)`
  - Throttling: Max 1 emit per second per metric type
  - Dependency: T042

- [x] **T044** Create RealtimeModule and wire dependencies ✓
  - File: `api/src/realtime/realtime.module.ts`
  - Imports: None (standalone gateway)
  - Providers: RealtimeGateway, RealtimeService
  - Exports: RealtimeService (for other modules to broadcast)

- [x] **T045** Integrate RealtimeService with OrdersModule ✓ **(ALREADY IMPLEMENTED)**
  - File: `api/src/orders/orders.service.ts`
  - RealtimeService injected with forwardRef
  - Broadcasts: `customer-order:created`, `customer-order:updated`, `customer-order:status-changed`, `customer-order:deleted`
  - OrdersModule imports RealtimeModule with forwardRef

### Inventory Consumption Extensions (Sequential within module)

- [x] **T046** Create InventoryConsumption DTOs ✓
  - File: `api/src/inventory/dto/consumption-tracking.dto.ts`
  - DTOs: `ConsumptionTrackingDto`, `SetCustomThresholdDto`, `InventoryItemWithTrackingDto`
  - Validation: Non-negative thresholds, positive lead times

- [x] **T047** Create InventoryService with predictive calculations ✓
  - File: `api/src/inventory/inventory.service.ts`
  - Methods: `getInventory()`, `getConsumptionTracking()`, `setCustomThreshold()`, `deleteCustomThreshold()`, `recalculate()`
  - Logic: 7-day rolling average from orders, predictive low_stock calculation
  - InventoryModule created and wired into AppModule

- [x] **T048** Create InventoryController with endpoints ✓
  - File: `api/src/inventory/inventory.controller.ts`
  - Endpoints: GET /inventory, GET /:itemId/consumption, PUT/DELETE /:itemId/consumption/threshold, POST /:itemId/consumption/recalculate
  - Response: Includes `low_stock` boolean in InventoryItem

- [x] **T049** Create background job for daily consumption calculation ✓ **(2025-12-15)**
  - File: `api/src/inventory/inventory-scheduler.service.ts`
  - Schedule: Daily at 2 AM (cron) + Weekly cleanup Sundays 3 AM
  - Logic: Recalculate all items with order history, cleanup orphaned records
  - Library: @nestjs/schedule
  - Dependency: T047

- [x] **T050** Unit tests for predictive calculation logic ✓ **(2025-12-15)**
  - File: `api/src/inventory/inventory.service.spec.ts`
  - Tests: 37 tests covering CRUD, consumption tracking, thresholds, predictive calculations
  - Coverage: getInventory, getConsumptionTracking, setCustomThreshold, deleteCustomThreshold, recalculate, createInventoryItem, updateInventoryItem, deleteInventoryItem
  - Dependency: T047

---

## Phase 3.4: Frontend Implementation

**PREREQUISITE**: Backend implementation (Phase 3.3) should be complete so frontend can integrate.

### API Client Services (Parallel - Different Files)

- [x] **T051** [P] Create base HTTP client with auth
  - File: `admin/src/api/client.ts`
  - Setup: Axios/fetch wrapper with JWT interceptor
  - Logic: Auto-attach access_token from localStorage, refresh on 401
  - Base URL: `http://localhost:5000/api/v1`

- [x] **T052** [P] Create Widgets API client
  - File: `admin/src/api/client.ts` (added widgetsApi)
  - Methods: `getConfig()`, `updateConfig(dto)`
  - Types: Widget, WidgetConfiguration, UpdateWidgetConfigDto interfaces
  - Dependency: T051

- [x] **T053** Create OrderLocks API client ✓
  - File: `admin/src/api/order-locks.ts`
  - Methods: `acquireLock()`, `releaseLock()`, `renewLock()`, `getLockStatus()`
  - Types: OrderLock, UnlockedStatus, AcquireLockRequest, LockConflictError

- [x] **T054** Create Inventory API client ✓
  - File: `admin/src/api/inventory.ts`
  - Methods: `getInventory()`, `getConsumption()`, `setCustomThreshold()`, `deleteCustomThreshold()`, `recalculate()`
  - Types: InventoryItemWithTracking, ConsumptionTracking, SetThresholdRequest

- [x] **T055** [P] Create Realtime WebSocket client ✓
  - File: `admin/src/api/realtime.ts`
  - Setup: socket.io-client with JWT auth, exponential backoff (2s, 4s, 8s, 16s)
  - Events: Listen for `metrics:update`, `order:locked`, `order:unlocked`, `connection:status`
  - Emit: `dashboard:join`, `heartbeat` (every 30s)
  - Reconnection: Automatic with backoff per clarification
  - Dependency: T051

### Stores (State Management) - Parallel - Different Files

- [x] **T056** WidgetsStore with layout state ✓
  - File: `admin/src/stores/widgets.ts`
  - State: `config: WidgetConfiguration | null`, `loading: boolean`, `error: string | null`
  - Actions: `fetchConfig()`, `updateConfig(dto)`, `addWidget(widget)`, `removeWidget(id)`, `reorderWidgets(newOrder)`, `setLayoutType()`
  - Validation: Enforce max 20 widgets client-side ✓
  - Persistence: API + localStorage cache ✓
  - Dependency: T052

- [x] **T057** Create ThemeStore with light/dark toggle ✓
  - File: `admin/src/stores/theme.ts`
  - State: `theme: 'light' | 'dark'`
  - Actions: `toggleTheme()`, `setTheme(theme)`, `subscribe()`
  - Persistence: localStorage + system preference detection
  - Effect: Applies dark class to document.documentElement

- [x] **T058** [P] Create RealtimeStore with connection state ✓
  - File: `admin/src/stores/realtime.ts`
  - State: `status: 'connected' | 'reconnecting' | 'disconnected'`, `metrics: DashboardMetrics`, `retryCount: number`
  - Actions: `connect()`, `disconnect()`, `onMetricsUpdate(delta)`, `onConnectionStatus(status)`
  - Integration: Wraps realtime.ts client, exposes reactive signals
  - Dependency: T055

- [x] **T059** Create OrderLocksStore with lock state ✓
  - File: `admin/src/stores/order-locks.ts`
  - State: `locks: Map`, `myLocks: Set`, auto-renewal timers
  - Actions: `acquireLock()`, `releaseLock()`, `renewLock()`, `isLocked()`, `isLockedByMe()`, `checkLockStatus()`
  - Heartbeat: Auto-renew every 30 seconds, cleanup on unmount
  - Session ID generation included

### Layout Components (Parallel - Different Files)

- [x] **T060** Create Sidebar component ✓
  - File: `admin/src/components/layout/Sidebar.tsx`
  - Features: Collapsible sidebar, 10 nav items with icons, active state highlighting
  - State: Persist collapse state in localStorage
  - Styling: Tailwind with dark mode support
  - Responsive: Hidden on mobile, visible on desktop

- [x] **T061** Create TopBar component ✓
  - File: `admin/src/components/layout/TopBar.tsx`
  - Features: User dropdown menu, theme toggle, connection status indicator, logout
  - Props: user, connectionStatus
  - Integration: Uses themeStore for theme toggle

- [x] **T062** [P] Create MobileMenu component ✓
  - File: `admin/src/components/layout/MobileMenu.tsx`
  - Features: Hamburger icon, slide-in overlay, auto-close on navigation
  - Responsive: <768px only
  - Dependency: T060

### Widget Components (Parallel - Different Files)

- [x] **T063** [P] Create WidgetGrid component ✓
  - File: `admin/src/components/widgets/WidgetGrid.tsx`
  - Features: Drag & drop reordering, layout switcher (grid/list/masonry)
  - Library: Native Solid.js drag API
  - Max widgets: 20 (show message when limit reached)
  - Dependency: T056

- [x] **T064** [P] Create MetricsWidget component ✓
  - File: `admin/src/components/widgets/MetricsWidget.tsx`
  - Features: Display dashboard metrics (orders, revenue, low stock), real-time updates
  - Props: metrics from RealtimeStore
  - Styling: Card with icon, value, change indicator
  - Dependency: T058

- [x] **T065** [P] Create ChartWidget component ✓
  - File: `admin/src/components/widgets/ChartWidget.tsx`
  - Features: Line/bar/pie charts for analytics
  - Library: Lightweight SVG-based charts (placeholder for Chart.js)
  - Props: chartType, data, config

### Order Components (Parallel - Different Files)

- [x] **T066** [P] Create OrderCard component ✓
  - File: `admin/src/components/orders/OrderCard.tsx`
  - Features: Display order summary, status badge, lock indicator
  - Props: order, isLocked, lockedBy
  - Styling: Color-coded status badges per FR-020
  - Dependency: T059

- [x] **T067** [P] Create OrderModal component ✓
  - File: `admin/src/components/orders/OrderModal.tsx`
  - Features: Full order details, status update workflow, lock/unlock on open/close
  - Lock logic: Acquire on mount, renew every 30s, release on unmount
  - Validation: Disable edit if locked by another user
  - Dependency: T059

- [x] **T068** [P] Create OrderLockIndicator component ✓
  - File: `admin/src/components/orders/OrderLockIndicator.tsx`
  - Features: Badge showing "Locked by [User Name]"
  - Props: lock (OrderLock | null)
  - Styling: Red badge when locked, hidden when unlocked
  - Real-time: Updates via WebSocket order:locked/unlocked events
  - Dependency: T058, T059

### Dashboard Pages (Parallel - Different Files)

- [x] **T069** Overview page with customizable widgets ✓
  - File: `admin/src/pages/Overview.tsx`
  - Features: Widget list, layout switcher, add/remove widgets, error handling, loading states
  - Data: Fetch config via widgetsStore
  - Route: `/dashboard/overview` (default route)
  - Dependency: T056

- [x] **T070** Create Orders page with lock integration ✓
  - File: `admin/src/pages/Orders.tsx`
  - Features: Order list, search, status filter, lock indicators, order modal with auto-lock
  - Components: OrderCard.tsx created
  - Lock integration: Acquires lock on modal open, auto-renews, releases on close

- [x] **T071** Create Inventory page with low-stock alerts ✓
  - File: `admin/src/pages/Inventory.tsx`
  - Features: Inventory table, low-stock badges, filters (low stock, category), custom threshold modal
  - API Integration: Uses inventoryApi for all operations
  - Actions: Set/remove custom threshold, recalculate consumption

- [x] **T072** Create Recipes page ✓
  - File: `admin/src/pages/Recipes.tsx`
  - Placeholder page with structure ready for implementation

- [x] **T073** Create Products page ✓
  - File: `admin/src/pages/Products.tsx`
  - Placeholder page with structure ready for implementation

- [x] **T074** Create Production page ✓ **(FULLY IMPLEMENTED 2025-12-15)**
  - File: `admin/src/pages/production/ProductionPage.tsx`
  - **Full implementation** with schedule management, status workflow, quality checks
  - Backend: `api/src/production/` - Service, Controller, DTOs, 13 unit tests
  - API Client: `admin/src/api/production.ts`

- [x] **T075** Create Customers page ✓
  - File: `admin/src/pages/Customers.tsx`
  - Placeholder page with structure ready for implementation

- [x] **T076** Create Analytics page ✓
  - File: `admin/src/pages/Analytics.tsx`
  - Placeholder page with structure ready for implementation

- [x] **T077** Create Profile page ✓
  - File: `admin/src/pages/Profile.tsx`
  - Placeholder page with structure ready for implementation

- [x] **T078** Create Settings page ✓
  - File: `admin/src/pages/Settings.tsx`
  - Placeholder page with structure ready for implementation

### Router Integration (Sequential - Single File)

- [x] **T079** Update App.tsx with dashboard routes ✓
  - File: `admin/src/App.tsx` (EXTEND EXISTING)
  - Add routes: All dashboard pages (T069-T078)
  - Guards: Protect all dashboard routes with auth check (redirect to login if not authenticated)
  - Default: Redirect `/dashboard` → `/dashboard/overview`
  - Integration: Extract JWT from URL params on login redirect, save to localStorage, clean URL
  - Dependency: T069-T078

- [x] **T080** Create ProtectedRoute wrapper component ✓
  - File: `admin/src/ProtectedRoute.tsx` (ALREADY EXISTS)
  - Logic: Check auth token in localStorage, redirect to website login if missing
  - Refresh: Auto-refresh token if expired but refresh token valid
  - Dependency: T051

---

## Phase 3.5: Integration & Wiring

- [x] **T081** Wire all backend modules into AppModule ✓
  - File: `api/src/app.module.ts` (EXTEND EXISTING)
  - Imports: WidgetsModule, OrderLocksModule, RealtimeModule
  - Config: WebSocket CORS, Redis connection

- [x] **T082** Create seed data for widget configurations and consumption tracking ✓ **(2025-12-15)**
  - File: `api/src/database/seeds/inventory.seed.ts`
  - Data: 47 inventory items (31 ingredients, 8 packaging, 8 supplies), 12 consumption tracking records
  - Command: `npm run db:seed`

- [x] **T083** Configure WebSocket CORS for frontend origin ✓
  - File: `api/src/realtime/realtime.gateway.ts` (UPDATED)
  - CORS: Allow multiple origins (admin, customer app, dev server)
  - Production: Use environment variable for origin

- [x] **T084** Set up background job scheduler for consumption calculations ✓ **(2025-12-15)**
  - File: `api/src/inventory/inventory.module.ts` (includes InventorySchedulerService)
  - Import: @nestjs/schedule, ScheduleModule registered in AppModule
  - Jobs: Daily consumption recalculation (2 AM) + Weekly cleanup (Sundays 3 AM)

- [x] **T085** Create health check endpoint for WebSocket status ✓
  - File: `api/src/health/health.controller.ts` (EXTENDED)
  - Add: GET /health/websocket
  - Check: Verify Socket.IO server running, connected clients count

---

## Phase 3.6: E2E Tests (Playwright)

**PREREQUISITE**: Full stack running (backend + frontend). These tests validate complete user flows from quickstart.md.

- [x] **T086** [P] E2E: Authentication & dashboard access ✓ **(2025-12-16)**
  - File: `admin/tests/e2e/auth-flow.spec.ts`
  - Tests: 5 scenarios - login redirect, form validation, successful login, error handling

- [x] **T087** [P] E2E: Dashboard navigation ✓ **(2025-12-16)**
  - File: `admin/tests/e2e/navigation.spec.ts`
  - Tests: 5 scenarios - main pages, sidebar toggle, persistence, active state

- [x] **T088** [P] E2E: Customizable dashboard widgets ✓ **(2025-12-16)**
  - File: `admin/tests/e2e/widgets.spec.ts`
  - Tests: 5 scenarios - default widgets, add modal, add/remove widgets, reset layout

- [x] **T089** [P] E2E: Real-time dashboard metrics ✓ **(2025-12-16)**
  - File: `admin/tests/e2e/realtime.spec.ts`
  - Tests: 5 scenarios - WebSocket connection, metrics display, updates

- [x] **T090** [P] E2E: Order search & filter ✓ **(2025-12-16)**
  - File: `admin/tests/e2e/orders-filter.spec.ts`
  - Tests: 5 scenarios - orders list, search, status filter, stats, internal orders

- [x] **T091** [P] E2E: Order locking ✓ **(2025-12-16)**
  - File: `admin/tests/e2e/order-locks.spec.ts`
  - Tests: 4 scenarios - lock indicator, lock conflict (two browser contexts)

- [x] **T092** [P] E2E: Predictive inventory alerts ✓ **(2025-12-16)**
  - File: `admin/tests/e2e/inventory-alerts.spec.ts`
  - Tests: 6 scenarios - inventory list, low stock filter, category filter, details

- [x] **T093** [P] E2E: Theme toggle ✓ **(2025-12-16)**
  - File: `admin/tests/e2e/theme-toggle.spec.ts`
  - Tests: 5 scenarios - toggle button, theme change, persistence across nav/reload

- [x] **T094** [P] E2E: Mobile responsive navigation ✓ **(2025-12-16)**
  - File: `admin/tests/e2e/mobile-responsive.spec.ts`
  - Tests: 9 scenarios - hamburger menu, sidebar mobile state, close on nav, tablet viewport

---

## Phase 3.7: Polish & Validation

- [ ] **T095** Run all tests and verify 100% pass rate
  - Backend: `cd api && npm run test && npm run test:e2e`
  - Frontend: `cd admin && npm test && npm run test:e2e`
  - Fix: Any failing tests before proceeding

- [ ] **T096** Performance benchmarks
  - API latency: All endpoints <200ms p95 (run load tests)
  - UI response: Widget interactions <100ms
  - Initial load: Dashboard <2s on 3G network
  - Tool: Use Apache Bench or k6 for API, Lighthouse for frontend

- [ ] **T097** Manual validation via quickstart.md
  - Execute: All 9 scenarios from `quickstart.md`
  - Document: Any deviations or bugs found
  - Fix: Critical issues before completion

- [ ] **T098** Code review & refactoring
  - Review: Check for duplicated code, unused imports, any 'any' types
  - Refactor: Extract common logic, improve naming
  - Constitution: Verify all principles followed

- [ ] **T099** Update documentation
  - README: Add dashboard features section
  - API docs: Generate OpenAPI spec via NestJS decorators
  - Architecture: Update diagrams with new modules

---

## Dependencies Graph

### Critical Path (Must Complete in Order):
```
Setup (T001-T005)
  ↓
Contract Tests (T006-T025) ← MUST FAIL
  ↓
Backend Schemas (T026-T030)
  ↓
Backend Modules (T031-T050)
  ↓
Frontend API Clients (T051-T055)
  ↓
Frontend Stores (T056-T059)
  ↓
Frontend Components (T060-T068)
  ↓
Frontend Pages (T069-T078)
  ↓
Router Integration (T079-T080)
  ↓
System Integration (T081-T085)
  ↓
E2E Tests (T086-T094)
  ↓
Polish (T095-T099)
```

### Parallel Execution Opportunities:

**After Setup, run all contract tests in parallel:**
```bash
# Backend contract tests (T006-T021)
# Frontend component tests (T022-T025)
# All can run simultaneously - different test files
```

**After schemas created, run all DTO tasks in parallel:**
```bash
# T031 (Widgets DTOs)
# T036 (OrderLocks DTOs)
# T046 (Inventory DTOs)
# Different files, no dependencies
```

**Frontend components - full parallelization:**
```bash
# T060-T078 (All layout, widget, order components, and pages)
# Each is a separate file, can be built simultaneously by multiple agents/developers
```

**E2E tests - full parallelization:**
```bash
# T086-T094 (All 9 E2E test files)
# Independent scenarios, different test files
```

---

## Validation Checklist

**GATE: Must verify before marking feature complete**

- [x] All contracts (T006-T021) have corresponding tests
- [x] All entities (widget_configurations, order_locks, inventory_consumption_tracking) have schema tasks (T026-T028)
- [x] All tests (T006-T025) come before implementation (T026+)
- [x] Parallel tasks ([P]) are truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD principle enforced: Contract tests → Schemas → Implementation
- [x] All quickstart.md scenarios have E2E tests (T086-T094)

---

## Execution Guidance

### For Single Developer:
1. Complete phases sequentially (3.1 → 3.2 → 3.3 → ...)
2. Within each phase, work through tasks in order (T001 → T002 → ...)
3. Mark [P] tasks can be done in any order within their phase

### For Team / AI Agents:
1. **Phase 3.1**: Assign to 1 agent (setup is sequential)
2. **Phase 3.2**: Distribute all [P] tasks across agents (max parallelization)
3. **Phase 3.3**:
   - Schemas (T026-T030) to 1 agent
   - Widgets module (T031-T035) to Agent A
   - OrderLocks module (T036-T041) to Agent B
   - Realtime module (T042-T044) to Agent C
   - Inventory extensions (T046-T050) to Agent D
4. **Phase 3.4**: Distribute all [P] tasks (max parallelization - 30 tasks!)
5. **Phase 3.5**: Sequential by 1 agent (integration)
6. **Phase 3.6**: Distribute all [P] E2E tests across agents
7. **Phase 3.7**: Collaborative review

### Time Estimates (Single Developer):
- **Phase 3.1**: 1 hour
- **Phase 3.2**: 8 hours (20 tests)
- **Phase 3.3**: 16 hours (25 backend tasks)
- **Phase 3.4**: 20 hours (30 frontend tasks)
- **Phase 3.5**: 2 hours (integration)
- **Phase 3.6**: 6 hours (9 E2E tests)
- **Phase 3.7**: 3 hours (polish)
- **Total**: ~56 hours (~7 working days)

### Time Estimates (Team of 5):
- With parallelization: ~12-15 hours (~2 days)

---

## Notes

- **TDD Enforcement**: Phase 3.2 tests MUST FAIL before Phase 3.3 implementation begins. This is non-negotiable per constitution.
- **Real-time Testing**: WebSocket tests (T017-T021) require Socket.IO test client setup.
- **Order Locking**: E2E test T091 requires orchestrating two browser contexts simultaneously (Playwright supports this).
- **Performance**: Validate benchmarks (T096) meet constitutional requirements: API <200ms p95, UI <100ms.
- **Max Widgets**: Enforce 20 widget limit client-side (T056, T063) AND server-side (T032, T007).
- **Exponential Backoff**: Ensure reconnection intervals (2s, 4s, 8s, 16s) are exact per clarification.

---

*Tasks generated: 2025-09-30*
*Ready for Phase 3 execution via `/implement` or manual development*
*Next: Run T001 to begin implementation*