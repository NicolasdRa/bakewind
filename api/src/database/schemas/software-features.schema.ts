import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  text,
  integer,
  uuid,
  index,
  pgEnum,
  json,
} from 'drizzle-orm/pg-core';

export const featureCategoryEnum = pgEnum('feature_category', [
  'orders',
  'inventory',
  'production',
  'analytics',
  'customers',
  'products',
]);

export const softwareFeaturesTable = pgTable(
  'software_features',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    // Feature details
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: text('description').notNull(),
    iconName: varchar('icon_name', { length: 50 }).notNull(),
    category: featureCategoryEnum('category').notNull(),

    // Plan availability
    availableInPlans: json('available_in_plans')
      .$type<string[]>()
      .notNull()
      .default([]),

    // Marketing
    demoUrl: varchar('demo_url', { length: 500 }),
    helpDocUrl: varchar('help_doc_url', { length: 500 }),

    // Display settings
    sortOrder: integer('sort_order').notNull(),
    isHighlighted: boolean('is_highlighted').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),

    // Audit fields
    createdAt: timestamp('created_at', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Performance indexes
    idxFeatureName: index('idx_feature_name').on(table.name),
    idxFeatureCategory: index('idx_feature_category').on(table.category),
    idxFeatureActive: index('idx_feature_active').on(table.isActive),
    idxFeatureSortOrder: index('idx_feature_sort_order').on(table.sortOrder),
    idxFeatureHighlighted: index('idx_feature_highlighted').on(
      table.isHighlighted,
    ),
    idxFeatureActiveSort: index('idx_feature_active_sort')
      .on(table.isActive, table.sortOrder)
      .where(sql`${table.isActive} = true`),
    idxFeatureCategorySort: index('idx_feature_category_sort').on(
      table.category,
      table.sortOrder,
    ),
  }),
);
