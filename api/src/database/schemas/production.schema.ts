import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
  boolean,
  date,
  index,
} from 'drizzle-orm/pg-core';
import { recipes } from './recipes.schema';
import { internalOrders } from './internal-orders.schema';
import { tenantsTable } from './tenants.schema';

export const productionStatusEnum = pgEnum('production_status', [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
]);

export const productionSchedules = pgTable(
  'production_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Tenant reference - which bakery owns this schedule
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenantsTable.id, { onDelete: 'cascade' }),

    date: date('date').notNull(),
    totalItems: integer('total_items').default(0).notNull(),
    completedItems: integer('completed_items').default(0).notNull(),
    notes: text('notes'),
    createdBy: varchar('created_by', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Tenant index for filtering
    idxProductionScheduleTenant: index('idx_production_schedule_tenant').on(
      table.tenantId,
    ),
    // Composite index for date queries
    idxProductionScheduleTenantDate: index(
      'idx_production_schedule_tenant_date',
    ).on(table.tenantId, table.date),
  }),
);

export const productionItems = pgTable('production_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  scheduleId: uuid('schedule_id')
    .references(() => productionSchedules.id, { onDelete: 'cascade' })
    .notNull(),
  internalOrderId: uuid('internal_order_id').references(
    () => internalOrders.id,
    { onDelete: 'set null' },
  ),
  customerOrderId: uuid('customer_order_id'),
  recipeId: uuid('recipe_id')
    .references(() => recipes.id, { onDelete: 'restrict' })
    .notNull(),
  recipeName: varchar('recipe_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  status: productionStatusEnum('status').default('scheduled').notNull(),
  scheduledTime: timestamp('scheduled_time').notNull(),
  startTime: timestamp('start_time'),
  completedTime: timestamp('completed_time'),
  assignedTo: varchar('assigned_to', { length: 255 }),
  notes: text('notes'),
  batchNumber: varchar('batch_number', { length: 100 }),
  qualityCheck: boolean('quality_check').default(false),
  qualityNotes: text('quality_notes'),
});
