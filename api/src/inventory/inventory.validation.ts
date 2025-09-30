import { InferSelectModel } from 'drizzle-orm';
import { inventoryItems } from '../database/schemas/inventory.schema';
import { z } from 'zod';

// Inventory unit and category values for validation
export const inventoryUnitValues = [
  'kg',
  'g',
  'l',
  'ml',
  'unit',
  'dozen',
] as const;

export const inventoryCategoryValues = [
  'ingredient',
  'packaging',
  'supplies',
] as const;

// Inventory response schema for API output
export const inventoryResponseDataSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.enum(inventoryCategoryValues),
  unit: z.enum(inventoryUnitValues),
  currentStock: z.string(),
  minimumStock: z.string(),
  reorderPoint: z.string(),
  reorderQuantity: z.string(),
  costPerUnit: z.string(),
  supplier: z.string().nullable(),
  expirationDate: z
    .date()
    .transform((date) => date.toISOString().split('T')[0])
    .nullable(),
  location: z.string().nullable(),
  lastRestocked: z
    .date()
    .transform((date) => date.toISOString())
    .nullable(),
  notes: z.string().nullable(),
  createdAt: z.date().transform((date) => date.toISOString()),
  updatedAt: z.date().transform((date) => date.toISOString()),
});

// Inventory creation schema
export const inventoryCreationSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.enum(inventoryCategoryValues),
  unit: z.enum(inventoryUnitValues),
  currentStock: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Current stock must be a non-negative number',
    }),
  minimumStock: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Minimum stock must be a non-negative number',
    }),
  reorderPoint: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Reorder point must be a non-negative number',
    }),
  reorderQuantity: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Reorder quantity must be a positive number',
    }),
  costPerUnit: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Cost per unit must be a positive number',
    }),
  supplier: z.string().max(255).optional(),
  expirationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  location: z.string().max(255).optional(),
  notes: z.string().optional(),
});

// Inventory update schema
export const inventoryUpdateSchema = inventoryCreationSchema.partial();

// Update stock schema
export const updateStockSchema = z.object({
  currentStock: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Current stock must be a non-negative number',
    }),
  lastRestocked: z.date().optional(),
  notes: z.string().optional(),
});

// Export types
export type InventoryData = InferSelectModel<typeof inventoryItems>;
export type InventoryCreation = z.infer<typeof inventoryCreationSchema>;
export type InventoryUpdate = z.infer<typeof inventoryUpdateSchema>;
export type UpdateStock = z.infer<typeof updateStockSchema>;
export type InventoryResponse = z.infer<typeof inventoryResponseDataSchema>;
