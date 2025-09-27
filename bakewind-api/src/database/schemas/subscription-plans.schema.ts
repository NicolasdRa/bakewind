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
  json,
} from 'drizzle-orm/pg-core';

export const subscriptionPlansTable = pgTable(
  'subscription_plans',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    // Plan details
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: text('description').notNull(),

    // Pricing (in cents USD)
    priceMonthlyUsd: integer('price_monthly_usd').notNull(),
    priceAnnualUsd: integer('price_annual_usd').notNull(),

    // Limits
    maxLocations: integer('max_locations'), // null = unlimited
    maxUsers: integer('max_users'), // null = unlimited

    // Features
    features: json('features').$type<string[]>().notNull().default([]),

    // Stripe integration
    stripePriceIdMonthly: varchar('stripe_price_id_monthly', { length: 100 }),
    stripePriceIdAnnual: varchar('stripe_price_id_annual', { length: 100 }),

    // Display settings
    isPopular: boolean('is_popular').notNull().default(false),
    sortOrder: integer('sort_order').notNull(),
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
    idxPlanName: index('idx_plan_name').on(table.name),
    idxPlanActive: index('idx_plan_active').on(table.isActive),
    idxPlanSortOrder: index('idx_plan_sort_order').on(table.sortOrder),
    idxPlanPopular: index('idx_plan_popular').on(table.isPopular),
    idxPlanPricing: index('idx_plan_pricing').on(table.priceMonthlyUsd, table.priceAnnualUsd),
    idxPlanActiveSort: index('idx_plan_active_sort')
      .on(table.isActive, table.sortOrder)
      .where(sql`${table.isActive} = true`),
  }),
);