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

- [ ] **T008** [P] Contract test: POST /api/v1/order-locks/acquire
  - File: `api/test/order-locks/order-locks-acquire.e2e-spec.ts`
  - Test: Acquire lock on order, fail if already locked
  - Assert: 200 with OrderLock, 409 if conflict
  - **MUST FAIL**: Endpoint not implemented yet

- [ ] **T009** [P] Contract test: DELETE /api/v1/order-locks/release/:orderId
  - File: `api/test/order-locks/order-locks-release.e2e-spec.ts`
  - Test: Release lock, 404 if not owner
  - Assert: 204 on success
  - **MUST FAIL**: Endpoint not implemented yet

- [ ] **T010** [P] Contract test: POST /api/v1/order-locks/renew/:orderId
  - File: `api/test/order-locks/order-locks-renew.e2e-spec.ts`
  - Test: Extend lock TTL, 404 if expired
  - Assert: 200 with updated expires_at
  - **MUST FAIL**: Endpoint not implemented yet

- [ ] **T011** [P] Contract test: GET /api/v1/order-locks/status/:orderId
  - File: `api/test/order-locks/order-locks-status.e2e-spec.ts`
  - Test: Check lock status (locked or unlocked)
  - Assert: 200 with OrderLock or UnlockedStatus
  - **MUST FAIL**: Endpoint not implemented yet

- [ ] **T012** [P] Contract test: GET /api/v1/inventory (with low_stock flag)
  - File: `api/test/inventory/inventory-list-lowstock.e2e-spec.ts`
  - Test: List inventory with low_stock boolean
  - Assert: 200 with InventoryItemWithTracking[] schema
  - **MUST FAIL**: Extension not implemented yet

- [ ] **T013** [P] Contract test: GET /api/v1/inventory/:itemId/consumption
  - File: `api/test/inventory/inventory-consumption-get.e2e-spec.ts`
  - Test: Get consumption tracking data
  - Assert: 200 with ConsumptionTracking schema
  - **MUST FAIL**: Endpoint not implemented yet

- [ ] **T014** [P] Contract test: PUT /api/v1/inventory/:itemId/consumption/threshold
  - File: `api/test/inventory/inventory-consumption-set-threshold.e2e-spec.ts`
  - Test: Set custom reorder threshold
  - Assert: 200 with updated ConsumptionTracking
  - **MUST FAIL**: Endpoint not implemented yet

- [ ] **T015** [P] Contract test: DELETE /api/v1/inventory/:itemId/consumption/threshold
  - File: `api/test/inventory/inventory-consumption-delete-threshold.e2e-spec.ts`
  - Test: Remove custom threshold, revert to predictive
  - Assert: 204 on success
  - **MUST FAIL**: Endpoint not implemented yet

- [ ] **T016** [P] Contract test: POST /api/v1/inventory/:itemId/consumption/recalculate
  - File: `api/test/inventory/inventory-consumption-recalculate.e2e-spec.ts`
  - Test: Trigger on-demand recalculation
  - Assert: 200 with updated avg_daily_consumption
  - **MUST FAIL**: Endpoint not implemented yet

### WebSocket Event Tests (Parallel - Different Files)

- [ ] **T017** [P] WebSocket test: connection with JWT auth
  - File: `api/test/realtime/realtime-connection.e2e-spec.ts`
  - Test: Client connects with valid JWT token
  - Assert: Connection accepted, invalid token rejected
  - **MUST FAIL**: Gateway not implemented yet

- [ ] **T018** [P] WebSocket test: dashboard:join event
  - File: `api/test/realtime/realtime-dashboard-join.e2e-spec.ts`
  - Test: Client joins user-specific dashboard room
  - Assert: Joined room `dashboard:{userId}`
  - **MUST FAIL**: Event handler not implemented yet

- [ ] **T019** [P] WebSocket test: metrics:update emission
  - File: `api/test/realtime/realtime-metrics-update.e2e-spec.ts`
  - Test: Server pushes metric updates to room
  - Assert: Client receives delta updates
  - **MUST FAIL**: Event emission not implemented yet

- [ ] **T020** [P] WebSocket test: order:locked notification
  - File: `api/test/realtime/realtime-order-locked.e2e-spec.ts`
  - Test: All clients notified when order locked
  - Assert: order:locked event with OrderLock payload
  - **MUST FAIL**: Integration not implemented yet

