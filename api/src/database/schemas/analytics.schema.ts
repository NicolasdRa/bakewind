import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  integer,
  timestamp,
  date,
  json,
  index,
} from 'drizzle-orm/pg-core';
import { tenantsTable } from './tenants.schema';

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Tenant reference - which bakery this event belongs to
    tenantId: uuid('tenant_id').references(() => tenantsTable.id, {
      onDelete: 'cascade',
    }),

    eventType: varchar('event_type', { length: 100 }).notNull(),
    eventData: json('event_data').$type<Record<string, any>>(),
    userId: uuid('user_id'),
    sessionId: varchar('session_id', { length: 255 }),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
  },
  (table) => ({
    idxAnalyticsEventsTenant: index('idx_analytics_events_tenant').on(
      table.tenantId,
    ),
    idxAnalyticsEventsTenantType: index('idx_analytics_events_tenant_type').on(
      table.tenantId,
      table.eventType,
    ),
  }),
);

export const dailyMetrics = pgTable(
  'daily_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Tenant reference - which bakery this metric belongs to
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenantsTable.id, { onDelete: 'cascade' }),

    date: date('date').notNull(),
    totalOrders: integer('total_orders').default(0).notNull(),
    totalRevenue: decimal('total_revenue', { precision: 12, scale: 2 })
      .default('0')
      .notNull(),
    totalInternalOrders: integer('total_internal_orders').default(0).notNull(),
    totalProductionItems: integer('total_production_items')
      .default(0)
      .notNull(),
    completedProductionItems: integer('completed_production_items')
      .default(0)
      .notNull(),
    productionEfficiency: decimal('production_efficiency', {
      precision: 5,
      scale: 2,
    }).default('0'),
    topProducts: json('top_products').$type<
      {
        productId: string;
        productName: string;
        quantity: number;
        revenue: number;
      }[]
    >(),
    lowStockItems: integer('low_stock_items').default(0).notNull(),
    expiringSoonItems: integer('expiring_soon_items').default(0).notNull(),
    inventoryValue: decimal('inventory_value', {
      precision: 12,
      scale: 2,
    }).default('0'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Tenant index for filtering
    idxDailyMetricsTenant: index('idx_daily_metrics_tenant').on(table.tenantId),
    // Composite index for date queries
    idxDailyMetricsTenantDate: index('idx_daily_metrics_tenant_date').on(
      table.tenantId,
      table.date,
    ),
  }),
);

export const productMetrics = pgTable(
  'product_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Tenant reference - which bakery this metric belongs to
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenantsTable.id, { onDelete: 'cascade' }),

    productId: uuid('product_id').notNull(),
    date: date('date').notNull(),
    quantitySold: integer('quantity_sold').default(0).notNull(),
    revenue: decimal('revenue', { precision: 10, scale: 2 })
      .default('0')
      .notNull(),
    viewCount: integer('view_count').default(0).notNull(),
    averageRating: decimal('average_rating', { precision: 3, scale: 2 }),
    popularityScore: integer('popularity_score').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Tenant index for filtering
    idxProductMetricsTenant: index('idx_product_metrics_tenant').on(
      table.tenantId,
    ),
    // Composite index for product + date queries
    idxProductMetricsTenantProduct: index(
      'idx_product_metrics_tenant_product',
    ).on(table.tenantId, table.productId),
    idxProductMetricsTenantDate: index('idx_product_metrics_tenant_date').on(
      table.tenantId,
      table.date,
    ),
  }),
);
