import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  boolean,
  timestamp,
  json,
  index,
} from 'drizzle-orm/pg-core';
import { tenantsTable } from './tenants.schema';

export const suppliers = pgTable(
  'suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Tenant reference - which bakery owns this supplier
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenantsTable.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 255 }).notNull(),
    contactPerson: varchar('contact_person', { length: 255 }),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 50 }).notNull(),
    address: text('address'),
    website: varchar('website', { length: 500 }),
    deliveryDays: json('delivery_days').$type<string[]>(),
    minimumOrder: decimal('minimum_order', { precision: 10, scale: 2 }),
    paymentTerms: varchar('payment_terms', { length: 255 }),
    notes: text('notes'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Tenant index for filtering
    idxSupplierTenant: index('idx_supplier_tenant').on(table.tenantId),
    // Composite index for active suppliers
    idxSupplierTenantActive: index('idx_supplier_tenant_active').on(
      table.tenantId,
      table.isActive,
    ),
  }),
);
