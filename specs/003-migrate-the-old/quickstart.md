# Quickstart Validation Guide

**Feature**: Dashboard Routes Migration
**Purpose**: Validate acceptance criteria through executable test scenarios
**Date**: 2025-09-30

## Prerequisites

### Environment Setup
```bash
# Backend API (port 5000)
cd api
npm install
npm run db:migrate
npm run db:seed
npm run start:dev

# Frontend Admin SPA (port 3001)
cd admin
npm install
npm run dev

# Website Login (port 3000)
cd website
npm install
npm run dev
```

### Test Data
- **Test User**: test@bakery.com / password123
- **Test Orders**: 10 orders with various statuses
- **Test Inventory**: 20 items with consumption history
- **Test Products**: 15 bakery products

---

## Acceptance Scenario Validation

### Scenario 1: Authentication & Dashboard Access (FR-007, FR-008, FR-009)

**Given**: User is not authenticated
**When**: User accesses http://localhost:3001
**Then**: Redirected to http://localhost:3000/login

**Test Steps**:
```bash
# 1. Open browser in incognito mode
# 2. Navigate to http://localhost:3001
# 3. Verify redirect to login page
# 4. Enter credentials: test@bakery.com / password123
# 5. Verify redirect back to http://localhost:3001 with auth params
# 6. Verify dashboard loads with sidebar navigation
```

**Expected Result**:
- ✅ Unauthenticated users redirected to login
- ✅ After login, redirected to admin with tokens in URL params
- ✅ Tokens extracted to localStorage, URL cleaned
- ✅ Sidebar shows: Overview, Orders, Inventory, Recipes, Products, Production, Customers, Analytics, Profile, Settings
- ✅ Default route: /dashboard/overview

**Validation Query** (verify auth token stored):
```javascript
// Browser console
console.log(localStorage.getItem('access_token')); // Should exist
console.log(localStorage.getItem('refresh_token')); // Should exist
```

---

### Scenario 2: Dashboard Navigation (FR-001, FR-002)

**Given**: User is authenticated and on dashboard
**When**: User clicks navigation items
**Then**: Corresponding pages load without re-authentication

**Test Steps**:
```bash
# 1. From Overview page, click "Orders" in sidebar
# 2. Verify URL changes to /dashboard/orders
# 3. Verify page loads with order data
# 4. Click "Inventory" → verify /dashboard/inventory loads
# 5. Click "Analytics" → verify /dashboard/analytics loads
# 6. Click sidebar collapse button
# 7. Verify sidebar width reduces, content area expands
# 8. Reload page
# 9. Verify sidebar remains collapsed (persisted state)
```

**Expected Result**:
- ✅ All navigation items accessible
- ✅ Client-side routing (no full page reload)
- ✅ Auth token sent with every API request
- ✅ Sidebar collapse state persisted in localStorage
- ✅ Mobile: sidebar becomes overlay menu

**Validation Query** (check localStorage):
```javascript
console.log(localStorage.getItem('sidebar_collapsed')); // 'true' or 'false'
```

---

### Scenario 3: Customizable Dashboard Widgets (FR-012, FR-013, FR-014, FR-015)

**Given**: User is on Overview page
**When**: User customizes widget layout
**Then**: Layout persists across sessions

**Test Steps**:
```bash
# 1. Navigate to /dashboard/overview
# 2. Verify default widget layout loads (grid)
# 3. Click "Add Widget" button
# 4. Select "Recent Orders" widget
# 5. Drag widget to new position
# 6. Click layout toggle: Grid → List → Masonry
# 7. Verify layout changes immediately
# 8. Add widgets until reaching 20 (max limit per clarification)
# 9. Verify "Add Widget" button disabled at 20
# 10. Reload page
# 11. Verify layout persists
```

**Expected Result**:
- ✅ Widget grid responsive and draggable
- ✅ Layouts: grid (default), list, masonry
- ✅ Max 20 widgets enforced (FR-014 per clarification)
- ✅ Layout saved to backend via PUT /api/v1/widgets/config
- ✅ Retrieved on next login via GET /api/v1/widgets/config

**Validation API Call**:
```bash
# Verify widget config saved
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/v1/widgets/config
# Should return user's widget configuration with max 20 widgets
```

---

### Scenario 4: Real-Time Dashboard Metrics (FR-016a, FR-016b, FR-016c)

**Given**: User is viewing Overview with metrics widget
**When**: Backend data changes
**Then**: Metrics update automatically

**Test Steps**:
```bash
# 1. Open Overview page with Metrics widget
# 2. Note current "Total Orders" count
# 3. Open second browser window (different user or Postman)
# 4. Create new order via POST /api/v1/orders
# 5. Verify first window's "Total Orders" increments within 1 second
# 6. Check WebSocket connection status indicator (top right)
# 7. Open browser DevTools → Network → WS tab
# 8. Disconnect network (throttle to "Offline")
# 9. Verify status indicator shows "Reconnecting..." with retry countdown
# 10. Wait for exponential backoff attempts (2s, 4s, 8s, 16s)
# 11. Restore network
# 12. Verify status returns to "Connected" and metrics sync
```

