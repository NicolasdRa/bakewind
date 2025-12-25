import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  integer,
  uuid,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { subscriptionPlansTable } from './subscription-plans.schema';

export const businessSizeEnum = pgEnum('business_size', [
  '1',
  '2-3',
  '4-10',
  '10+',
]);

export const tenantSubscriptionStatusEnum = pgEnum('tenant_subscription_status', [
  'trial',
  'active',
  'past_due',
  'canceled',
  'incomplete',
]);

export const tenantsTable = pgTable(
  'tenants',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    // Owner reference (the OWNER user who created this tenant)
    ownerUserId: uuid('owner_user_id').notNull().unique(),

    // Business info
    businessName: varchar('business_name', { length: 255 }).notNull(),
    businessPhone: varchar('business_phone', { length: 20 }),
    businessAddress: varchar('business_address', { length: 500 }),

    // Stripe/billing
    stripeAccountId: varchar('stripe_account_id', { length: 100 }),
    subscriptionPlanId: uuid('subscription_plan_id').references(
      () => subscriptionPlansTable.id,
      { onDelete: 'set null' },
    ),
    subscriptionStatus: tenantSubscriptionStatusEnum('subscription_status')
      .notNull()
      .default('trial'),

    // Trial tracking (merged from trial_accounts)
    signupSource: varchar('signup_source', { length: 100 }),
    businessSize: businessSizeEnum('business_size'),
    trialLengthDays: integer('trial_length_days').notNull().default(14),
    trialEndsAt: timestamp('trial_ends_at', {
      mode: 'date',
      withTimezone: true,
    }),
    onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
    sampleDataLoaded: boolean('sample_data_loaded').notNull().default(false),
    conversionRemindersSent: integer('conversion_reminders_sent')
      .notNull()
      .default(0),
    convertedAt: timestamp('converted_at', {
      mode: 'date',
      withTimezone: true,
    }),
    cancellationReason: varchar('cancellation_reason', { length: 255 }),

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
    // Performance indexes
    idxTenantOwner: index('idx_tenant_owner').on(table.ownerUserId),
    idxTenantBusinessName: index('idx_tenant_business_name').on(table.businessName),
    idxTenantSubscriptionStatus: index('idx_tenant_subscription_status').on(
      table.subscriptionStatus,
    ),
    idxTenantSubscriptionPlan: index('idx_tenant_subscription_plan').on(
      table.subscriptionPlanId,
    ),
    idxTenantTrialEndsAt: index('idx_tenant_trial_ends_at').on(table.trialEndsAt),
    idxTenantOnboarding: index('idx_tenant_onboarding').on(table.onboardingCompleted),
    idxTenantSignupSource: index('idx_tenant_signup_source').on(table.signupSource),
    idxTenantBusinessSize: index('idx_tenant_business_size').on(table.businessSize),
    idxTenantStripeAccount: index('idx_tenant_stripe_account').on(table.stripeAccountId),
    idxTenantActive: index('idx_tenant_active')
      .on(table.deletedAt)
      .where(sql`${table.deletedAt} IS NULL`),
    idxTenantTrialActive: index('idx_tenant_trial_active')
      .on(table.subscriptionStatus, table.trialEndsAt)
      .where(sql`${table.subscriptionStatus} = 'trial'`),
  }),
);