- [ ] **T021** [P] WebSocket test: order:unlocked notification
  - File: `api/test/realtime/realtime-order-unlocked.e2e-spec.ts`
  - Test: All clients notified when order unlocked
  - Assert: order:unlocked event with order_id
  - **MUST FAIL**: Integration not implemented yet

### Frontend Component Tests (Parallel - Different Files)

- [ ] **T022** [P] Component test: Sidebar navigation
  - File: `admin/tests/components/layout/Sidebar.test.tsx`
  - Test: Renders all nav items, collapse/expand state
  - Assert: 10 nav items, localStorage persistence
  - **MUST FAIL**: Component not implemented yet

- [ ] **T023** [P] Component test: WidgetGrid drag & drop
  - File: `admin/tests/components/widgets/WidgetGrid.test.tsx`
  - Test: Drag widget to new position, save layout
  - Assert: Position updated, API called
  - **MUST FAIL**: Component not implemented yet

- [ ] **T024** [P] Component test: OrderLockIndicator
  - File: `admin/tests/components/orders/OrderLockIndicator.test.tsx`
  - Test: Shows "Locked by [User]" badge
  - Assert: Badge visible when locked, hidden when unlocked
  - **MUST FAIL**: Component not implemented yet

- [ ] **T025** [P] Integration test: Real-time connection with exponential backoff
  - File: `admin/tests/stores/realtime.test.ts`
  - Test: Disconnect network, verify retry intervals (2s, 4s, 8s, 16s)
  - Assert: Reconnection attempts at correct intervals
  - **MUST FAIL**: Store not implemented yet

---

## Phase 3.3: Backend Implementation

**PREREQUISITE**: All Phase 3.2 tests MUST be failing before starting this phase.

### Database Schemas & Migrations (Parallel - Different Files)

- [x] **T026** [P] Create widget_configurations schema
  - File: `api/src/database/schemas/widget-configurations.ts`
  - Schema: id, user_id, layout_type, widgets (JSONB), timestamps
  - Constraint: `CHECK (jsonb_array_length(widgets) <= 20)`
  - Export: Drizzle schema with inferred types

- [ ] **T027** [P] Create order_locks schema
  - File: `api/src/database/schemas/order-locks.ts`
  - Schema: id, order_id, locked_by_user_id, session_id, locked_at, expires_at, last_activity_at
  - Constraint: `UNIQUE(order_id)`, expires_at default 5 minutes
  - Export: Drizzle schema with inferred types

- [ ] **T028** [P] Create inventory_consumption_tracking schema
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

- [ ] **T035** Unit tests for WidgetsService
  - File: `api/test/widgets/widgets.service.spec.ts`
  - Tests: Max 20 widgets validation, JSONB storage, user isolation
  - Mocks: Drizzle DB
  - Dependency: T032

### Order Locks Module (Sequential within module)

- [ ] **T036** [P] Create OrderLock DTOs
  - File: `api/src/order-locks/dto/acquire-lock.dto.ts`
  - DTOs: `AcquireLockDto`, `OrderLockResponseDto`
  - Validation: order_id (UUID), session_id (string)

- [ ] **T037** Create OrderLocksService with Redis logic
  - File: `api/src/order-locks/order-locks.service.ts`
  - Methods: `acquireLock(orderId, userId, sessionId)`, `releaseLock(orderId, userId)`, `renewLock(orderId, userId)`, `getLockStatus(orderId)`, `cleanupExpired()`
  - Logic: Redis atomic operations (SET NX EX), PostgreSQL backup
  - TTL: 5 minutes, renewable
  - Dependency: T004, T027, T036

- [ ] **T038** Create OrderLocksController with REST endpoints
  - File: `api/src/order-locks/order-locks.controller.ts`
  - Endpoints: POST /acquire, DELETE /release/:orderId, POST /renew/:orderId, GET /status/:orderId
  - Guards: JWT auth guard
  - Error handling: 409 Conflict for locked orders
  - Dependency: T037

- [ ] **T039** Create OrderLocksGateway for WebSocket notifications
  - File: `api/src/order-locks/order-locks.gateway.ts`
  - Events: Emit `order:locked`, `order:unlocked` to all clients
  - Integration: Called by OrderLocksService on lock state changes
  - Dependency: T037, T042

- [ ] **T040** Create OrderLocksModule and wire dependencies
  - File: `api/src/order-locks/order-locks.module.ts`
  - Imports: DatabaseModule, RealtimeModule (for gateway)
  - Providers: OrderLocksService, OrderLocksGateway
  - Controllers: OrderLocksController

