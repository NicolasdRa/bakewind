import { z } from 'zod';
import { userRoleValues } from '../common/constants/roles.constants';

/**
 * JWT payload validation schema
 */
export const jwtPayloadSchema = z.object({
  sub: z.string().uuid('Invalid user ID format'),
  email: z.string().email('Invalid email format'),
  role: z.enum(userRoleValues),
  type: z.enum(['access', 'refresh']).optional(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

/**
 * Auth result validation schema with refresh token
 */
export const authResultSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().min(1, 'Refresh token is required'),
  expiresIn: z.number().positive('Expires in must be positive'),
  user: z.object({
    id: z.string().uuid('Invalid user ID format'),
    email: z.string().email('Invalid email format'),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    role: z.enum(userRoleValues),
  }),
});

/**
 * Refresh token request validation schema
 */
export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * User data with password schema (for internal auth operations)
 */
export const userDataWithPasswordSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(userRoleValues),
  password: z.string().min(1, 'Password is required'),
  refreshToken: z.string().nullable().optional(),
  refreshTokenExpiresAt: z.date().nullable().optional(),
});

// Export types
export type JwtPayload = z.infer<typeof jwtPayloadSchema>;
export type AuthResult = z.infer<typeof authResultSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;
export type UserDataWithPassword = z.infer<typeof userDataWithPasswordSchema>;
