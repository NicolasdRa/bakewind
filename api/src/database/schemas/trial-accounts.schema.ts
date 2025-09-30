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
import { usersTable } from './users.schema';
import { subscriptionPlansTable } from './subscription-plans.schema';

export const businessSizeEnum = pgEnum('business_size', [
  '1',
  '2-3',
  '4-10',
  '10+',
]);

export const trialAccountsTable = pgTable(
  'trial_accounts',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    // User reference
    userId: uuid('user_id')
      .references(() => usersTable.id, { onDelete: 'cascade' })
      .notNull(),

    // Trial tracking
    signupSource: varchar('signup_source', { length: 100 }).notNull(),
    businessSize: businessSizeEnum('business_size').notNull(),
    trialLengthDays: integer('trial_length_days').notNull().default(14),

    // Onboarding
    onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
    sampleDataLoaded: boolean('sample_data_loaded').notNull().default(false),

    // Conversion tracking
    conversionRemindersSent: integer('conversion_reminders_sent').notNull().default(0),
    convertedAt: timestamp('converted_at', {
      mode: 'date',
      withTimezone: true,
    }),
    convertedToPlanId: uuid('converted_to_plan_id')
      .references(() => subscriptionPlansTable.id),
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
  },
  (table) => ({
    // Performance indexes
    idxTrialUserId: index('idx_trial_user_id').on(table.userId),
    idxTrialSignupSource: index('idx_trial_signup_source').on(table.signupSource),
    idxTrialBusinessSize: index('idx_trial_business_size').on(table.businessSize),
    idxTrialOnboarding: index('idx_trial_onboarding').on(table.onboardingCompleted),
    idxTrialConverted: index('idx_trial_converted').on(table.convertedAt),
    idxTrialConvertedPlan: index('idx_trial_converted_plan').on(table.convertedToPlanId),
    idxTrialCreated: index('idx_trial_created').on(table.createdAt),
    idxTrialActiveOnboarding: index('idx_trial_active_onboarding')
      .on(table.onboardingCompleted, table.sampleDataLoaded),
  }),
);