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
} from 'drizzle-orm/pg-core';

export const internalOrderSourceEnum = pgEnum('internal_order_source', [
  'cafe',
  'restaurant',
  'front_house',
  'catering',
  'retail',
  'events',
]);

export const internalOrderStatusEnum = pgEnum('internal_order_status', [
  'requested',
  'approved',
  'in_preparation',
  'ready',
  'delivered',
  'rejected',
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

export const internalOrders = pgTable('internal_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: varchar('order_number', { length: 50 }).unique().notNull(),
  source: internalOrderSourceEnum('source').notNull(),
  status: internalOrderStatusEnum('status').default('requested').notNull(),
  priority: internalOrderPriorityEnum('priority').default('normal').notNull(),
  requestedBy: varchar('requested_by', { length: 255 }).notNull(),
  requestedByEmail: varchar('requested_by_email', { length: 255 }),
  department: varchar('department', { length: 255 }).notNull(),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
  requestedDate: timestamp('requested_date').notNull(),
  neededByDate: timestamp('needed_by_date').notNull(),
  approvedBy: varchar('approved_by', { length: 255 }),
  approvedAt: timestamp('approved_at'),
  completedAt: timestamp('completed_at'),
  deliveredAt: timestamp('delivered_at'),
  specialInstructions: text('special_instructions'),
  notes: text('notes'),

  // Recurring order fields
  isRecurring: boolean('is_recurring').default(false),
  recurringFrequency: internalOrderFrequencyEnum('recurring_frequency'),
  nextOrderDate: timestamp('next_order_date'),
  recurringEndDate: timestamp('recurring_end_date'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

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
