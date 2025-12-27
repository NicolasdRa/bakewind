import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, ilike, or, sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { recipes, recipeIngredients } from '../database/schemas/recipes.schema';
import { inventoryItems } from '../database/schemas/inventory.schema';
import {
  CreateRecipeDto,
  UpdateRecipeDto,
  RecipeDto,
  RecipeCategory,
  RecipeIngredientWithDetails,
} from './dto/recipe.dto';

@Injectable()
export class RecipesService {
  // Margin threshold percentage - recipes below this margin will trigger a warning
  private readonly MIN_MARGIN_THRESHOLD = 20;

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get all recipes with optional filtering (tenant-scoped)
   */
  async getRecipes(
    tenantId: string,
    category?: RecipeCategory,
    search?: string,
    isActive?: boolean,
  ): Promise<RecipeDto[]> {
    const conditions: any[] = [eq(recipes.tenantId, tenantId)];

    if (category) {
      conditions.push(eq(recipes.category, category));
    }

    if (search) {
      const searchCondition = or(
        ilike(recipes.name, `%${search}%`),
        ilike(recipes.description, `%${search}%`),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (isActive !== undefined) {
      conditions.push(eq(recipes.isActive, isActive));
    }

    const recipeList = await this.databaseService.database
      .select()
      .from(recipes)
      .where(and(...conditions))
      .orderBy(recipes.name);

    // Fetch ingredients for each recipe
    const recipeDtos = await Promise.all(
      recipeList.map((recipe) => this.mapToRecipeDto(recipe)),
    );

    return recipeDtos;
  }

  /**
   * Get a single recipe by ID (tenant-scoped)
   */
  async getRecipeById(recipeId: string, tenantId: string): Promise<RecipeDto> {
    const [recipe] = await this.databaseService.database
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, recipeId), eq(recipes.tenantId, tenantId)));

    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${recipeId} not found`);
    }

    return this.mapToRecipeDto(recipe);
  }

  /**
   * Create a new recipe with ingredients (tenant-scoped)
   */
  async createRecipe(dto: CreateRecipeDto, tenantId: string): Promise<RecipeDto> {
    // Calculate total ingredient cost
    const totalIngredientCost = dto.ingredients.reduce(
      (sum, ing) => sum + (ing.cost || 0),
      0,
    );

    const costPerUnit = dto.yield > 0 ? totalIngredientCost / dto.yield : null;

    const insertData = {
      name: dto.name,
      category: dto.category,
      description: dto.description || null,
      prepTime: dto.prepTime,
      cookTime: dto.cookTime,
      yield: dto.yield,
      yieldUnit: dto.yieldUnit,
      costPerUnit: costPerUnit ? costPerUnit.toFixed(4) : null,
      sellingPrice: dto.sellingPrice?.toString() || null,
      productId: dto.productId || null,
      productName: dto.productName || null,
      instructions: dto.instructions,
      nutritionalInfo: dto.nutritionalInfo || null,
      allergens: dto.allergens || null,
      tags: dto.tags || null,
      imageUrl: dto.imageUrl || null,
      isActive: dto.isActive ?? true,
      tenantId,
    } as typeof recipes.$inferInsert;

    const [created] = await this.databaseService.database
      .insert(recipes)
      .values(insertData)
      .returning();

    if (!created) {
      throw new Error('Failed to create recipe');
    }

    // Insert recipe ingredients
    if (dto.ingredients && dto.ingredients.length > 0) {
      const ingredientInserts = dto.ingredients.map((ing) => ({
        recipeId: created.id,
        ingredientId: ing.ingredientId,
        ingredientName: ing.ingredientName,
        quantity: ing.quantity.toString(),
        unit: ing.unit,
        cost: ing.cost?.toFixed(4) || null,
        notes: ing.notes || null,
      }));

      await this.databaseService.database
        .insert(recipeIngredients)
        .values(ingredientInserts);
    }

    return this.mapToRecipeDto(created);
  }

  /**
   * Update an existing recipe (tenant-scoped)
   */
  async updateRecipe(
    recipeId: string,
    dto: UpdateRecipeDto,
    tenantId: string,
  ): Promise<RecipeDto> {
    // Check if recipe exists and belongs to tenant
    await this.getRecipeById(recipeId, tenantId);

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only update fields that are provided
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.prepTime !== undefined) updateData.prepTime = dto.prepTime;
    if (dto.cookTime !== undefined) updateData.cookTime = dto.cookTime;
    if (dto.yield !== undefined) updateData.yield = dto.yield;
    if (dto.yieldUnit !== undefined) updateData.yieldUnit = dto.yieldUnit;
    if (dto.sellingPrice !== undefined)
      updateData.sellingPrice = dto.sellingPrice?.toString() || null;
    if (dto.productId !== undefined) updateData.productId = dto.productId;
    if (dto.productName !== undefined) updateData.productName = dto.productName;
    if (dto.instructions !== undefined)
      updateData.instructions = dto.instructions;
    if (dto.nutritionalInfo !== undefined)
      updateData.nutritionalInfo = dto.nutritionalInfo;
    if (dto.allergens !== undefined) updateData.allergens = dto.allergens;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    // If ingredients are being updated, recalculate cost
    if (dto.ingredients !== undefined) {
      // Delete existing ingredients
      await this.databaseService.database
        .delete(recipeIngredients)
        .where(eq(recipeIngredients.recipeId, recipeId));

      // Insert new ingredients
      if (dto.ingredients.length > 0) {
        const ingredientInserts = dto.ingredients.map((ing) => ({
          recipeId: recipeId,
          ingredientId: ing.ingredientId,
          ingredientName: ing.ingredientName,
          quantity: ing.quantity.toString(),
          unit: ing.unit,
          cost: ing.cost?.toFixed(4) || null,
          notes: ing.notes || null,
        }));

        await this.databaseService.database
          .insert(recipeIngredients)
          .values(ingredientInserts);
      }

      // Recalculate cost per unit
      const totalIngredientCost = dto.ingredients.reduce(
        (sum, ing) => sum + (ing.cost || 0),
        0,
      );

      const yieldValue =
        dto.yield ?? (await this.getRecipeById(recipeId, tenantId)).yield;
      const costPerUnit =
        yieldValue > 0 ? totalIngredientCost / yieldValue : null;
      updateData.costPerUnit = costPerUnit ? costPerUnit.toFixed(4) : null;
    } else if (dto.yield !== undefined) {
      // If only yield changed, recalculate cost per unit
      const existingRecipe = await this.getRecipeById(recipeId, tenantId);
      const totalCost = existingRecipe.totalIngredientCost;
      const costPerUnit = dto.yield > 0 ? totalCost / dto.yield : null;
      updateData.costPerUnit = costPerUnit ? costPerUnit.toFixed(4) : null;
    }

    const [updated] = await this.databaseService.database
      .update(recipes)
      .set(updateData)
      .where(and(eq(recipes.id, recipeId), eq(recipes.tenantId, tenantId)))
      .returning();

    if (!updated) {
      throw new Error('Failed to update recipe');
    }

    return this.mapToRecipeDto(updated);
  }

  /**
   * Delete a recipe (tenant-scoped)
   */
  async deleteRecipe(recipeId: string, tenantId: string): Promise<void> {
    // Check if recipe exists and belongs to tenant
    await this.getRecipeById(recipeId, tenantId);

    // Delete recipe (ingredients will cascade delete)
    await this.databaseService.database
      .delete(recipes)
      .where(and(eq(recipes.id, recipeId), eq(recipes.tenantId, tenantId)));
  }

  /**
   * Get recipes by category (tenant-scoped)
   */
  async getRecipesByCategory(tenantId: string, category: RecipeCategory): Promise<RecipeDto[]> {
    return this.getRecipes(tenantId, category);
  }

  /**
   * Get active recipes only (tenant-scoped)
   */
  async getActiveRecipes(tenantId: string): Promise<RecipeDto[]> {
    return this.getRecipes(tenantId, undefined, undefined, true);
  }

  /**
   * Recalculate cost for a recipe based on current ingredient prices (tenant-scoped)
   * This is useful when ingredient prices in inventory change
   */
  async recalculateRecipeCost(recipeId: string, tenantId: string): Promise<RecipeDto> {
    const recipe = await this.getRecipeById(recipeId, tenantId);

    // Fetch fresh ingredient costs from inventory
    const ingredientIds = recipe.ingredients.map((ing) => ing.ingredientId);

    const freshInventory = await this.databaseService.database
      .select()
      .from(inventoryItems)
      .where(sql`${inventoryItems.id} = ANY(${ingredientIds})`);

    const inventoryMap = new Map(
      freshInventory.map((item) => [
        item.id,
        parseFloat(item.costPerUnit || '0'),
      ]),
    );

    // Update ingredient costs in recipe_ingredients
    for (const ingredient of recipe.ingredients) {
      const freshCost = inventoryMap.get(ingredient.ingredientId);
      if (freshCost !== undefined) {
        await this.databaseService.database
          .update(recipeIngredients)
          .set({ cost: freshCost.toFixed(4) })
          .where(eq(recipeIngredients.id, ingredient.id));
      }
    }

    // Recalculate total cost
    const totalIngredientCost = recipe.ingredients.reduce((sum, ing) => {
      const freshCost = inventoryMap.get(ing.ingredientId) || ing.cost || 0;
      return sum + freshCost;
    }, 0);

    const costPerUnit =
      recipe.yield > 0 ? totalIngredientCost / recipe.yield : null;

    // Update recipe cost
    await this.databaseService.database
      .update(recipes)
      .set({
        costPerUnit: costPerUnit ? costPerUnit.toFixed(4) : null,
        updatedAt: new Date(),
      })
      .where(and(eq(recipes.id, recipeId), eq(recipes.tenantId, tenantId)));

    return this.getRecipeById(recipeId, tenantId);
  }

  /**
   * Calculate margin percentage: (sellingPrice - costPerUnit) / sellingPrice * 100
   */
  private calculateMargin(
    sellingPrice: number,
    costPerUnit: number | null,
  ): number | null {
    if (costPerUnit === null || costPerUnit === 0) {
      return null;
    }
    return ((sellingPrice - costPerUnit) / sellingPrice) * 100;
  }

  /**
   * Calculate markup percentage: (sellingPrice - costPerUnit) / costPerUnit * 100
   */
  private calculateMarkup(
    sellingPrice: number,
    costPerUnit: number | null,
  ): number | null {
    if (costPerUnit === null || costPerUnit === 0) {
      return null;
    }
    return ((sellingPrice - costPerUnit) / costPerUnit) * 100;
  }

  /**
   * Calculate profit: sellingPrice - costPerUnit
   */
  private calculateProfit(
    sellingPrice: number,
    costPerUnit: number | null,
  ): number | null {
    if (costPerUnit === null) {
      return null;
    }
    return sellingPrice - costPerUnit;
  }

  /**
   * Map database model to DTO with calculated fields
   */
  private async mapToRecipeDto(
    recipe: typeof recipes.$inferSelect,
  ): Promise<RecipeDto> {
    // Fetch ingredients for this recipe
    const ingredients = await this.databaseService.database
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipe.id));

    const ingredientsWithDetails: RecipeIngredientWithDetails[] =
      ingredients.map((ing) => ({
        id: ing.id,
        ingredientId: ing.ingredientId,
        ingredientName: ing.ingredientName,
        quantity: parseFloat(ing.quantity),
        unit: ing.unit,
        cost: ing.cost ? parseFloat(ing.cost) : null,
        notes: ing.notes,
      }));

    // Calculate total ingredient cost
    const totalIngredientCost = ingredientsWithDetails.reduce(
      (sum, ing) => sum + (ing.cost || 0),
      0,
    );

    const costPerUnit = recipe.costPerUnit
      ? parseFloat(recipe.costPerUnit)
      : null;
    const sellingPrice = recipe.sellingPrice
      ? parseFloat(recipe.sellingPrice)
      : null;

    // Calculate derived financial metrics
    const margin =
      sellingPrice !== null
        ? this.calculateMargin(sellingPrice, costPerUnit)
        : null;
    const markup =
      sellingPrice !== null
        ? this.calculateMarkup(sellingPrice, costPerUnit)
        : null;
    const profit =
      sellingPrice !== null
        ? this.calculateProfit(sellingPrice, costPerUnit)
        : null;
    const marginWarning = margin !== null && margin < this.MIN_MARGIN_THRESHOLD;

    return {
      id: recipe.id,
      name: recipe.name,
      category: recipe.category as RecipeCategory,
      description: recipe.description,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      totalTime: recipe.prepTime + recipe.cookTime,
      yield: recipe.yield,
      yieldUnit: recipe.yieldUnit,
      // Cost calculations
      totalIngredientCost,
      costPerUnit,
      sellingPrice,
      margin,
      markup,
      profit,
      marginWarning,
      // End calculated fields
      productId: recipe.productId,
      productName: recipe.productName,
      instructions: recipe.instructions,
      ingredients: ingredientsWithDetails,
      nutritionalInfo: recipe.nutritionalInfo,
      allergens: recipe.allergens,
      tags: recipe.tags,
      imageUrl: recipe.imageUrl,
      isActive: recipe.isActive,
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString(),
    };
  }
}
