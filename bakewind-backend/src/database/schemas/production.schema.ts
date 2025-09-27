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
} from 'drizzle-orm/pg-core';
import { recipes } from './recipes.schema';

export const productionStatusEnum = pgEnum('production_status', [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
]);

export const productionSchedules = pgTable('production_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date').notNull(),
  totalItems: integer('total_items').default(0).notNull(),
  completedItems: integer('completed_items').default(0).notNull(),
  notes: text('notes'),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productionItems = pgTable('production_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  scheduleId: uuid('schedule_id')
    .references(() => productionSchedules.id, { onDelete: 'cascade' })
    .notNull(),
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