**Expected Result**:
- ✅ Metrics update without manual refresh
- ✅ WebSocket connection established on page load
- ✅ Connection status visible (connected/reconnecting/disconnected)
- ✅ Auto-reconnect with exponential backoff (2s, 4s, 8s, 16s per clarification)
- ✅ Missed updates synced after reconnection

**Validation Event Logs** (browser console):
```javascript
// Socket.IO client logs
// [Socket] Connected
// [Socket] Joined room: dashboard:user-123
// [Socket] Received metrics:update
// [Socket] Connection lost - reconnecting in 2s
// [Socket] Reconnection attempt 2 in 4s
// [Socket] Reconnected - syncing data
```

---

### Scenario 5: Order Search & Filter (FR-017, FR-018, FR-019)

**Given**: User is on Orders page
**When**: User searches/filters orders
**Then**: Results display instantly

**Test Steps**:
```bash
# 1. Navigate to /dashboard/orders
# 2. Verify all orders display in grid/list
# 3. Use search bar: type "John"
# 4. Verify only orders with customer name "John" shown
# 5. Clear search, click filter "Status: Pending"
# 6. Verify only pending orders shown
# 7. Apply multiple filters: "Pending" + "Today"
# 8. Verify filtered results
# 9. Click on order card
# 10. Verify order modal opens with details
```

**Expected Result**:
- ✅ Search by: customer name, order number, phone, email (FR-019)
- ✅ Filter by status: pending, confirmed, in production, ready, delivered, cancelled (FR-018)
- ✅ Color-coded status badges (FR-020)
- ✅ Results update as user types (<100ms debounced)

---

### Scenario 6: Order Locking (FR-022a, FR-022b, FR-022c)

**Given**: Two users viewing same order
**When**: User A opens order for editing
**Then**: User B sees lock indicator

**Test Steps**:
```bash
# Setup: Open two browser windows (User A: Chrome, User B: Firefox)
# User A and User B both logged in to /dashboard/orders

# User A:
# 1. Click on Order #12345 card
# 2. Verify order modal opens
# 3. Verify "Edit" button enabled

# User B (simultaneously):
# 1. Navigate to same Orders page
# 2. Find Order #12345 card
# 3. Verify lock indicator badge shows "Locked by [User A Name]"
# 4. Click on Order #12345
# 5. Verify modal opens but "Edit" button disabled
# 6. Verify message: "Currently being edited by [User A Name]"

# User A:
# 7. Wait 30 seconds (no activity)
# 8. Verify lock automatically renewed (heartbeat)
# 9. Close order modal

# User B:
# 10. Verify lock indicator disappears within 1 second (WebSocket notification)
# 11. Click order card again
# 12. Verify "Edit" button now enabled (can acquire lock)
```

**Expected Result**:
- ✅ Only one user can edit order at a time (FR-022a)
- ✅ Lock indicator shows who is editing (FR-022b)
- ✅ Lock released on modal close or session end (FR-022c)
- ✅ Lock expires after 5 minutes of inactivity (TTL)
- ✅ Real-time lock notifications via WebSocket

**Validation API Calls**:
```bash
# Check lock status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/order-locks/status/{orderId}

# Verify lock released
# Response: { "order_id": "...", "locked": false }
```

---

### Scenario 7: Predictive Inventory Alerts (FR-028, FR-028a)

**Given**: Inventory items with consumption history
**When**: User views Inventory page
**Then**: Low-stock items highlighted

**Test Steps**:
```bash
# 1. Navigate to /dashboard/inventory
# 2. Verify items displayed in grid/list
# 3. Look for items with red "Low Stock" badge
# 4. Hover over badge
# 5. Verify tooltip shows: "2.3 days of supply remaining"
# 6. Click on low-stock item
# 7. Verify details panel shows:
#    - Current stock: 45 units
#    - Avg daily consumption: 20 units/day
#    - Lead time: 3 days
#    - Calculated threshold: < 4 days supply
# 8. Click "Set Custom Threshold" button
# 9. Enter: 50 units
# 10. Save
# 11. Verify badge now shows custom threshold indicator
# 12. Verify item still flagged as low-stock (45 < 50)
```

**Expected Result**:
- ✅ Low-stock calculation: (current_stock / avg_consumption) < (lead_time + 1 day)
- ✅ Visual indicators: red badge + icon (FR-028)
- ✅ Predictive by default (7-day rolling average)
- ✅ Custom threshold overrides prediction (FR-028a)
- ✅ Tooltip shows days of supply remaining

