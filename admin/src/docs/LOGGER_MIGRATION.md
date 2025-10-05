# Logger Migration Guide

## Overview
This document tracks the migration from `console.log()` to the centralized `logger` utility across the BakeWind Admin application.

## Logger Utility Improvements

### Enhanced Logger Features (`src/utils/logger.ts`)
Added specialized logging functions for different use cases:

- `logger.auth()` - Authentication-related logs (uses INFO level with 🔐 icon)
- `logger.api()` - API request/response logs (uses DEBUG level with 🌐 icon)
- `logger.realtime()` - WebSocket/realtime connection logs (uses DEBUG level with ⚡ icon)
- `logger.ui()` - UI component rendering logs (uses DEBUG level with 🎨 icon)
- `logger.store()` - Store state management logs (uses DEBUG level with 📦 icon)
- `logger.websocket()` - Legacy WebSocket logs (uses DEBUG level with 🔌 icon)

### Log Levels
- `DEBUG` - Detailed information for development (hidden in production)
- `INFO` - General information (important user flows)
- `WARN` - Warning messages
- `ERROR` - Error messages with stack traces

## Completed Migrations

### ✅ API Clients
- **File**: `src/api/client-cookie.ts`
  - Authorization errors: `logger.api()`
  - Token refresh: `logger.api()`, `logger.warn()`, `logger.error()`
  - Request errors: `logger.error()`

- **File**: `src/api/client.ts`
  - Token refresh errors: `logger.error()`
  - Request errors: `logger.error()`

### ✅ Auth Pages
- **File**: `src/pages/auth/Login.tsx`
  - Login attempts: `logger.auth()`
  - Login success: `logger.auth()`
  - Redirects: `logger.auth()`
  - Errors: `logger.error()`

- **File**: `src/pages/auth/Register.tsx`
  - Registration attempts: `logger.auth()`
  - Registration success: `logger.auth()`
  - Redirects: `logger.auth()`
  - Errors: `logger.error()`

- **File**: `src/pages/auth/TrialSignup.tsx`
  - Signup attempts: `logger.auth()`
  - Signup success: `logger.auth()`
  - Redirects: `logger.auth()`
  - Errors: `logger.error()`

- **File**: `src/pages/auth/ForgotPassword.tsx`
  - Password reset requests: `logger.auth()`
  - Success messages: `logger.auth()`
  - Errors: `logger.error()`

### ✅ App Core & Layouts
- **File**: `src/App.tsx`
  - Component rendering: `logger.ui()`

- **File**: `src/layouts/RootLayout.tsx`
  - Component rendering: `logger.ui()`

- **File**: `src/layouts/ProtectedLayout/ProtectedLayout.tsx`
  - Auth state checks: `logger.auth()`
  - Redirects: `logger.auth()`

## Remaining Migrations

### 🔄 Stores (High Priority)
**File**: `src/stores/authStore.tsx`
- Initialization: Use `logger.auth()`
- Auth callbacks: Use `logger.auth()`
- Errors: Use `logger.error()`

**File**: `src/stores/realtimeStore.ts`
- Connection status: Use `logger.realtime()`
- Metrics updates: Use `logger.store()`
- Errors: Use `logger.error()`

**File**: `src/stores/bakeryStore.ts`
- Data loading: Use `logger.store()`

**File**: `src/stores/order-locks.ts`
- Lock status errors: Use `logger.error()`

### 🔄 API Modules (High Priority)
**File**: `src/api/realtime.ts`
- Connection events: Use `logger.realtime()`
- Dashboard joins: Use `logger.realtime()`
- Errors: Use `logger.error()`
- Warnings: Use `logger.warn()`

### 🔄 Components (Medium Priority)
**File**: `src/components/DashboardContent/DashboardContent.tsx`
- Initialization: Use `logger.ui()`
- Widget operations: Use `logger.ui()`
- Errors: Use `logger.error()`

**File**: `src/components/orders/OrderModal.tsx`
- Lock operations errors: Use `logger.error()`

**File**: `src/components/Sidebar/Sidebar.tsx`
- Logout errors: Use `logger.error()`

### 🔄 Pages (Low Priority)
**File**: `src/pages/overview/OverviewPage.tsx`
- Initialization: Use `logger.ui()`

**File**: `src/pages/profile/ProfilePage.tsx`
- Profile update errors: Use `logger.error()`
- Password change errors: Use `logger.error()`

## Migration Patterns

### Pattern 1: Simple Info Log
```typescript
// Before
console.log('[Component] Some message');

// After
import { logger } from '../../utils/logger';
logger.ui('Some message');
```

### Pattern 2: Log with Data
```typescript
// Before
console.log('[Auth] User logged in:', user.email);

// After
logger.auth(`User logged in: ${user.email}`);
// OR with object
logger.auth('User logged in', { email: user.email });
```

### Pattern 3: Error Logging
```typescript
// Before
console.error('[API] Request failed:', error);

// After
logger.error('Request failed', error);
```

### Pattern 4: Conditional/Debug Logging
```typescript
// Before
console.log('[Store] Metrics update:', event.metrics);

// After
logger.store('Metrics update', event.metrics);
```

## Usage Guidelines

1. **Choose the right logger function**:
   - Auth operations → `logger.auth()`
   - API calls → `logger.api()`
   - UI rendering → `logger.ui()`
   - Store updates → `logger.store()`
   - Realtime/WebSocket → `logger.realtime()`
   - General debug → `logger.debug()`
   - Errors → `logger.error()`
   - Warnings → `logger.warn()`

2. **Message format**:
   - Be concise and descriptive
   - No need for component prefixes (logger adds timestamps and levels)
   - Use template strings for dynamic values

3. **Data logging**:
   - Pass objects as second parameter for expandable console output
   - Avoid logging sensitive data (passwords, tokens, etc.)

4. **Performance**:
   - Logger respects environment log levels
   - Debug logs are hidden in production
   - No performance impact when logs are disabled

## Benefits

1. **Centralized Control**: Change log level globally based on environment
2. **Better Filtering**: Each log type has unique emoji for easy identification
3. **Production Safety**: Debug logs automatically disabled in production
4. **Type Safety**: TypeScript ensures proper logger usage
5. **Consistency**: Uniform logging format across the app
6. **Performance**: Logs can be disabled without code changes

## Next Steps

To complete the migration:

1. Update stores (authStore, realtimeStore, bakeryStore, order-locks)
2. Update API realtime module
3. Update components (DashboardContent, OrderModal, Sidebar)
4. Update pages (OverviewPage, ProfilePage)
5. Search for any remaining `console.log` instances: `grep -r "console\\.log" src/`
6. Remove this migration guide once complete