- [ ] **T041** Unit tests for OrderLocksService
  - File: `api/test/order-locks/order-locks.service.spec.ts`
  - Tests: Lock acquisition, conflict detection, TTL expiration, renewal
  - Mocks: Redis, Drizzle DB
  - Dependency: T037

### Realtime Module (Sequential within module)

- [ ] **T042** Create RealtimeGateway with Socket.IO
  - File: `api/src/realtime/realtime.gateway.ts`
  - Setup: WebSocket server with JWT auth middleware
  - Events: `connection`, `dashboard:join`, `heartbeat`
  - Emit: `metrics:update`, `connection:status`, `error`
  - Rooms: `dashboard:{userId}` per user

- [ ] **T043** Create RealtimeService for metric broadcasting
  - File: `api/src/realtime/realtime.service.ts`
  - Methods: `broadcastMetrics(userId, deltaMetrics)`, `broadcastToAll(event, data)`
  - Throttling: Max 1 emit per second per metric type
  - Dependency: T042

- [ ] **T044** Create RealtimeModule and wire dependencies
  - File: `api/src/realtime/realtime.module.ts`
  - Imports: None (standalone gateway)
  - Providers: RealtimeGateway, RealtimeService
  - Exports: RealtimeService (for other modules to broadcast)

- [ ] **T045** Integrate RealtimeService with OrdersModule
  - File: `api/src/orders/orders.service.ts` (EXTEND EXISTING)
  - Change: Inject RealtimeService, emit `order:updated` on status change
  - Broadcast: To `dashboard:{userId}` when order changes
  - Dependency: T044

### Inventory Consumption Extensions (Sequential within module)

- [ ] **T046** [P] Create InventoryConsumption DTOs
  - File: `api/src/inventory/dto/consumption-tracking.dto.ts`
  - DTOs: `ConsumptionTrackingDto`, `SetCustomThresholdDto`
  - Validation: Non-negative thresholds, positive lead times

- [ ] **T047** Extend InventoryService with predictive calculations
  - File: `api/src/inventory/inventory.service.ts` (EXTEND EXISTING)
  - Add methods: `getConsumptionTracking(itemId)`, `calculatePredictive(itemId)`, `setCustomThreshold(itemId, threshold)`, `recalculate(itemId)`
  - Logic: 7-day rolling average from orders, (stock / avg_consumption) < (lead_time + 1)
  - Dependency: T028, T046

- [ ] **T048** Extend InventoryController with new endpoints
  - File: `api/src/inventory/inventory.controller.ts` (EXTEND EXISTING)
  - Add endpoints: GET /inventory (add low_stock flag), GET /:itemId/consumption, PUT /:itemId/consumption/threshold, DELETE /:itemId/consumption/threshold, POST /:itemId/consumption/recalculate
  - Response: Include `low_stock` boolean in InventoryItem
  - Dependency: T047

- [ ] **T049** Create background job for daily consumption calculation
  - File: `api/src/inventory/jobs/calculate-consumption.job.ts`
  - Schedule: Daily at 2 AM (cron)
  - Logic: Recalculate all items with order history
  - Library: @nestjs/schedule
  - Dependency: T047

- [ ] **T050** Unit tests for predictive calculation logic
  - File: `api/test/inventory/inventory-predictive.spec.ts`
  - Tests: 7-day average calculation, custom override, edge cases (no history)
  - Mocks: Order data, consumption tracking
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

- [ ] **T053** [P] Create OrderLocks API client
  - File: `admin/src/api/order-locks.ts`
  - Methods: `acquireLock(orderId)`, `releaseLock(orderId)`, `renewLock(orderId)`, `getLockStatus(orderId)`
  - Types: Import from contracts/order-locks-api.yaml
  - Dependency: T051

- [ ] **T054** [P] Create Inventory API client
  - File: `admin/src/api/inventory.ts`
  - Methods: `getInventory(lowStockOnly?)`, `getConsumption(itemId)`, `setCustomThreshold(itemId, threshold)`, `deleteCustomThreshold(itemId)`, `recalculate(itemId)`
  - Types: Import from contracts/inventory-api.yaml
  - Dependency: T051