**Validation Query** (check consumption tracking):
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/inventory/{itemId}/consumption

# Response should show:
# {
#   "avg_daily_consumption": 20,
#   "calculation_period_days": 7,
#   "custom_reorder_threshold": 50,  # if set
#   "days_of_supply_remaining": 2.25
# }
```

---

### Scenario 8: Theme Toggle (FR-005, FR-006)

**Given**: User is on any dashboard page
**When**: User toggles theme
**Then**: Theme applies instantly and persists

**Test Steps**:
```bash
# 1. Open dashboard (default: light theme)
# 2. Click theme toggle icon (top right)
# 3. Verify immediate switch to dark theme (no flicker)
# 4. Navigate to different page (e.g., Orders → Inventory)
# 5. Verify dark theme persists
# 6. Close browser
# 7. Reopen and login
# 8. Verify dark theme still active
# 9. Toggle back to light
# 10. Verify localStorage and backend synced
```

**Expected Result**:
- ✅ Instant theme switch (<50ms)
- ✅ All components styled correctly in both themes
- ✅ Preference persisted in localStorage (immediate)
- ✅ Preference synced to backend (async)
- ✅ Multi-device sync (if user logs in on different device)

**Validation**:
```javascript
// localStorage
console.log(localStorage.getItem('theme')); // 'light' or 'dark'

// API (async sync)
fetch('http://localhost:5000/api/v1/users/me', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(user => {
  console.log(user.preferences.theme); // 'light' or 'dark'
});
```

---

### Scenario 9: Mobile Responsive Navigation (FR-003, FR-055)

**Given**: User accesses dashboard on mobile device
**When**: User taps menu button
**Then**: Sidebar opens as overlay

**Test Steps**:
```bash
# 1. Open Chrome DevTools → Toggle device toolbar (Ctrl+Shift+M)
# 2. Select "iPhone 12 Pro" (390x844)
# 3. Navigate to /dashboard/overview
# 4. Verify sidebar hidden by default on mobile
# 5. Verify hamburger menu icon visible (top left)
# 6. Tap hamburger icon
# 7. Verify sidebar slides in as overlay (covers content)
# 8. Tap "Orders" in sidebar
# 9. Verify sidebar auto-closes after navigation
# 10. Verify Orders page loads
# 11. Rotate to landscape
# 12. Verify layout adapts appropriately
```

**Expected Result**:
- ✅ Mobile (<768px): Sidebar hidden, hamburger menu shown
- ✅ Tablet (768-1024px): Collapsed sidebar by default
- ✅ Desktop (>1024px): Expanded sidebar by default
- ✅ All content readable and accessible (no horizontal scroll)
- ✅ Touch targets ≥44px (iOS accessibility)

---

## Performance Validation

### API Response Times
```bash
# All endpoints should meet <200ms p95 latency
for i in {1..100}; do
  time curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:5000/api/v1/widgets/config -o /dev/null -s
done | awk '{sum+=$1} END {print "Avg:", sum/NR, "ms"}'
# Should be < 200ms
```

### WebSocket Reconnection
```bash
# Test exponential backoff timing
# In browser DevTools Network → WS tab, manually close connection
# Verify reconnection attempts at: 2s, 4s, 8s, 16s, 32s, ...
```

### Widget Limit Enforcement
```bash
# Attempt to add 21st widget
curl -X PUT http://localhost:5000/api/v1/widgets/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"layout_type":"grid","widgets":[...21 widgets...]}'
# Should return 400 Bad Request with validation error
```

---

## Test Data Cleanup

After validation, reset test data:
```bash
cd api
npm run db:seed -- --reset
```

---

## Automated E2E Test Mapping

These manual scenarios map to Playwright E2E tests:

| Scenario | Test File | Status |
|----------|-----------|--------|
| 1. Auth & Access | `tests/e2e/auth-flow.spec.ts` | 🔴 To Write |
| 2. Navigation | `tests/e2e/navigation.spec.ts` | 🔴 To Write |
| 3. Widgets | `tests/e2e/widgets.spec.ts` | 🔴 To Write |
| 4. Real-Time | `tests/e2e/realtime.spec.ts` | 🔴 To Write |
| 5. Order Filter | `tests/e2e/orders-filter.spec.ts` | 🔴 To Write |
| 6. Order Locks | `tests/e2e/order-locks.spec.ts` | 🔴 To Write |
| 7. Inventory | `tests/e2e/inventory-alerts.spec.ts` | 🔴 To Write |
| 8. Theme | `tests/e2e/theme-toggle.spec.ts` | 🔴 To Write |
| 9. Mobile | `tests/e2e/mobile-responsive.spec.ts` | 🔴 To Write |

All tests must pass before feature considered complete (TDD principle).

---

*Quickstart guide ready for manual validation and E2E test generation*
*Next: Run update-agent-context.sh to sync CLAUDE.md*