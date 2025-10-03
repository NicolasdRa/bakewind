import {
  pgTable,
  uuid,
  decimal,
  integer,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Note: inventory table exists in existing schema
// We'll need to import it when setting up relations
export const inventoryConsumptionTracking = pgTable(
  'inventory_consumption_tracking',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    inventoryItemId: uuid('inventory_item_id').notNull().unique(), // One tracking record per inventory item
    avgDailyConsumption: decimal('avg_daily_consumption', {
      precision: 10,
      scale: 2,
    })
      .notNull()
      .default('0'),
    calculationPeriodDays: integer('calculation_period_days')
      .notNull()
      .default(7),
    lastCalculatedAt: timestamp('last_calculated_at').notNull().defaultNow(),
    calculationMethod: varchar('calculation_method', { length: 50 })
      .notNull()
      .default('historical_orders'),

    // User override fields
    customReorderThreshold: decimal('custom_reorder_threshold', {
      precision: 10,
      scale: 2,
    }),
    customLeadTimeDays: integer('custom_lead_time_days'),

    // Metadata
    sampleSize: integer('sample_size').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
);

// Type exports
export type InventoryConsumptionTracking =
  typeof inventoryConsumptionTracking.$inferSelect;
export type NewInventoryConsumptionTracking =
  typeof inventoryConsumptionTracking.$inferInsert;
