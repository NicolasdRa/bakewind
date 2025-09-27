import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  timestamp,
  pgEnum,
  date,
} from 'drizzle-orm/pg-core';

export const inventoryUnitEnum = pgEnum('inventory_unit', [
  'kg',
  'g',
  'l',
  'ml',
  'unit',
  'dozen',
]);

export const inventoryCategoryEnum = pgEnum('inventory_category', [
  'ingredient',
  'packaging',
  'supplies',
]);

export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  category: inventoryCategoryEnum('category').notNull(),
  unit: inventoryUnitEnum('unit').notNull(),
  currentStock: decimal('current_stock', { precision: 10, scale: 3 }).notNull(),
  minimumStock: decimal('minimum_stock', { precision: 10, scale: 3 }).notNull(),
  reorderPoint: decimal('reorder_point', { precision: 10, scale: 3 }).notNull(),
  reorderQuantity: decimal('reorder_quantity', {
    precision: 10,
    scale: 3,
  }).notNull(),
  costPerUnit: decimal('cost_per_unit', { precision: 10, scale: 4 }).notNull(),
  supplier: varchar('supplier', { length: 255 }),
  expirationDate: date('expiration_date'),
  location: varchar('location', { length: 255 }),
  lastRestocked: timestamp('last_restocked'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
