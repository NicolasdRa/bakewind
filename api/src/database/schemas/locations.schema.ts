import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  index,
  boolean,
  text,
} from 'drizzle-orm/pg-core';
import { usersTable } from './users.schema';
import { tenantsTable } from './tenants.schema';

export const locationsTable = pgTable(
  'locations',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    // Tenant reference - which bakery owns this location
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenantsTable.id, { onDelete: 'cascade' }),

    // Basic information
    name: varchar({ length: 200 }).notNull(),
    address: varchar({ length: 500 }).notNull(),
    city: varchar({ length: 100 }).notNull(),
    state: varchar({ length: 100 }),
    country: varchar({ length: 100 }).notNull(),
    postalCode: varchar({ length: 20 }),
    timezone: varchar({ length: 100 }).notNull().default('UTC'),

    // Contact
    phoneNumber: varchar({ length: 20 }),
    email: varchar({ length: 320 }),

    // Status
    isActive: boolean().notNull().default(true),

    // Additional info
    description: text(),

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
    deletedAt: timestamp('deleted_at', {
      mode: 'date',
      withTimezone: true,
    }),
  },
  (table) => ({
    // Tenant index for filtering
    idxLocationTenant: index('idx_location_tenant').on(table.tenantId),
    // Performance indexes
    idxLocationName: index('idx_location_name').on(table.name),
    idxLocationCity: index('idx_location_city').on(table.city),
    idxLocationActive: index('idx_location_active').on(table.isActive),
    idxLocationTenantActive: index('idx_location_tenant_active').on(
      table.tenantId,
      table.isActive,
    ),
    idxLocationNotDeleted: index('idx_location_not_deleted')
      .on(table.deletedAt)
      .where(sql`${table.deletedAt} IS NULL`),
  }),
);

// Junction table for user-location relationships
export const userLocationsTable = pgTable(
  'user_locations',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),

    locationId: uuid('location_id')
      .notNull()
      .references(() => locationsTable.id, { onDelete: 'cascade' }),

    // Status
    isDefault: boolean().notNull().default(false),

    // Audit fields
    createdAt: timestamp('created_at', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Unique constraint to prevent duplicate assignments
    idxUserLocationMapping: index('idx_user_location_mapping').on(
      table.userId,
      table.locationId,
    ),
    idxUserDefaultLocationMapping: index(
      'idx_user_default_location_mapping',
    ).on(table.userId, table.isDefault),
  }),
);
