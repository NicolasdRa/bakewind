export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  HEAD_BAKER: 'HEAD_BAKER',
  BAKER: 'BAKER',
  HEAD_PASTRY_CHEF: 'HEAD_PASTRY_CHEF',
  PASTRY_CHEF: 'PASTRY_CHEF',
  CASHIER: 'CASHIER',
  CUSTOMER: 'CUSTOMER',
  GUEST: 'GUEST',
  VIEWER: 'VIEWER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_ROLES_ARRAY = Object.values(USER_ROLES);

// For Zod validation
export const userRoleValues = [
  'ADMIN',
  'MANAGER',
  'HEAD_BAKER',
  'BAKER',
  'HEAD_PASTRY_CHEF',
  'PASTRY_CHEF',
  'CASHIER',
  'CUSTOMER',
  'GUEST',
  'VIEWER',
] as const;
