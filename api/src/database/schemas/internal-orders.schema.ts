import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  integer,
  timestamp,
  pgEnum,
  json,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { tenantsTable } from './tenants.schema';
import { staffTable } from './staff.schema';

export const internalOrderSourceEnum = pgEnum('internal_order_source', [
  'cafe',
  'restaurant',
  'front_house',
  'catering',
  'retail',
  'events',
  'management',
  'bakery',
  'patisserie',
]);

export const internalOrderStatusEnum = pgEnum('internal_order_status', [
  'draft',
  'requested',
  'approved',
  'scheduled',
  'in_production',
  'quality_check',
  'ready',
  'completed',
  'delivered',
  'cancelled',
]);

export const internalOrderPriorityEnum = pgEnum('internal_order_priority', [
  'low',
  'normal',
  'high',
  'urgent',
]);

export const internalOrderFrequencyEnum = pgEnum('internal_order_frequency', [
  'daily',
  'weekly',
  'monthly',
]);

export const internalOrders = pgTable(
  'internal_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: varchar('order_number', { length: 50 }).unique().notNull(),

    // Multi-tenancy: which bakery business this order belongs to
    tenantId: uuid('tenant_id')
      .references(() => tenantsTable.id, { onDelete: 'cascade' })
      .notNull(),

    source: internalOrderSourceEnum('source').notNull(),
    status: internalOrderStatusEnum('status').default('requested').notNull(),
    priority: internalOrderPriorityEnum('priority').default('normal').notNull(),

    // Requested by staff member (FK + denormalized name)
    requestedByStaffId: uuid('requested_by_staff_id')
      .references(() => staffTable.id, { onDelete: 'set null' }),
    requestedByName: varchar('requested_by_name', { length: 255 }).notNull(),
    requestedByEmail: varchar('requested_by_email', { length: 255 }),

    totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
    requestedDate: timestamp('requested_date').notNull(),
    neededByDate: timestamp('needed_by_date').notNull(),

    // Approved by staff member (FK + denormalized name)
    approvedByStaffId: uuid('approved_by_staff_id').references(
      () => staffTable.id,
      { onDelete: 'set null' },
    ),
    approvedByName: varchar('approved_by_name', { length: 255 }),
    approvedAt: timestamp('approved_at'),

    completedAt: timestamp('completed_at'),
    deliveredAt: timestamp('delivered_at'),
    specialInstructions: text('special_instructions'),
    notes: text('notes'),

    // Production-specific fields
    productionDate: timestamp('production_date'),
    productionShift: varchar('production_shift', { length: 50 }),
    batchNumber: varchar('batch_number', { length: 100 }),
    assignedStaffId: uuid('assigned_staff_id').references(() => staffTable.id, {
      onDelete: 'set null',
    }),
    assignedStaffName: varchar('assigned_staff_name', { length: 255 }),
    workstation: varchar('workstation', { length: 100 }),
    targetQuantity: integer('target_quantity'),
    actualQuantity: integer('actual_quantity'),
    wasteQuantity: integer('waste_quantity'),
    qualityNotes: text('quality_notes'),

    // Recurring order fields
    isRecurring: boolean('is_recurring').default(false),
    recurringFrequency: internalOrderFrequencyEnum('recurring_frequency'),
    nextOrderDate: timestamp('next_order_date'),
    recurringEndDate: timestamp('recurring_end_date'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Performance indexes
    idxInternalOrderTenant: index('idx_internal_order_tenant').on(table.tenantId),
    idxInternalOrderStatus: index('idx_internal_order_status').on(table.status),
    idxInternalOrderSource: index('idx_internal_order_source').on(table.source),
    idxInternalOrderRequestedBy: index('idx_internal_order_requested_by').on(
      table.requestedByStaffId,
    ),
    idxInternalOrderApprovedBy: index('idx_internal_order_approved_by').on(
      table.approvedByStaffId,
    ),
    idxInternalOrderAssignedTo: index('idx_internal_order_assigned_to').on(
      table.assignedStaffId,
    ),
    idxInternalOrderProductionDate: index('idx_internal_order_production_date').on(
      table.productionDate,
    ),
    idxInternalOrderNeededBy: index('idx_internal_order_needed_by').on(
      table.neededByDate,
    ),
    idxInternalOrderTenantStatus: index('idx_internal_order_tenant_status').on(
      table.tenantId,
      table.status,
    ),
  }),
);

export const internalOrderItems = pgTable('internal_order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  internalOrderId: uuid('internal_order_id')
    .references(() => internalOrders.id, { onDelete: 'cascade' })
    .notNull(),
  productId: uuid('product_id').notNull(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }),
  specialInstructions: text('special_instructions'),
  customizations: json('customizations').$type<Record<string, any>>(),
});
