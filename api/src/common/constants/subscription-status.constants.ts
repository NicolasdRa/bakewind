export const SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  INCOMPLETE: 'incomplete',
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export const SUBSCRIPTION_STATUS_ARRAY = Object.values(SUBSCRIPTION_STATUS);

// For Zod validation - array format for use with z.enum()
export const subscriptionStatusValues = [
  'trial',
  'active',
  'past_due',
  'canceled',
  'incomplete',
] as const;