- [ ] **T055** [P] Create Realtime WebSocket client
  - File: `admin/src/api/realtime.ts`
  - Setup: socket.io-client with JWT auth, exponential backoff (2s, 4s, 8s, 16s)
  - Events: Listen for `metrics:update`, `order:locked`, `order:unlocked`, `connection:status`
  - Emit: `dashboard:join`, `heartbeat` (every 30s)
  - Reconnection: Automatic with backoff per clarification
  - Dependency: T051

### Stores (State Management) - Parallel - Different Files

- [x] **T056** [P] Create WidgetsStore with layout state
  - File: `admin/src/stores/widgets.ts`
  - State: `config: WidgetConfiguration | null`, `loading: boolean`, `error: string | null`
  - Actions: `fetchConfig()`, `updateConfig(dto)`, `addWidget(widget)`, `removeWidget(id)`, `reorderWidgets(newOrder)`, `setLayoutType()`
  - Validation: Enforce max 20 widgets client-side ✓
  - Persistence: API + localStorage cache ✓
  - Dependency: T052

- [ ] **T057** [P] Create ThemeStore with light/dark toggle
  - File: `admin/src/stores/theme.ts`
  - State: `theme: 'light' | 'dark'`
  - Actions: `toggleTheme()`, `setTheme(theme)`
  - Persistence: Hybrid - localStorage (immediate) + API sync (async)
  - Effect: Apply theme class to document.documentElement

- [ ] **T058** [P] Create RealtimeStore with connection state
  - File: `admin/src/stores/realtime.ts`
  - State: `status: 'connected' | 'reconnecting' | 'disconnected'`, `metrics: DashboardMetrics`, `retryCount: number`
  - Actions: `connect()`, `disconnect()`, `onMetricsUpdate(delta)`, `onConnectionStatus(status)`
  - Integration: Wraps realtime.ts client, exposes reactive signals
  - Dependency: T055

- [ ] **T059** [P] Create OrderLocksStore with lock state
  - File: `admin/src/stores/order-locks.ts`
  - State: `locks: Map<orderId, OrderLock>`, `myLocks: Set<orderId>`
  - Actions: `acquireLock(orderId)`, `releaseLock(orderId)`, `renewLock(orderId)`, `isLocked(orderId)`, `isLockedByMe(orderId)`
  - Heartbeat: Auto-renew locks every 30 seconds
  - Dependency: T053, T058

### Layout Components (Parallel - Different Files)

- [ ] **T060** [P] Create Sidebar component
  - File: `admin/src/components/layout/Sidebar.tsx`
  - Features: Collapsible, 10 nav items (Overview, Orders, Inventory, Recipes, Products, Production, Customers, Analytics, Profile, Settings)
  - State: Persist collapse state in localStorage
  - Styling: Tailwind v4, component-scoped CSS
  - Responsive: Mobile overlay, desktop sidebar
  - Dependency: T057

- [ ] **T061** [P] Create TopBar component
  - File: `admin/src/components/layout/TopBar.tsx`
  - Features: User info dropdown, theme toggle, connection status indicator
  - Props: user, theme, connectionStatus
  - Dependency: T057, T058

- [ ] **T062** [P] Create MobileMenu component
  - File: `admin/src/components/layout/MobileMenu.tsx`
  - Features: Hamburger icon, slide-in overlay, auto-close on navigation
  - Responsive: <768px only
  - Dependency: T060

### Widget Components (Parallel - Different Files)

- [ ] **T063** [P] Create WidgetGrid component
  - File: `admin/src/components/widgets/WidgetGrid.tsx`
  - Features: Drag & drop reordering, layout switcher (grid/list/masonry)
  - Library: Use react-grid-layout or native Solid.js drag API
  - Max widgets: 20 (show message when limit reached)
  - Dependency: T056

- [ ] **T064** [P] Create MetricsWidget component
  - File: `admin/src/components/widgets/MetricsWidget.tsx`
  - Features: Display dashboard metrics (orders, revenue, low stock), real-time updates
  - Props: metrics from RealtimeStore
  - Styling: Card with icon, value, change indicator
  - Dependency: T058

- [ ] **T065** [P] Create ChartWidget component
  - File: `admin/src/components/widgets/ChartWidget.tsx`
  - Features: Line/bar/pie charts for analytics
  - Library: Chart.js or lightweight alternative
  - Props: chartType, data, config

### Order Components (Parallel - Different Files)

- [ ] **T066** [P] Create OrderCard component
  - File: `admin/src/components/orders/OrderCard.tsx`
  - Features: Display order summary, status badge, lock indicator
  - Props: order, isLocked, lockedBy
  - Styling: Color-coded status badges per FR-020
  - Dependency: T059

