import { InferSelectModel } from 'drizzle-orm';
import { recipes, recipeIngredients } from '../database/schemas/recipes.schema';
import { z } from 'zod';

// Recipe response schema for API output
export const recipeResponseDataSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  description: z.string().nullable(),
  prepTime: z.number(),
  cookTime: z.number(),
  yield: z.number(),
  yieldUnit: z.string(),
  costPerUnit: z.string().nullable(),
  sellingPrice: z.string().nullable(),
  margin: z.string().nullable(),
  productId: z.string().uuid().nullable(),
  productName: z.string().nullable(),
  instructions: z.array(z.string()),
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
  allergens: z.array(z.string()).nullable(),
  tags: z.array(z.string()).nullable(),
  imageUrl: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date().transform((date) => date.toISOString()),
  updatedAt: z.date().transform((date) => date.toISOString()),
});

export const recipeIngredientResponseDataSchema = z.object({
  id: z.string().uuid(),
  recipeId: z.string().uuid(),
  ingredientId: z.string().uuid(),
  ingredientName: z.string(),
  quantity: z.string(),
  unit: z.string(),
  cost: z.string().nullable(),
  notes: z.string().nullable(),
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

// Recipe ingredient schema
const recipeIngredientSchema = z.object({
  ingredientId: z.string().uuid(),
  ingredientName: z.string().min(1).max(255),
  quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Quantity must be a positive number',
  }),
  unit: z.string().min(1).max(20),
  cost: z
    .string()
    .refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Cost must be a non-negative number',
    })
    .optional(),
  notes: z.string().optional(),
});

// Recipe creation schema
export const recipeCreationSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  description: z.string().optional(),
  prepTime: z.number().int().min(0),
  cookTime: z.number().int().min(0),
  yield: z.number().int().min(1),
  yieldUnit: z.string().min(1).max(50),
  costPerUnit: z
    .string()
    .refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Cost per unit must be a non-negative number',
    })
    .optional(),
  sellingPrice: z
    .string()
    .refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Selling price must be a non-negative number',
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
  productId: z.string().uuid().optional(),
  productName: z.string().max(255).optional(),
  instructions: z.array(z.string().min(1)),
  nutritionalInfo: nutritionalInfoSchema,
  allergens: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

// Recipe ingredient creation schema
export const recipeIngredientCreationSchema = recipeIngredientSchema;

// Create recipe with ingredients schema
export const createRecipeWithIngredientsSchema = z.object({
  recipe: recipeCreationSchema,
  ingredients: z.array(recipeIngredientSchema).min(1),
});

// Recipe update schema
export const recipeUpdateSchema = recipeCreationSchema.partial();

// Scale recipe schema
export const scaleRecipeSchema = z.object({
  recipeId: z.string().uuid(),
  targetQuantity: z.number().min(1),
  targetUnit: z.string().optional(),
});

// Export types
export type RecipesData = InferSelectModel<typeof recipes>;
export type RecipeIngredientsData = InferSelectModel<typeof recipeIngredients>;
export type RecipeCreation = z.infer<typeof recipeCreationSchema>;
export type RecipeIngredientCreation = z.infer<
  typeof recipeIngredientCreationSchema
>;
export type CreateRecipeWithIngredients = z.infer<
  typeof createRecipeWithIngredientsSchema
>;
export type RecipeUpdate = z.infer<typeof recipeUpdateSchema>;
export type ScaleRecipe = z.infer<typeof scaleRecipeSchema>;
export type RecipeResponse = z.infer<typeof recipeResponseDataSchema>;
export type RecipeIngredientResponse = z.infer<
  typeof recipeIngredientResponseDataSchema
>;
