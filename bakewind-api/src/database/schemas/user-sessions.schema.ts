import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  text,
  uuid,
  index,
} from 'drizzle-orm/pg-core';
import { usersTable } from './users.schema';

export const userSessionsTable = pgTable(
  'user_sessions',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    // User reference
    userId: uuid('user_id')
      .references(() => usersTable.id, { onDelete: 'cascade' })
      .notNull(),

    // Token management
    accessTokenHash: varchar('access_token_hash', { length: 255 }).notNull(),
    refreshTokenHash: varchar('refresh_token_hash', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at', {
      mode: 'date',
      withTimezone: true,
    }).notNull(),

    // Security tracking
    ipAddress: varchar('ip_address', { length: 45 }), // IPv6 support
    userAgent: text('user_agent'),
    dashboardRedirectUrl: varchar('dashboard_redirect_url', { length: 255 }),

    // Session management
    isRevoked: boolean('is_revoked').notNull().default(false),
    lastActivityAt: timestamp('last_activity_at', {
      mode: 'date',
      withTimezone: true,
    }).notNull().defaultNow(),

    // Audit fields
    createdAt: timestamp('created_at', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Performance indexes
    idxSessionUserId: index('idx_session_user_id').on(table.userId),
    idxSessionAccessToken: index('idx_session_access_token').on(table.accessTokenHash),
    idxSessionRefreshToken: index('idx_session_refresh_token').on(table.refreshTokenHash),
    idxSessionExpiresAt: index('idx_session_expires_at').on(table.expiresAt),
    idxSessionRevoked: index('idx_session_revoked').on(table.isRevoked),
    idxSessionLastActivity: index('idx_session_last_activity').on(table.lastActivityAt),
    idxSessionActiveUser: index('idx_session_active_user')
      .on(table.userId, table.isRevoked, table.expiresAt)
      .where(sql`${table.isRevoked} = false AND ${table.expiresAt} > NOW()`),
    idxSessionCleanup: index('idx_session_cleanup')
      .on(table.expiresAt, table.isRevoked)
      .where(sql`${table.expiresAt} < NOW() OR ${table.isRevoked} = true`),
  }),
);