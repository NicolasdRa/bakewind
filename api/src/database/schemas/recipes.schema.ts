import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  integer,
  timestamp,
  boolean,
  json,
} from 'drizzle-orm/pg-core';
import { inventoryItems } from './inventory.schema';

export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  description: text('description'),
  prepTime: integer('prep_time').notNull(), // in minutes
  cookTime: integer('cook_time').notNull(), // in minutes
  yield: integer('yield').notNull(),
  yieldUnit: varchar('yield_unit', { length: 50 }).notNull(),
  costPerUnit: decimal('cost_per_unit', { precision: 10, scale: 4 }),
  sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }),
  // margin is calculated dynamically: (sellingPrice - costPerUnit) / sellingPrice * 100
  productId: uuid('product_id'), // Link to product this recipe produces
  productName: varchar('product_name', { length: 255 }),
  instructions: json('instructions').$type<string[]>().notNull(),
  nutritionalInfo: json('nutritional_info').$type<{
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    sugar?: number;
    sodium?: number;
  }>(),
  allergens: json('allergens').$type<string[]>(),
  tags: json('tags').$type<string[]>(),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const recipeIngredients = pgTable('recipe_ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id')
    .references(() => recipes.id, { onDelete: 'cascade' })
    .notNull(),
  ingredientId: uuid('ingredient_id')
    .references(() => inventoryItems.id, { onDelete: 'restrict' })
    .notNull(),
  ingredientName: varchar('ingredient_name', { length: 255 }).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  cost: decimal('cost', { precision: 10, scale: 4 }),
  notes: text('notes'),
});
