import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { usersTable } from './users.schema';
import { orders } from './orders.schema';

export const orderLocks = pgTable('order_locks', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' })
    .unique(), // Only one lock per order
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
  order: one(orders, {
    fields: [orderLocks.orderId],
    references: [orders.id],
  }),
  lockedByUser: one(usersTable, {
    fields: [orderLocks.lockedByUserId],
    references: [usersTable.id],
  }),
}));

// Type exports
export type OrderLock = typeof orderLocks.$inferSelect;
export type NewOrderLock = typeof orderLocks.$inferInsert;
