import { InferSelectModel } from 'drizzle-orm';
import { customers } from '../database/schemas/customers.schema';
import { z } from 'zod';

// Customer response schema for API output
export const customerResponseDataSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
  totalOrders: z.number(),
  totalSpent: z.string(),
  createdAt: z.date().transform((date) => date.toISOString()),
  updatedAt: z.date().transform((date) => date.toISOString()),
});

// Customer creation schema
export const customerCreationSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().min(1).max(50),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// Customer update schema
export const customerUpdateSchema = z
  .object({
    name: z.string().min(1).max(255),
    email: z.string().email().nullable(),
    phone: z.string().min(1).max(50),
    address: z.string().nullable(),
    notes: z.string().nullable(),
  })
  .partial();

// Export types
export type CustomersData = InferSelectModel<typeof customers>;
export type CustomerCreation = z.infer<typeof customerCreationSchema>;
export type CustomerUpdate = z.infer<typeof customerUpdateSchema>;
export type CustomerResponse = z.infer<typeof customerResponseDataSchema>;
