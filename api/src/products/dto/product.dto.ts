import { z } from 'zod';

// Product category and status values
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

export type ProductCategory = (typeof productCategoryValues)[number];
export type ProductStatus = (typeof productStatusValues)[number];

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

// Create Product Schema
export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.enum(productCategoryValues),
  status: z.enum(productStatusValues).default('active'),
  basePrice: z.number().positive(),
  costOfGoods: z.number().nonnegative().optional(),
  // margin is calculated dynamically, not input
  recipeId: z.string().uuid({ message: 'Recipe is required for all products' }),
  recipeName: z.string().max(255).optional(),
  estimatedPrepTime: z.number().int().nonnegative().optional(),
  allergens: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
  nutritionalInfo: nutritionalInfoSchema,
  availableSeasons: z.array(z.string()).optional(),
  minimumOrderQuantity: z.number().int().min(1).default(1),
  storageInstructions: z.string().optional(),
  shelfLife: z.number().int().nonnegative().optional(),
  customizable: z.boolean().default(false),
  customizationOptions: z.array(customizationOptionSchema).optional(),
});

// Update Product Schema (all fields optional)
export const updateProductSchema = createProductSchema.partial();

// DTO Types
export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;

// Response DTO with calculated fields
export interface ProductDto {
  id: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  status: ProductStatus;
  basePrice: number;
  costOfGoods: number | null;
  // Calculated fields
  margin: number | null; // (basePrice - costOfGoods) / basePrice * 100
  markup: number | null; // (basePrice - costOfGoods) / costOfGoods * 100
  profit: number | null; // basePrice - costOfGoods
  marginWarning: boolean; // true if margin < threshold
  // End calculated fields
  recipeId: string | null;
  recipeName: string | null;
  estimatedPrepTime: number | null;
  allergens: string[] | null;
  tags: string[] | null;
  imageUrl: string | null;
  nutritionalInfo: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    sugar?: number;
    sodium?: number;
  } | null;
  availableSeasons: string[] | null;
  minimumOrderQuantity: number;
  storageInstructions: string | null;
  shelfLife: number | null;
  customizable: boolean;
  customizationOptions:
    | {
        name: string;
        type: 'text' | 'select' | 'checkbox';
        options?: string[];
        priceAdjustment?: number;
        required?: boolean;
      }[]
    | null;
  popularityScore: number;
  createdAt: string;
  updatedAt: string;
}
