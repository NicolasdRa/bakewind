import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  timestamp,
  pgEnum,
  json,
} from 'drizzle-orm/pg-core';

export const productCategoryEnum = pgEnum('product_category', [
  'bread',
  'pastry',
  'cake',
  'cookie',
  'sandwich',
  'beverage',
  'seasonal',
  'custom',
]);

export const productStatusEnum = pgEnum('product_status', [
  'active',
  'inactive',
  'seasonal',
  'discontinued',
]);

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: productCategoryEnum('category').notNull(),
  status: productStatusEnum('status').default('active').notNull(),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  costOfGoods: decimal('cost_of_goods', { precision: 10, scale: 2 }),
  // margin is calculated dynamically, not stored
  recipeId: uuid('recipe_id'),
  recipeName: varchar('recipe_name', { length: 255 }),
  estimatedPrepTime: integer('estimated_prep_time'), // in minutes
  allergens: json('allergens').$type<string[]>(),
  tags: json('tags').$type<string[]>(),
  imageUrl: text('image_url'),
  nutritionalInfo: json('nutritional_info').$type<{
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    sugar?: number;
    sodium?: number;
  }>(),
  availableSeasons: json('available_seasons').$type<string[]>(),
  minimumOrderQuantity: integer('minimum_order_quantity').default(1),
  storageInstructions: text('storage_instructions'),
  shelfLife: integer('shelf_life'), // in hours
  customizable: boolean('customizable').default(false).notNull(),
  customizationOptions: json('customization_options').$type<
    {
      name: string;
      type: 'text' | 'select' | 'checkbox';
      options?: string[];
      priceAdjustment?: number;
      required?: boolean;
    }[]
  >(),
  popularityScore: integer('popularity_score').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
