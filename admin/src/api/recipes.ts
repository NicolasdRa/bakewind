import { apiClient } from './client';

// Recipe Types
export type RecipeCategory = 'bread' | 'pastry' | 'cake' | 'cookie' | 'sandwich' | 'beverage' | 'sauce' | 'filling' | 'topping' | 'other';

export interface RecipeIngredient {
  id?: string;
  ingredientId: string | null;
  ingredientName: string;
  quantity: number;
  unit: string;
  cost: number | null;
  notes: string | null;
}

export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  sugar?: number;
  sodium?: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  description: string | null;
  prepTime: number; // minutes
  cookTime: number; // minutes
  totalTime: number; // calculated: prepTime + cookTime
  yield: number;
  yieldUnit: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  tags: string[] | null;
  allergens: string[] | null;
  nutritionalInfo: NutritionalInfo | null;
  imageUrl: string | null;
  totalIngredientCost: number;
  costPerUnit: number | null;
  sellingPrice: number | null;
  margin: number | null;
  markup: number | null;
  profit: number | null;
  marginWarning: boolean;
  productId: string | null;
  productName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecipeRequest {
  name: string;
  category: RecipeCategory;
  description?: string;
  prepTime: number;
  cookTime: number;
  yield: number;
  yieldUnit: string;
  ingredients: Array<{
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    cost?: number;
    notes?: string;
  }>;
  instructions: string[];
  tags?: string[];
  allergens?: string[];
  nutritionalInfo?: NutritionalInfo;
  imageUrl?: string;
  sellingPrice?: number;
  productId?: string;
  productName?: string;
  isActive?: boolean;
}

export interface UpdateRecipeRequest {
  name?: string;
  category?: RecipeCategory;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  yield?: number;
  yieldUnit?: string;
  ingredients?: Array<{
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    cost?: number;
    notes?: string;
  }>;
  instructions?: string[];
  tags?: string[];
  allergens?: string[];
  nutritionalInfo?: NutritionalInfo;
  imageUrl?: string;
  sellingPrice?: number;
  productId?: string;
  productName?: string;
  isActive?: boolean;
}

// API functions
export const recipesApi = {
  /**
   * Get all recipes with optional filtering
   */
  async getRecipes(params?: {
    category?: RecipeCategory;
    search?: string;
    isActive?: boolean;
  }): Promise<Recipe[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
    const query = searchParams.toString();
    return apiClient.get(`/recipes${query ? `?${query}` : ''}`);
  },

  /**
   * Get a single recipe by ID
   */
  async getRecipe(id: string): Promise<Recipe> {
    return apiClient.get(`/recipes/${id}`);
  },

  /**
   * Create a new recipe
   */
  async createRecipe(data: CreateRecipeRequest): Promise<Recipe> {
    return apiClient.post('/recipes', data);
  },

  /**
   * Update an existing recipe
   */
  async updateRecipe(id: string, data: UpdateRecipeRequest): Promise<Recipe> {
    return apiClient.patch(`/recipes/${id}`, data);
  },

  /**
   * Delete a recipe
   */
  async deleteRecipe(id: string): Promise<void> {
    return apiClient.delete(`/recipes/${id}`);
  },

  /**
   * Recalculate cost for a recipe based on current ingredient prices
   */
  async recalculateCost(id: string): Promise<Recipe> {
    return apiClient.post(`/recipes/${id}/recalculate-cost`);
  },

  /**
   * Recalculate costs for all recipes
   */
  async recalculateAllCosts(): Promise<{ updated: number }> {
    return apiClient.post('/recipes/recalculate-all-costs');
  },
};
