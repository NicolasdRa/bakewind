import { InferSelectModel } from 'drizzle-orm';
import { products } from '../database/schemas/products.schema';
import { z } from 'zod';

// Product category and status values for validation
export const productCategoryValues = [
  'bread',
  'pastry',
  'cake',
  'cookie',
  'sandwich',
  'beverage',
  'seasonal',
  'custom',
] as const;

export const productStatusValues = [
  'active',
  'inactive',
  'seasonal',
  'discontinued',
] as const;

// Product response schema for API output
export const productResponseDataSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.enum(productCategoryValues),
  status: z.enum(productStatusValues),
  basePrice: z.string(),
  costOfGoods: z.string().nullable(),
  margin: z.string().nullable(),
  recipeId: z.string().uuid().nullable(),
  estimatedPrepTime: z.number().nullable(),
  allergens: z.array(z.string()).nullable(),
  tags: z.array(z.string()).nullable(),
  nutritionalInfo: z
    .object({
      calories: z.number().optional(),
      protein: z.number().optional(),
      carbs: z.number().optional(),
      fat: z.number().optional(),
      sugar: z.number().optional(),
      sodium: z.number().optional(),
    })
    .nullable(),
  availableSeasons: z.array(z.string()).nullable(),
  minimumOrderQuantity: z.number(),
  storageInstructions: z.string().nullable(),
  shelfLife: z.number().nullable(),
  customizable: z.boolean(),
  customizationOptions: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(['text', 'select', 'checkbox']),
        options: z.array(z.string()).optional(),
        priceAdjustment: z.number().optional(),
        required: z.boolean().optional(),
      }),
    )
    .nullable(),
  popularityScore: z.number(),
  createdAt: z.date().transform((date) => date.toISOString()),
  updatedAt: z.date().transform((date) => date.toISOString()),
});

// Nutritional info schema
const nutritionalInfoSchema = z
  .object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
    sugar: z.number().optional(),
    sodium: z.number().optional(),
  })
  .optional();

// Customization option schema
const customizationOptionSchema = z.object({
  name: z.string(),
  type: z.enum(['text', 'select', 'checkbox']),
  options: z.array(z.string()).optional(),
  priceAdjustment: z.number().optional(),
  required: z.boolean().optional(),
});

// Product creation schema
export const productCreationSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.enum(productCategoryValues),
  status: z.enum(productStatusValues).default('active'),
  basePrice: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Base price must be a positive number',
    }),
  costOfGoods: z
    .string()
    .refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Cost of goods must be a non-negative number',
    })
    .optional(),
  margin: z
    .string()
    .refine(
      (val) =>
        val === '' ||
        (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100),
      {
        message: 'Margin must be between 0 and 100',
      },
    )
    .optional(),
  recipeId: z.string().uuid().optional(),
  estimatedPrepTime: z.number().int().min(0).optional(),
  allergens: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  nutritionalInfo: nutritionalInfoSchema,
  availableSeasons: z.array(z.string()).optional(),
  minimumOrderQuantity: z.number().int().min(1).default(1),
  storageInstructions: z.string().optional(),
  shelfLife: z.number().int().min(0).optional(),
  customizable: z.boolean().default(false),
  customizationOptions: z.array(customizationOptionSchema).optional(),
  popularityScore: z.number().int().min(0).default(0),
});

// Product update schema
export const productUpdateSchema = productCreationSchema.partial();

// Export types
export type ProductsData = InferSelectModel<typeof products>;
export type ProductCreation = z.infer<typeof productCreationSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;
export type ProductResponse = z.infer<typeof productResponseDataSchema>;
