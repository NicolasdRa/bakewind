import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { usersTable } from './users.schema';
import { internalOrders } from './internal-orders.schema';
import { customerOrders } from './orders.schema';

export const orderTypeEnum = pgEnum('order_lock_type', [
  'customer',
  'internal',
]);

export const orderLocks = pgTable('order_locks', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  orderType: orderTypeEnum('order_type').notNull(), // 'customer' or 'internal'
  orderId: uuid('order_id').notNull().unique(), // Only one lock per order (regardless of type)
  lockedByUserId: uuid('locked_by_user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  lockedBySessionId: varchar('locked_by_session_id', { length: 255 }).notNull(),
  lockedAt: timestamp('locked_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(), // Default 5 minutes from lockedAt
  lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
});

// Relations
export const orderLocksRelations = relations(orderLocks, ({ one }) => ({
  // Note: Relations don't enforce the orderType, that's done at application level
  internalOrder: one(internalOrders, {
    fields: [orderLocks.orderId],
    references: [internalOrders.id],
  }),
  customerOrder: one(customerOrders, {
    fields: [orderLocks.orderId],
    references: [customerOrders.id],
  }),
  lockedByUser: one(usersTable, {
    fields: [orderLocks.lockedByUserId],
    references: [usersTable.id],
  }),
}));

// Type exports
export type OrderLock = typeof orderLocks.$inferSelect;
export type NewOrderLock = typeof orderLocks.$inferInsert;
