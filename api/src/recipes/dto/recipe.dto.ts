import { z } from 'zod';

// Recipe categories
export const recipeCategoryValues = [
  'bread',
  'pastry',
  'cake',
  'cookie',
  'sandwich',
  'beverage',
  'sauce',
  'filling',
  'topping',
  'other',
] as const;

export type RecipeCategory = (typeof recipeCategoryValues)[number];

// Ingredient schema for recipe
const recipeIngredientSchema = z.object({
  ingredientId: z.string().uuid(),
  ingredientName: z.string().min(1).max(255),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(20),
  cost: z.number().nonnegative().optional(),
  notes: z.string().optional(),
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

// Create Recipe Schema
export const createRecipeSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.enum(recipeCategoryValues),
  description: z.string().optional(),
  prepTime: z.number().int().nonnegative(),
  cookTime: z.number().int().nonnegative(),
  yield: z.number().int().positive(),
  yieldUnit: z.string().min(1).max(50),
  sellingPrice: z.number().positive().optional(),
  productId: z.string().uuid().optional(),
  productName: z.string().max(255).optional(),
  instructions: z.array(z.string()).min(1),
  ingredients: z.array(recipeIngredientSchema).min(1),
  nutritionalInfo: nutritionalInfoSchema,
  allergens: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

// Update Recipe Schema (all fields optional except ingredients if provided)
export const updateRecipeSchema = createRecipeSchema.partial().extend({
  ingredients: z.array(recipeIngredientSchema).optional(),
});

// DTO Types
export type CreateRecipeDto = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeDto = z.infer<typeof updateRecipeSchema>;
export type RecipeIngredient = z.infer<typeof recipeIngredientSchema>;

// Response DTO with calculated fields
export interface RecipeDto {
  id: string;
  name: string;
  category: RecipeCategory;
  description: string | null;
  prepTime: number;
  cookTime: number;
  totalTime: number; // prepTime + cookTime
  yield: number;
  yieldUnit: string;
  // Cost calculations (Layer 1: Recipe-level costing)
  totalIngredientCost: number; // Sum of all ingredient costs
  costPerUnit: number | null; // totalIngredientCost / yield
  sellingPrice: number | null;
  margin: number | null; // (sellingPrice - costPerUnit) / sellingPrice * 100
  markup: number | null; // (sellingPrice - costPerUnit) / costPerUnit * 100
  profit: number | null; // sellingPrice - costPerUnit
  marginWarning: boolean; // true if margin < 20%
  // End calculated fields
  productId: string | null;
  productName: string | null;
  instructions: string[];
  ingredients: RecipeIngredientWithDetails[];
  nutritionalInfo: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    sugar?: number;
    sodium?: number;
  } | null;
  allergens: string[] | null;
  tags: string[] | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Ingredient with additional details
export interface RecipeIngredientWithDetails {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  cost: number | null;
  notes: string | null;
}
