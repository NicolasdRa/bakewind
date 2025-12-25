/**
 * User roles for the BakeWind platform
 *
 * Class Table Inheritance pattern:
 * - ADMIN: System administrator with full access to all tenants
 * - OWNER: Bakery business owner, manages their own tenant
 * - STAFF: Bakery employee, works within a specific tenant (has staff profile)
 * - CUSTOMER: End customer with optional portal access (has customer profile)
 */
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  OWNER: 'OWNER',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_ROLES_ARRAY = Object.values(USER_ROLES);

// For Zod validation - array format for use with z.enum()
export const userRoleValues = [
  'ADMIN',
  'OWNER',
  'STAFF',
  'CUSTOMER',
] as const;
