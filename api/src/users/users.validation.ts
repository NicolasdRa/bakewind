import { InferSelectModel } from 'drizzle-orm';
import { usersTable } from '../database/schemas/users.schema';
import { z } from 'zod';
import { userRoleValues } from '../common/constants/roles.constants';

// User response schema for API output
export const userResponseDataSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  role: z.enum(userRoleValues),
  profilePictureUrl: z.string().nullable(),
  isActive: z.boolean(),
  isEmailVerified: z.boolean(),
  gender: z.string().nullable(),
  bio: z.string().nullable(),
  country: z.string().nullable(),
  city: z.string().nullable(),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9][\d\s\-()]{6,18}$/, 'Invalid phone number format')
    .nullable()
    .optional(),

  // Transform Date objects to appropriate string formats for API output
  dateOfBirth: z
    .date()
    .nullable()
    .transform((date) => (date ? date.toISOString().split('T')[0] : null)),
  createdAt: z.date().transform((date) => date.toISOString()),
  updatedAt: z.date().transform((date) => date.toISOString()),
  deletedAt: z
    .date()
    .nullable()
    .transform((date) => (date ? date.toISOString() : null)),
  lastLoginAt: z
    .date()
    .nullable()
    .transform((date) => (date ? date.toISOString() : null)),
  lastLogoutAt: z
    .date()
    .nullable()
    .transform((date) => (date ? date.toISOString() : null)),
  refreshTokenExpiresAt: z
    .date()
    .nullable()
    .transform((date) => (date ? date.toISOString() : null)),
  passwordResetExpires: z
    .date()
    .nullable()
    .transform((date) => (date ? date.toISOString() : null)),
});

// User registration schema
export const userRegistrationSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    email: z.string().email('Invalid email format').max(320),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one lowercase, uppercase letter and one number',
      ),
    confirmPassword: z.string(),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^\+?[1-9][\d\s\-()]{6,18}$/, 'Invalid phone number format')
      .nullable()
      .optional(),
    bio: z.string().max(1000).nullable().optional(),
    role: z.enum(userRoleValues).default('GUEST'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// User login schema
export const userLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  sessionContext: z
    .object({
      deviceFingerprint: z.string().optional(),
      userAgent: z.string().optional(),
      country: z.string().optional(),
      region: z.string().optional(),
      city: z.string().optional(),
      timezone: z.string().optional(),
      deviceType: z.string().optional(),
      browser: z.string().optional(),
      operatingSystem: z.string().optional(),
    })
    .optional(),
});

// User update schema
export const userUpdateSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    bio: z.string().max(1000).nullable(),
    profilePictureUrl: z.string().url().max(500).nullable(),
    phoneNumber: z
      .string()
      .regex(/^\+?[0-9][\d\s\-()]{6,18}$/, 'Invalid phone number format')
      .nullable()
      .optional(),
    gender: z.string().max(20).nullable(),
    dateOfBirth: z
      .union([
        z
          .string()
          .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
        z.date(),
      ])
      .transform((val) => {
        if (val instanceof Date) return val;
        return new Date(val);
      })
      .nullable()
      .optional(),
    country: z.string().max(100).nullable(),
    city: z.string().max(100).nullable(),
    role: z.enum(userRoleValues),
    isActive: z.boolean(),
  })
  .partial();

// Password change schema
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one lowercase, uppercase letter and one number',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Export types
export type UsersData = InferSelectModel<typeof usersTable>;
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserResponse = z.infer<typeof userResponseDataSchema>;
export type PasswordChange = z.infer<typeof passwordChangeSchema>;
