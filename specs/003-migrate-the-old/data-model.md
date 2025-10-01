# Data Model Design

**Feature**: Dashboard Routes Migration
**Date**: 2025-09-30

## Overview

This data model defines the three new database entities required for dashboard functionality, plus extensions to existing entities. All schemas follow the Database-First constitutional principle.

## New Entities

### 1. Widget Configurations

**Purpose**: Store user-specific dashboard widget layouts and preferences (FR-014, FR-015)

**Schema** (`widget_configurations`):
```typescript
{
  id: UUID (PRIMARY KEY),
  user_id: UUID (FOREIGN KEY → users.id, NOT NULL),
  layout_type: ENUM('grid', 'list', 'masonry') (NOT NULL, DEFAULT 'grid'),
  widgets: JSONB (NOT NULL), // Array of widget configs
  created_at: TIMESTAMP (NOT NULL, DEFAULT NOW()),
  updated_at: TIMESTAMP (NOT NULL, DEFAULT NOW())
}
```

**Constraints**:
- `UNIQUE(user_id)` - One layout configuration per user
- `CHECK (jsonb_array_length(widgets) <= 20)` - Max 20 widgets (per clarification)
- `widgets` JSONB structure:
  ```typescript
  [
    {
      id: string,           // Unique widget instance ID
      type: string,         // 'metrics' | 'orders' | 'inventory' | 'production' | 'chart'
      position: {           // Grid position
        x: number,
        y: number,
        w: number,          // Width in grid units
        h: number           // Height in grid units
      },
      config: object        // Widget-specific settings
    }
  ]
  ```

**Indexes**:
- Primary: `id`
- Unique: `user_id`
- GIN index on `widgets` JSONB for filtering

**Validation Rules**:
- `widgets` array length: 0-20 items
- Each widget must have: id, type, position
- Position values must be non-negative integers
- Widget types must be from allowed enum

**State Transitions**: None (simple CRUD)

---

### 2. Order Locks

**Purpose**: Track which user is currently editing an order to prevent concurrent modifications (FR-022a, FR-022b, FR-022c)

**Schema** (`order_locks`):
```typescript
{
  id: UUID (PRIMARY KEY),
  order_id: UUID (FOREIGN KEY → orders.id, NOT NULL),
  locked_by_user_id: UUID (FOREIGN KEY → users.id, NOT NULL),
  locked_by_session_id: VARCHAR(255) (NOT NULL), // WebSocket session ID
  locked_at: TIMESTAMP (NOT NULL, DEFAULT NOW()),
  expires_at: TIMESTAMP (NOT NULL), // Auto-calculated: locked_at + 5 minutes
  last_activity_at: TIMESTAMP (NOT NULL, DEFAULT NOW())
}
```

**Constraints**:
- `UNIQUE(order_id)` - Only one lock per order
- `CHECK (expires_at > locked_at)` - Expiry must be in future
- `expires_at` default: `locked_at + INTERVAL '5 minutes'`

