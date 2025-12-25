import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  text,
  pgEnum,
  uuid,
  index,
} from 'drizzle-orm/pg-core';

// Simplified role enum for Class Table Inheritance pattern
export const userRoleEnum = pgEnum('user_role', [
  'ADMIN',    // System administrator - full access to all tenants
  'OWNER',    // Bakery business owner - manages their own tenant
  'STAFF',    // Bakery employee - works within a tenant
  'CUSTOMER', // End customer - optional portal access
]);

export const usersTable = pgTable(
  'users',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    // Personal information
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),

    // Authentication
    password: varchar('password', { length: 255 }).notNull(),
    email: varchar('email', { length: 320 }).notNull().unique(),

    // Authorization and status
    role: userRoleEnum('role').notNull().default('CUSTOMER'),
    isActive: boolean('is_active').notNull().default(true),
    isEmailVerified: boolean('is_email_verified').notNull().default(false),

    // Optional personal details (kept for profile)
    gender: varchar('gender', { length: 20 }),
    dateOfBirth: timestamp('date_of_birth', { mode: 'date' }),
    bio: text('bio'),
    profilePictureUrl: varchar('profile_picture_url', { length: 500 }),
    phoneNumber: varchar('phone_number', { length: 20 }),
    country: varchar('country', { length: 100 }),
    city: varchar('city', { length: 100 }),

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

    // Security fields
    lastLoginAt: timestamp('last_login_at', {
      mode: 'date',
      withTimezone: true,
    }),
    lastLogoutAt: timestamp('last_logout_at', {
      mode: 'date',
      withTimezone: true,
    }),
    refreshToken: varchar('refresh_token', { length: 500 }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      mode: 'date',
      withTimezone: true,
    }),
    emailVerificationToken: varchar('email_verification_token', {
      length: 255,
    }),
    passwordResetToken: varchar('password_reset_token', { length: 255 }),
    passwordResetExpires: timestamp('password_reset_expires', {
      mode: 'date',
      withTimezone: true,
    }),
  },
  (table) => ({
    // Performance indexes
    idxUserEmail: index('idx_user_email').on(table.email),
    idxUserEmailVerified: index('idx_user_email_verified').on(
      table.isEmailVerified,
    ),
    idxUserRole: index('idx_user_role').on(table.role),
    idxUserActiveRole: index('idx_user_active_role').on(
      table.isActive,
      table.role,
    ),
    idxUserRefreshToken: index('idx_user_refresh_token').on(table.refreshToken),
    idxUserRefreshExpiry: index('idx_user_refresh_expiry').on(
      table.refreshTokenExpiresAt,
    ),
    idxUserLastLogin: index('idx_user_last_login').on(table.lastLoginAt),
    idxUserPasswordResetToken: index('idx_user_password_reset_token').on(
      table.passwordResetToken,
    ),
    idxUserPasswordResetExpiry: index('idx_user_password_reset_expiry').on(
      table.passwordResetExpires,
    ),
    idxUserEmailVerificationToken: index(
      'idx_user_email_verification_token',
    ).on(table.emailVerificationToken),
    idxUserName: index('idx_user_name').on(table.firstName, table.lastName),
    idxUserLocation: index('idx_user_location').on(table.country, table.city),
    idxUserNotDeleted: index('idx_user_not_deleted')
      .on(table.deletedAt)
      .where(sql`${table.deletedAt} IS NULL`),
    idxUserActiveVerified: index('idx_user_active_verified')
      .on(table.isActive, table.isEmailVerified)
      .where(sql`${table.isActive} = true AND ${table.isEmailVerified} = true`),
  }),
);