- [ ] **T067** [P] Create OrderModal component
  - File: `admin/src/components/orders/OrderModal.tsx`
  - Features: Full order details, status update workflow, lock/unlock on open/close
  - Lock logic: Acquire on mount, renew every 30s, release on unmount
  - Validation: Disable edit if locked by another user
  - Dependency: T059

- [ ] **T068** [P] Create OrderLockIndicator component
  - File: `admin/src/components/orders/OrderLockIndicator.tsx`
  - Features: Badge showing "Locked by [User Name]"
  - Props: lock (OrderLock | null)
  - Styling: Red badge when locked, hidden when unlocked
  - Real-time: Updates via WebSocket order:locked/unlocked events
  - Dependency: T058, T059

### Dashboard Pages (Parallel - Different Files)

- [ ] **T069** [P] Create Overview page with customizable widgets
  - File: `admin/src/pages/Overview.tsx`
  - Features: WidgetGrid, layout switcher, add/remove widgets
  - Data: Fetch metrics via RealtimeStore
  - Route: `/dashboard/overview` (default route)
  - Dependency: T056, T058, T063, T064

- [ ] **T070** [P] Create Orders page with search/filter
  - File: `admin/src/pages/Orders.tsx`
  - Features: Order list, search (name, phone, email), filter (status), order modal
  - Lock integration: Show lock indicators, acquire lock on modal open
  - Route: `/dashboard/orders`
  - Dependency: T059, T066, T067, T068

- [ ] **T071** [P] Create Inventory page with low-stock alerts
  - File: `admin/src/pages/Inventory.tsx`
  - Features: Inventory list, low-stock badges, filter (low stock only), custom threshold modal
  - Data: Fetch inventory with low_stock flags
  - Route: `/dashboard/inventory`
  - Dependency: T054

- [ ] **T072** [P] Create Recipes page
  - File: `admin/src/pages/Recipes.tsx`
  - Features: Recipe list, search, filter by category, view recipe details
  - Route: `/dashboard/recipes`

- [ ] **T073** [P] Create Products page
  - File: `admin/src/pages/Products.tsx`
  - Features: Product list, view product details, associated recipes
  - Route: `/dashboard/products`

- [ ] **T074** [P] Create Production page
  - File: `admin/src/pages/Production.tsx`
  - Features: Production schedules, batch planning, recipe priorities
  - Route: `/dashboard/production`

- [ ] **T075** [P] Create Customers page
  - File: `admin/src/pages/Customers.tsx`
  - Features: Customer list, search, order history, lifetime value
  - Route: `/dashboard/customers`

- [ ] **T076** [P] Create Analytics page
  - File: `admin/src/pages/Analytics.tsx`
  - Features: Sales trends, popular products, revenue charts, date filters
  - Route: `/dashboard/analytics`
  - Dependency: T065

- [ ] **T077** [P] Create Profile page
  - File: `admin/src/pages/Profile.tsx`
  - Features: Edit profile info, change password
  - Route: `/dashboard/profile`

- [ ] **T078** [P] Create Settings page
  - File: `admin/src/pages/Settings.tsx`
  - Features: Notification settings, location selection, preferences
  - Route: `/dashboard/settings`

### Router Integration (Sequential - Single File)

- [ ] **T079** Update App.tsx with dashboard routes
  - File: `admin/src/App.tsx` (EXTEND EXISTING)
  - Add routes: All dashboard pages (T069-T078)
  - Guards: Protect all dashboard routes with auth check (redirect to login if not authenticated)
  - Default: Redirect `/dashboard` → `/dashboard/overview`
  - Integration: Extract JWT from URL params on login redirect, save to localStorage, clean URL
  - Dependency: T069-T078

- [ ] **T080** Create ProtectedRoute wrapper component
  - File: `admin/src/components/ProtectedRoute.tsx`
  - Logic: Check auth token in localStorage, redirect to website login if missing
  - Refresh: Auto-refresh token if expired but refresh token valid
  - Dependency: T051

---

## Phase 3.5: Integration & Wiring

- [ ] **T081** Wire all backend modules into AppModule
  - File: `api/src/app.module.ts` (EXTEND EXISTING)
  - Imports: WidgetsModule, OrderLocksModule, RealtimeModule
  - Config: WebSocket CORS, Redis connection

