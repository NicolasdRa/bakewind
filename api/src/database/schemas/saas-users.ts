import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  uuid,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { subscriptionPlansTable } from './subscription-plans.schema';
import { trialAccountsTable } from './trial-accounts.schema';

export const saasUserRoleEnum = pgEnum('saas_user_role', [
  'owner',
  'admin',
  'user',
]);

export const saasUsersTable = pgTable(
  'saas_users',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    // Authentication
    email: varchar('email', { length: 320 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),

    // Company information
    companyName: varchar('company_name', { length: 100 }).notNull(),
    companyPhone: varchar('company_phone', { length: 20 }),
    companyAddress: varchar('company_address', { length: 500 }),

    // Authorization
    role: saasUserRoleEnum('role').notNull().default('owner'),

    // SaaS relationships
    subscriptionPlanId: uuid('subscription_plan_id')
      .references(() => subscriptionPlansTable.id, { onDelete: 'set null' }),
    trialAccountId: uuid('trial_account_id')
      .references(() => trialAccountsTable.id, { onDelete: 'set null' }),

    // Stripe integration
    stripeCustomerId: varchar('stripe_customer_id', { length: 100 }),

    // Status flags
    emailVerified: boolean('email_verified').notNull().default(false),
    onboardingCompleted: boolean('onboarding_completed').notNull().default(false),

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
    lastLoginAt: timestamp('last_login_at', {
      mode: 'date',
      withTimezone: true,
    }),
    deletedAt: timestamp('deleted_at', {
      mode: 'date',
      withTimezone: true,
    }),
  },
  (table) => ({
    // Performance indexes
    idxSaasUserEmail: index('idx_saas_user_email').on(table.email),
    idxSaasUserStripeCustomer: index('idx_saas_user_stripe_customer').on(table.stripeCustomerId),
    idxSaasUserDeleted: index('idx_saas_user_deleted').on(table.deletedAt),
    idxSaasUserRole: index('idx_saas_user_role').on(table.role),
    idxSaasUserEmailVerified: index('idx_saas_user_email_verified').on(table.emailVerified),
    idxSaasUserOnboarding: index('idx_saas_user_onboarding').on(table.onboardingCompleted),
    idxSaasUserSubscriptionPlan: index('idx_saas_user_subscription_plan').on(table.subscriptionPlanId),
    idxSaasUserTrialAccount: index('idx_saas_user_trial_account').on(table.trialAccountId),
    idxSaasUserCompanyName: index('idx_saas_user_company_name').on(table.companyName),
    idxSaasUserActive: index('idx_saas_user_active')
      .on(table.deletedAt, table.emailVerified)
      .where(sql`${table.deletedAt} IS NULL AND ${table.emailVerified} = true`),
  }),
);