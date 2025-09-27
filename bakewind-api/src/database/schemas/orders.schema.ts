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
} from 'drizzle-orm/pg-core';
import { customers } from './customers.schema';

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'in_production',
  'ready',
  'delivered',
  'cancelled',
]);

export const orderSourceEnum = pgEnum('order_source', [
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

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: varchar('order_number', { length: 50 }).unique().notNull(),
  customerId: uuid('customer_id').references(() => customers.id, {
    onDelete: 'set null',
  }),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 50 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  source: orderSourceEnum('source').notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  paymentStatus: paymentStatusEnum('payment_status')
    .default('pending')
    .notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax: decimal('tax', { precision: 10, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  pickupTime: timestamp('pickup_time'),
  deliveryTime: timestamp('delivery_time'),
  specialRequests: text('special_requests'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  productId: uuid('product_id').notNull(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  specialInstructions: text('special_instructions'),
  customizations: json('customizations').$type<Record<string, any>>(),
});