- [ ] **T082** Create seed data for widget configurations and consumption tracking
  - File: `api/src/database/seeds/dashboard-seed.ts`
  - Data: Default widget layouts, sample consumption data
  - Command: `npm run db:seed`

- [ ] **T083** Configure WebSocket CORS for frontend origin
  - File: `api/src/realtime/realtime.gateway.ts` (UPDATE)
  - CORS: Allow `http://localhost:3001` (admin frontend)
  - Production: Use environment variable for origin

- [ ] **T084** Set up background job scheduler for consumption calculations
  - File: `api/src/app.module.ts` (EXTEND)
  - Import: @nestjs/schedule, register ScheduleModule
  - Job: Run T049 daily at 2 AM

- [ ] **T085** Create health check endpoint for WebSocket status
  - File: `api/src/health/health.controller.ts` (EXTEND EXISTING)
  - Add: GET /health/websocket
  - Check: Verify Socket.IO server running, Redis connection

---

## Phase 3.6: E2E Tests (Playwright)

**PREREQUISITE**: Full stack running (backend + frontend). These tests validate complete user flows from quickstart.md.

- [ ] **T086** [P] E2E: Authentication & dashboard access (Scenario 1)
  - File: `admin/tests/e2e/auth-flow.spec.ts`
  - Flow: Unauthenticated → redirect to login → login → redirect to dashboard with tokens → tokens extracted to localStorage
  - Assert: Dashboard loads, sidebar visible, URL cleaned
  - Maps to: quickstart.md Scenario 1

- [ ] **T087** [P] E2E: Dashboard navigation (Scenario 2)
  - File: `admin/tests/e2e/navigation.spec.ts`
  - Flow: Click nav items (Orders → Inventory → Analytics), collapse sidebar, reload page
  - Assert: Pages load without re-auth, sidebar state persisted
  - Maps to: quickstart.md Scenario 2

- [ ] **T088** [P] E2E: Customizable dashboard widgets (Scenario 3)
  - File: `admin/tests/e2e/widgets.spec.ts`
  - Flow: Add widget, drag to new position, change layout (grid → list), add 20 widgets (max), reload
  - Assert: Layout persists, 21st widget blocked
  - Maps to: quickstart.md Scenario 3

- [ ] **T089** [P] E2E: Real-time dashboard metrics (Scenario 4)
  - File: `admin/tests/e2e/realtime.spec.ts`
  - Flow: Open dashboard, create order via API, disconnect network, wait for backoff, reconnect
  - Assert: Metrics update without refresh, reconnection at 2s/4s/8s/16s intervals, status indicator accurate
  - Maps to: quickstart.md Scenario 4

- [ ] **T090** [P] E2E: Order search & filter (Scenario 5)
  - File: `admin/tests/e2e/orders-filter.spec.ts`
  - Flow: Search by name "John", filter by status "Pending", apply multiple filters, click order card
  - Assert: Results filter correctly, order modal opens
  - Maps to: quickstart.md Scenario 5

- [ ] **T091** [P] E2E: Order locking (Scenario 6)
  - File: `admin/tests/e2e/order-locks.spec.ts`
  - Flow: User A opens order → User B sees lock indicator → User B cannot edit → User A closes → User B can edit
  - Assert: Lock indicator shows correct user, lock released on close, heartbeat renews lock
  - Maps to: quickstart.md Scenario 6
  - Complexity: Requires two browser contexts

- [ ] **T092** [P] E2E: Predictive inventory alerts (Scenario 7)
  - File: `admin/tests/e2e/inventory-alerts.spec.ts`
  - Flow: View inventory, check low-stock badges, set custom threshold, verify item still flagged
  - Assert: Predictive calculation correct, custom override works
  - Maps to: quickstart.md Scenario 7

- [ ] **T093** [P] E2E: Theme toggle (Scenario 8)
  - File: `admin/tests/e2e/theme-toggle.spec.ts`
  - Flow: Toggle to dark theme, navigate pages, close browser, reopen, verify dark theme persists
  - Assert: Theme applies instantly, persists across sessions
  - Maps to: quickstart.md Scenario 8

- [ ] **T094** [P] E2E: Mobile responsive navigation (Scenario 9)
  - File: `admin/tests/e2e/mobile-responsive.spec.ts`
  - Flow: Open in mobile viewport (390x844), tap hamburger, tap Orders, verify sidebar closes
  - Assert: Sidebar hidden by default, overlay opens, auto-closes on navigation
  - Maps to: quickstart.md Scenario 9

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