import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { usersTable } from './users.schema';

// Customer type enum
export const customerTypeEnum = pgEnum('customer_type', [
  'individual',
  'business',
]);

// Customer status enum
export const customerStatusEnum = pgEnum('customer_status', [
  'active',
  'inactive',
]);

// Preferred contact method enum
export const preferredContactEnum = pgEnum('preferred_contact', [
  'email',
  'phone',
  'text',
]);

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenancy: which bakery user owns this customer
    userId: uuid('user_id')
      .references(() => usersTable.id, { onDelete: 'cascade' })
      .notNull(),

    // Core contact info
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 50 }).notNull(),

    // Structured address fields
    addressLine1: text('address_line_1'),
    addressLine2: text('address_line_2'),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    zipCode: varchar('zip_code', { length: 20 }),

    // Customer type (B2B vs individual)
    customerType: customerTypeEnum('customer_type').default('business').notNull(),
    companyName: varchar('company_name', { length: 255 }),
    taxId: varchar('tax_id', { length: 50 }),

    // Communication preferences
    preferredContact: preferredContactEnum('preferred_contact'),
    marketingOptIn: boolean('marketing_opt_in').default(false).notNull(),

    // Status
    status: customerStatusEnum('status').default('active').notNull(),

    // Notes
    notes: text('notes'),

    // Loyalty
    loyaltyPoints: integer('loyalty_points').default(0).notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Performance indexes
    idxCustomerUserId: index('idx_customer_user_id').on(table.userId),
    idxCustomerStatus: index('idx_customer_status').on(table.status),
    idxCustomerType: index('idx_customer_type').on(table.customerType),
    idxCustomerName: index('idx_customer_name').on(table.name),
    idxCustomerEmail: index('idx_customer_email').on(table.email),
  }),
);
