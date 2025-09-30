import { z } from 'zod';
import { InferSelectModel } from 'drizzle-orm';
import {
  locationsTable,
  userLocationsTable,
} from '../database/schemas/locations.schema';

// Base location schema for creation
export const createLocationSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  country: z.string().min(1).max(100),
  postalCode: z.string().max(20).optional(),
  timezone: z.string().min(1).max(100).default('UTC'),
  phoneNumber: z
    .string()
    .max(20)
    .regex(/^[\d\s\-+()]+$/, 'Invalid phone number format')
    .optional(),
  email: z.string().email().max(320).optional(),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
});

// Schema for updating location (all fields optional except id)
export const updateLocationSchema = createLocationSchema.partial();

// Schema for location response data with transformations
export const locationResponseDataSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string().nullable(),
  country: z.string(),
  postalCode: z.string().nullable(),
  timezone: z.string(),
  phoneNumber: z.string().nullable(),
  email: z.string().nullable(),
  isActive: z.boolean(),
  description: z.string().nullable(),
  createdAt: z.date().transform((date) => date.toISOString()),
  updatedAt: z.date().transform((date) => date.toISOString()),
  deletedAt: z
    .date()
    .nullable()
    .transform((date) => (date ? date.toISOString() : null)),
});

// Schema for user-location assignment
export const assignUserToLocationSchema = z.object({
  userId: z.string().uuid(),
  locationId: z.string().uuid(),
  isDefault: z.boolean().default(false),
});

// Schema for updating user-location relationship
export const updateUserLocationSchema = z.object({
  isDefault: z.boolean(),
});

// Schema for user location response
export const userLocationResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  locationId: z.string().uuid(),
  isDefault: z.boolean(),
  location: locationResponseDataSchema.optional(),
  createdAt: z.date().transform((date) => date.toISOString()),
});

// Query parameter schemas
export const locationQuerySchema = z.object({
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
});

// Type exports
export type CreateLocationDto = z.infer<typeof createLocationSchema>;
export type UpdateLocationDto = z.infer<typeof updateLocationSchema>;
export type LocationResponseData = z.infer<typeof locationResponseDataSchema>;
export type AssignUserToLocationDto = z.infer<
  typeof assignUserToLocationSchema
>;
export type UpdateUserLocationDto = z.infer<typeof updateUserLocationSchema>;
export type UserLocationResponse = z.infer<typeof userLocationResponseSchema>;
export type LocationQueryParams = z.infer<typeof locationQuerySchema>;
export type LocationEntity = InferSelectModel<typeof locationsTable>;
export type UserLocationEntity = InferSelectModel<typeof userLocationsTable>;
