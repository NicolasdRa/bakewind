import { InferSelectModel } from 'drizzle-orm';
import { customers } from '../database/schemas/customers.schema';
import { z } from 'zod';

// Customer response schema for API output
export const customerResponseDataSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string(),
  // Structured address fields
  addressLine1: z.string().nullable(),
  addressLine2: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zipCode: z.string().nullable(),
  // Customer type fields
  customerType: z.enum(['individual', 'business']),
  companyName: z.string().nullable(),
  taxId: z.string().nullable(),
  // Preferences
  preferredContact: z.enum(['email', 'phone', 'text']).nullable(),
  marketingOptIn: z.boolean(),
  // Status
  status: z.enum(['active', 'inactive']),
  notes: z.string().nullable(),
  loyaltyPoints: z.number(),
  // Computed from orders
  totalOrders: z.number(),
  totalSpent: z.number(),
  averageOrderValue: z.number(),
  lastOrderAt: z.string().nullable(),
  // Timestamps
  createdAt: z.date().transform((date) => date.toISOString()),
  updatedAt: z.date().transform((date) => date.toISOString()),
});

// Customer creation schema
export const customerCreationSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().min(1).max(50),
  // Structured address
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  // Customer type
  customerType: z.enum(['individual', 'business']).default('business'),
  companyName: z.string().max(255).optional(),
  taxId: z.string().max(50).optional(),
  // Preferences
  preferredContact: z.enum(['email', 'phone', 'text']).optional(),
  marketingOptIn: z.boolean().default(false),
  // Notes
  notes: z.string().optional(),
});

// Customer update schema
export const customerUpdateSchema = z
  .object({
    name: z.string().min(1).max(255),
    email: z.string().email().nullable(),
    phone: z.string().min(1).max(50),
    // Structured address
    addressLine1: z.string().max(255).nullable(),
    addressLine2: z.string().max(255).nullable(),
    city: z.string().max(100).nullable(),
    state: z.string().max(100).nullable(),
    zipCode: z.string().max(20).nullable(),
    // Customer type
    customerType: z.enum(['individual', 'business']),
    companyName: z.string().max(255).nullable(),
    taxId: z.string().max(50).nullable(),
    // Preferences
    preferredContact: z.enum(['email', 'phone', 'text']).nullable(),
    marketingOptIn: z.boolean(),
    // Status
    status: z.enum(['active', 'inactive']),
    // Notes
    notes: z.string().nullable(),
  })
  .partial();

// Export types
export type CustomersData = InferSelectModel<typeof customers>;
export type CustomerCreation = z.infer<typeof customerCreationSchema>;
export type CustomerUpdate = z.infer<typeof customerUpdateSchema>;
export type CustomerResponse = z.infer<typeof customerResponseDataSchema>;
