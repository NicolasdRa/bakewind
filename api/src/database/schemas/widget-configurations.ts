import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { usersTable } from './users.schema';

export const widgetConfigurations = pgTable('widget_configurations', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' })
    .unique(), // One configuration per user
  layoutType: varchar('layout_type', { length: 20 }).notNull().default('grid'), // 'grid' | 'list' | 'masonry'
  widgets: jsonb('widgets').notNull().default('[]'), // Array of widget configs
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const widgetConfigurationsRelations = relations(
  widgetConfigurations,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [widgetConfigurations.userId],
      references: [usersTable.id],
    }),
  }),
);

// TypeScript types inferred from schema
export type WidgetConfiguration = typeof widgetConfigurations.$inferSelect;
export type NewWidgetConfiguration = typeof widgetConfigurations.$inferInsert;

// Widget structure types (for JSONB validation)
export interface Widget {
  id: string;
  type:
    | 'metrics'
    | 'orders'
    | 'inventory'
    | 'production'
    | 'chart'
    | 'preferences';
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config?: Record<string, unknown>;
}

export type LayoutType = 'grid' | 'list' | 'masonry';