**Indexes**:
- Primary: `id`
- Unique: `order_id` (for fast lock acquisition checks)
- Index: `locked_by_user_id` (for user's active locks query)
- Index: `expires_at` (for cleanup job queries)

**Validation Rules**:
- Lock TTL: 5 minutes (renewable on activity)
- `session_id` must match active WebSocket connection
- User can hold max 10 simultaneous locks (business rule)

**State Transitions**:
```
NULL (no lock)
  ↓ acquire_lock()
LOCKED (active, expires_at > NOW())
  ↓ renew_lock() (on user activity)
LOCKED (extended expires_at)
  ↓ release_lock() OR expires_at < NOW()
NULL (released/expired)
```

**Lifecycle**:
- Created: When user opens order modal
- Updated: Every 30 seconds while modal open (heartbeat)
- Deleted: On explicit close, logout, or TTL expiration
- Cleanup: Background job removes expired locks every 60 seconds

---

### 3. Inventory Consumption Tracking

**Purpose**: Store calculated consumption rates for predictive low-stock alerts (FR-028, FR-028a)

**Schema** (`inventory_consumption_tracking`):
```typescript
{
  id: UUID (PRIMARY KEY),
  inventory_item_id: UUID (FOREIGN KEY → inventory.id, NOT NULL),
  avg_daily_consumption: DECIMAL(10,2) (NOT NULL), // Units per day
  calculation_period_days: INTEGER (NOT NULL, DEFAULT 7), // Rolling window
  last_calculated_at: TIMESTAMP (NOT NULL),
  calculation_method: ENUM('historical_orders', 'manual', 'predicted') (NOT NULL),

  // User override fields
  custom_reorder_threshold: DECIMAL(10,2) (NULLABLE), // User-set override
  custom_lead_time_days: INTEGER (NULLABLE), // User-set lead time

  // Metadata
  sample_size: INTEGER (NOT NULL), // Number of orders in calculation
  created_at: TIMESTAMP (NOT NULL, DEFAULT NOW()),
  updated_at: TIMESTAMP (NOT NULL, DEFAULT NOW())
}
```

**Constraints**:
- `UNIQUE(inventory_item_id)` - One tracking record per item
- `CHECK (avg_daily_consumption >= 0)` - Non-negative consumption
- `CHECK (calculation_period_days > 0)` - Positive period
- `CHECK (sample_size >= 0)` - Non-negative sample

**Indexes**:
- Primary: `id`
- Unique: `inventory_item_id`
- Index: `last_calculated_at` (for stale data detection)

**Validation Rules**:
- `avg_daily_consumption` calculated from last 7 days of orders
- `sample_size` minimum: 3 orders (else mark as 'insufficient data')
- If `custom_reorder_threshold` set, it overrides calculation
- `last_calculated_at` older than 24h triggers recalculation flag

**Calculation Logic**:
```typescript
// Predictive threshold formula (from research.md)
is_low_stock = (current_stock / avg_daily_consumption) < (lead_time_days + safety_buffer)

// Example:
// current_stock = 50 units
// avg_daily_consumption = 20 units/day
// lead_time_days = 3 days
// safety_buffer = 1 day
// Result: (50 / 20) = 2.5 days < (3 + 1) = 4 days → LOW STOCK

// Custom override:
if (custom_reorder_threshold !== null) {
  is_low_stock = current_stock < custom_reorder_threshold
}
```

**State Transitions**:
```
UNTRACKED (no record)
  ↓ initial_calculation()
ACTIVE (has consumption data)
  ↓ daily_batch_job()
UPDATED (refreshed avg_daily_consumption)
  ↓ user_sets_custom_threshold()
OVERRIDDEN (custom_reorder_threshold set)
  ↓ user_removes_custom_threshold()
ACTIVE (back to calculated)
```

---

## Entity Relationships

```
users (EXISTING)
  ├─→ widget_configurations (1:1) - One layout per user
  └─→ order_locks (1:N) - User can lock multiple orders

orders (EXISTING)
  └─→ order_locks (1:0..1) - Order can have at most one active lock

inventory (EXISTING)
  └─→ inventory_consumption_tracking (1:1) - One tracking record per item
```

## Extensions to Existing Entities

### Users Table
No schema changes required. Existing fields sufficient:
- `id`, `name`, `email`, `avatar` used in FR-004
- Preferences JSONB can store theme (FR-005, FR-006)

### Orders Table
No schema changes required. Existing fields sufficient:
- Status enum already includes: pending, confirmed, in_production, ready, delivered, cancelled (FR-018, FR-021)

### Inventory Table
Extend with computed field (not stored, calculated on query):
```typescript
// Virtual field: low_stock (boolean)
// Calculated by joining with inventory_consumption_tracking
SELECT
  i.*,
  CASE
    WHEN ict.custom_reorder_threshold IS NOT NULL THEN
      i.current_stock < ict.custom_reorder_threshold
    ELSE
      (i.current_stock / NULLIF(ict.avg_daily_consumption, 0)) < (i.lead_time_days + 1)
  END AS low_stock
FROM inventory i
LEFT JOIN inventory_consumption_tracking ict ON i.id = ict.inventory_item_id
```

---

## Drizzle ORM Schema Files

**New Files to Create**:
1. `api/src/database/schemas/widget-configurations.ts`
2. `api/src/database/schemas/order-locks.ts`
3. `api/src/database/schemas/inventory-consumption.ts`
4. `api/src/database/schemas/relations.ts` (extend existing)

**Migration Strategy**:
1. Generate migration: `npm run db:generate`
2. Review migration file in `api/src/database/migrations/`
3. Apply migration: `npm run db:migrate`
4. Verify schema: `npm run db:studio`

---

## Type Safety

All entities will generate TypeScript types via Drizzle:
```typescript
// Auto-generated from schema
import { widgetConfigurations, orderLocks, inventoryConsumption } from '@/database/schemas';

type WidgetConfiguration = typeof widgetConfigurations.$inferSelect;
type NewWidgetConfiguration = typeof widgetConfigurations.$inferInsert;

type OrderLock = typeof orderLocks.$inferSelect;
type NewOrderLock = typeof orderLocks.$inferInsert;

type InventoryConsumption = typeof inventoryConsumption.$inferSelect;
type NewInventoryConsumption = typeof inventoryConsumption.$inferInsert;
```

---

## Validation DTOs (NestJS)

Backend will define Zod validation schemas for each entity:
```typescript
// widgets/dto/create-widget-config.dto.ts
export const CreateWidgetConfigSchema = z.object({
  layout_type: z.enum(['grid', 'list', 'masonry']),
  widgets: z.array(WidgetSchema).max(20),
});

// order-locks/dto/acquire-lock.dto.ts
export const AcquireLockSchema = z.object({
  order_id: z.string().uuid(),
  session_id: z.string().min(1),
});

// inventory-consumption/dto/set-custom-threshold.dto.ts
export const SetCustomThresholdSchema = z.object({
  inventory_item_id: z.string().uuid(),
  custom_reorder_threshold: z.number().min(0),
});
```

---

## Data Model Completeness Checklist

- [x] All new entities defined with complete schemas
- [x] Primary keys (UUID) defined
- [x] Foreign keys and relationships documented
- [x] Indexes for performance identified
- [x] Constraints and validation rules specified
- [x] State transitions documented (where applicable)
- [x] Extensions to existing entities documented
- [x] Type generation strategy defined
- [x] Validation DTO approach specified
- [x] Migration strategy outlined

---

*Data model design complete: 2025-09-30*
*Next: Generate API contracts in `/contracts/`*