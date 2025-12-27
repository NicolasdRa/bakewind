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
  index,
} from 'drizzle-orm/pg-core';
import { customers } from './customers.schema';
import { tenantsTable } from './tenants.schema';

export const customerOrderStatusEnum = pgEnum('customer_order_status', [
  'draft',
  'pending',
  'confirmed',
  'ready',
  'delivered',
  'cancelled',
]);

export const orderPriorityEnum = pgEnum('order_priority', [
  'low',
  'normal',
  'high',
  'rush',
]);

export const customerOrderSourceEnum = pgEnum('customer_order_source', [
  'online',
  'phone',
  'walk_in',
  'wholesale',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'partial',
  'refunded',
]);

export const customerOrders = pgTable(
  'customer_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Tenant reference - which bakery owns this order
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenantsTable.id, { onDelete: 'cascade' }),

    orderNumber: varchar('order_number', { length: 50 }).unique().notNull(),

    // Customer information
    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),
    customerName: varchar('customer_name', { length: 255 }).notNull(),
    customerPhone: varchar('customer_phone', { length: 50 }),
    customerEmail: varchar('customer_email', { length: 255 }),

    // Order details
    source: customerOrderSourceEnum('source').notNull(),
    status: customerOrderStatusEnum('status').default('pending').notNull(),
    priority: orderPriorityEnum('priority').default('normal').notNull(),
    paymentStatus: paymentStatusEnum('payment_status')
      .default('pending')
      .notNull(),

    // Pricing
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
    tax: decimal('tax', { precision: 10, scale: 2 }).notNull(),
    discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),

    // Timing
    pickupTime: timestamp('pickup_time'),
    deliveryTime: timestamp('delivery_time'),

    // General notes
    specialRequests: text('special_requests'),
    notes: text('notes'),

    // Timestamps
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Tenant index for filtering
    idxOrderTenant: index('idx_order_tenant').on(table.tenantId),
    // Composite indexes for common queries
    idxOrderTenantStatus: index('idx_order_tenant_status').on(
      table.tenantId,
      table.status,
    ),
    idxOrderTenantDate: index('idx_order_tenant_date').on(
      table.tenantId,
      table.createdAt,
    ),
  }),
);

export const customerOrderItems = pgTable('customer_order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .references(() => customerOrders.id, { onDelete: 'cascade' })
    .notNull(),
  productId: uuid('product_id').notNull(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  specialInstructions: text('special_instructions'),
  customizations: json('customizations').$type<Record<string, any>>(),
});
