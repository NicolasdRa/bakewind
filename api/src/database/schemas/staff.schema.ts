import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  index,
  json,
  date,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { usersTable } from './users.schema';
import { tenantsTable } from './tenants.schema';

export const staffAreaEnum = pgEnum('staff_area', [
  'cafe',
  'restaurant',
  'front_house',
  'catering',
  'retail',
  'events',
  'management',
  'bakery',
  'patisserie',
]);

export const staffTable = pgTable(
  'staff',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    // User reference (the user account for this staff member)
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => usersTable.id, { onDelete: 'cascade' }),

    // Tenant reference (which bakery business they work for)
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenantsTable.id, { onDelete: 'cascade' }),

    // Staff details
    position: varchar('position', { length: 100 }),
    department: varchar('department', { length: 100 }),
    areas: json('areas').$type<string[]>().notNull().default([]),
    permissions: json('permissions').$type<Record<string, boolean>>().default({}),
    hireDate: date('hire_date', { mode: 'date' }),

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
    idxStaffUser: index('idx_staff_user').on(table.userId),
    idxStaffTenant: index('idx_staff_tenant').on(table.tenantId),
    idxStaffPosition: index('idx_staff_position').on(table.position),
    idxStaffDepartment: index('idx_staff_department').on(table.department),
    idxStaffHireDate: index('idx_staff_hire_date').on(table.hireDate),
    idxStaffTenantPosition: index('idx_staff_tenant_position').on(
      table.tenantId,
      table.position,
    ),
  }),
);
