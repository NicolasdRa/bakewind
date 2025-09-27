import { InferSelectModel } from 'drizzle-orm';
import { suppliers } from '../database/schemas/suppliers.schema';
import { z } from 'zod';

// Supplier response schema for API output
export const supplierResponseDataSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  contactPerson: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string(),
  address: z.string().nullable(),
  website: z.string().nullable(),
  deliveryDays: z.array(z.string()).nullable(),
  minimumOrder: z.string().nullable(),
  paymentTerms: z.string().nullable(),
  notes: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date().transform((date) => date.toISOString()),
  updatedAt: z.date().transform((date) => date.toISOString()),
});

// Supplier creation schema
export const supplierCreationSchema = z.object({
  name: z.string().min(1).max(255),
  contactPerson: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).max(50),
  address: z.string().optional(),
  website: z.string().url().optional(),
  deliveryDays: z.array(z.string()).optional(),
  minimumOrder: z
    .string()
    .refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Minimum order must be a non-negative number',
    })
    .optional(),
  paymentTerms: z.string().max(255).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Supplier update schema
export const supplierUpdateSchema = supplierCreationSchema.partial();

// Export types
export type SuppliersData = InferSelectModel<typeof suppliers>;
export type SupplierCreation = z.infer<typeof supplierCreationSchema>;
export type SupplierUpdate = z.infer<typeof supplierUpdateSchema>;
export type SupplierResponse = z.infer<typeof supplierResponseDataSchema>;
