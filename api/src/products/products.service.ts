import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, ilike, or, sql, SQL } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { products } from '../database/schemas/products.schema';
import { customerOrderItems } from '../database/schemas/orders.schema';
import { internalOrderItems } from '../database/schemas/internal-orders.schema';
import { recipes } from '../database/schemas/recipes.schema';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductDto,
  ProductCategory,
  ProductStatus,
} from './dto/product.dto';

@Injectable()
export class ProductsService {
  // Margin threshold percentage - products below this margin will trigger a warning
  private readonly MIN_MARGIN_THRESHOLD = 20;

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get all products with optional filtering
   */
  async getProducts(
    category?: ProductCategory,
    status?: ProductStatus,
    search?: string,
  ): Promise<ProductDto[]> {
    const conditions: SQL[] = [];

    // Filter by category
    if (category) {
      conditions.push(eq(products.category, category));
    }

    // Filter by status
    if (status) {
      conditions.push(eq(products.status, status));
    }

    // Search by name or description
    if (search) {
      const searchCondition = or(
        ilike(products.name, `%${search}%`),
        ilike(products.description, `%${search}%`),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    const items =
      conditions.length > 0
        ? await this.databaseService.database
            .select()
            .from(products)
            .where(and(...conditions))
            .orderBy(
              sql`${products.popularityScore} DESC, ${products.name} ASC`,
            )
        : await this.databaseService.database
            .select()
            .from(products)
            .orderBy(
              sql`${products.popularityScore} DESC, ${products.name} ASC`,
            );

    return items.map((item) => this.mapToProductDto(item));
  }

  /**
   * Get a single product by ID
   */
  async getProductById(productId: string): Promise<ProductDto> {
    const [product] = await this.databaseService.database
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return this.mapToProductDto(product);
  }

  /**
   * Create a new product
   * If recipeId is provided, auto-populates costOfGoods from recipe's costPerUnit
   */
  async createProduct(dto: CreateProductDto): Promise<ProductDto> {
    let costOfGoods: number | undefined = dto.costOfGoods;

    // Layer 2: If recipe is linked, auto-populate cost from recipe (unless explicitly overridden)
    if (dto.recipeId && dto.costOfGoods === undefined) {
      const recipeCost = await this.getRecipeCostPerUnit(dto.recipeId);
      costOfGoods = recipeCost ?? undefined;
    }

    const insertData = {
      name: dto.name,
      description: dto.description || null,
      category: dto.category,
      status: dto.status || 'active',
      basePrice: dto.basePrice.toString(),
      costOfGoods: costOfGoods?.toString() || null,
      recipeId: dto.recipeId || null,
      recipeName: dto.recipeName || null,
      estimatedPrepTime: dto.estimatedPrepTime || null,
      allergens: dto.allergens || null,
      tags: dto.tags || null,
      imageUrl: dto.imageUrl || null,
      nutritionalInfo: dto.nutritionalInfo || null,
      availableSeasons: dto.availableSeasons || null,
      minimumOrderQuantity: dto.minimumOrderQuantity || 1,
      storageInstructions: dto.storageInstructions || null,
      shelfLife: dto.shelfLife || null,
      customizable: dto.customizable || false,
      customizationOptions: dto.customizationOptions || null,
      popularityScore: 0,
    } as typeof products.$inferInsert;

    const [created] = await this.databaseService.database
      .insert(products)
      .values(insertData)
      .returning();

    if (!created) {
      throw new Error('Failed to create product');
    }

    return this.mapToProductDto(created);
  }

  /**
   * Update an existing product
   * If recipeId is updated, auto-syncs costOfGoods from the new recipe
   */
  async updateProduct(
    productId: string,
    dto: UpdateProductDto,
  ): Promise<ProductDto> {
    // Check if product exists
    await this.getProductById(productId);

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only update fields that are provided
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.basePrice !== undefined)
      updateData.basePrice = dto.basePrice.toString();

    // Layer 2: If recipeId is being updated and costOfGoods is not explicitly set, sync from recipe
    if (dto.recipeId !== undefined) {
      updateData.recipeId = dto.recipeId;
      // Auto-sync cost from new recipe if costOfGoods is not explicitly provided
      if (dto.costOfGoods === undefined && dto.recipeId) {
        const recipeCost = await this.getRecipeCostPerUnit(dto.recipeId);
        updateData.costOfGoods = recipeCost?.toString() || null;
      }
    }

    if (dto.costOfGoods !== undefined)
      updateData.costOfGoods = dto.costOfGoods?.toString() || null;
    if (dto.recipeName !== undefined) updateData.recipeName = dto.recipeName;
    if (dto.estimatedPrepTime !== undefined)
      updateData.estimatedPrepTime = dto.estimatedPrepTime;
    if (dto.allergens !== undefined) updateData.allergens = dto.allergens;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;
    if (dto.nutritionalInfo !== undefined)
      updateData.nutritionalInfo = dto.nutritionalInfo;
    if (dto.availableSeasons !== undefined)
      updateData.availableSeasons = dto.availableSeasons;
    if (dto.minimumOrderQuantity !== undefined)
      updateData.minimumOrderQuantity = dto.minimumOrderQuantity;
    if (dto.storageInstructions !== undefined)
      updateData.storageInstructions = dto.storageInstructions;
    if (dto.shelfLife !== undefined) updateData.shelfLife = dto.shelfLife;
    if (dto.customizable !== undefined)
      updateData.customizable = dto.customizable;
    if (dto.customizationOptions !== undefined)
      updateData.customizationOptions = dto.customizationOptions;

    const [updated] = await this.databaseService.database
      .update(products)
      .set(updateData)
      .where(eq(products.id, productId))
      .returning();

    if (!updated) {
      throw new Error('Failed to update product');
    }

    return this.mapToProductDto(updated);
  }

  /**
   * Delete a product
   */
  async deleteProduct(productId: string): Promise<void> {
    // Check if product exists
    await this.getProductById(productId);

    await this.databaseService.database
      .delete(products)
      .where(eq(products.id, productId));
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(
    category: ProductCategory,
  ): Promise<ProductDto[]> {
    return this.getProducts(category);
  }

  /**
   * Get active products only
   */
  async getActiveProducts(): Promise<ProductDto[]> {
    return this.getProducts(undefined, 'active');
  }

  /**
   * Calculate and update popularity score based on order counts
   * Popularity = count of customer orders + count of internal orders
   */
  async calculatePopularity(productId: string): Promise<ProductDto> {
    // Count customer orders containing this product
    const customerOrderCount = await this.databaseService.database
      .select({ count: sql<number>`count(*)::int` })
      .from(customerOrderItems)
      .where(eq(customerOrderItems.productId, productId));

    // Count internal orders containing this product
    const internalOrderCount = await this.databaseService.database
      .select({ count: sql<number>`count(*)::int` })
      .from(internalOrderItems)
      .where(eq(internalOrderItems.productId, productId));

    const totalOrders =
      (customerOrderCount[0]?.count || 0) + (internalOrderCount[0]?.count || 0);

    // Update the popularity score
    const [updated] = await this.databaseService.database
      .update(products)
      .set({
        popularityScore: totalOrders,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return this.mapToProductDto(updated);
  }

  /**
   * Recalculate popularity for all products
   * Useful for batch updates or scheduled jobs
   */
  async recalculateAllPopularity(): Promise<{ updated: number }> {
    const allProducts = await this.databaseService.database
      .select({ id: products.id })
      .from(products);

    let updated = 0;
    for (const product of allProducts) {
      await this.calculatePopularity(product.id);
      updated++;
    }

    return { updated };
  }

  /**
   * Sync product cost from linked recipe
   * Layer 2: Updates costOfGoods from recipe's costPerUnit
   */
  async syncCostFromRecipe(productId: string): Promise<ProductDto> {
    const product = await this.getProductById(productId);

    if (!product.recipeId) {
      throw new NotFoundException(
        `Product ${productId} is not linked to a recipe`,
      );
    }

    const recipeCost = await this.getRecipeCostPerUnit(product.recipeId);

    const [updated] = await this.databaseService.database
      .update(products)
      .set({
        costOfGoods: recipeCost?.toString() || null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return this.mapToProductDto(updated);
  }

  /**
   * Sync costs for all products linked to recipes
   * Useful after recipe costs change due to ingredient price updates
   */
  async syncAllCostsFromRecipes(): Promise<{ updated: number }> {
    const linkedProducts = await this.databaseService.database
      .select({ id: products.id })
      .from(products)
      .where(sql`${products.recipeId} IS NOT NULL`);

    let updated = 0;
    for (const product of linkedProducts) {
      await this.syncCostFromRecipe(product.id);
      updated++;
    }

    return { updated };
  }

  /**
   * Get recipe cost per unit
   * Helper method for Layer 2 cost calculation
   */
  private async getRecipeCostPerUnit(recipeId: string): Promise<number | null> {
    const [recipe] = await this.databaseService.database
      .select({ costPerUnit: recipes.costPerUnit })
      .from(recipes)
      .where(eq(recipes.id, recipeId));

    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${recipeId} not found`);
    }

    return recipe.costPerUnit ? parseFloat(recipe.costPerUnit) : null;
  }

  /**
   * Calculate margin percentage: (basePrice - costOfGoods) / basePrice * 100
   * Returns null if costOfGoods is not set
   */
  private calculateMargin(
    basePrice: number,
    costOfGoods: number | null,
  ): number | null {
    if (costOfGoods === null || costOfGoods === 0) {
      return null;
    }
    return ((basePrice - costOfGoods) / basePrice) * 100;
  }

  /**
   * Calculate markup percentage: (basePrice - costOfGoods) / costOfGoods * 100
   * Returns null if costOfGoods is not set
   */
  private calculateMarkup(
    basePrice: number,
    costOfGoods: number | null,
  ): number | null {
    if (costOfGoods === null || costOfGoods === 0) {
      return null;
    }
    return ((basePrice - costOfGoods) / costOfGoods) * 100;
  }

  /**
   * Calculate profit: basePrice - costOfGoods
   * Returns null if costOfGoods is not set
   */
  private calculateProfit(
    basePrice: number,
    costOfGoods: number | null,
  ): number | null {
    if (costOfGoods === null) {
      return null;
    }
    return basePrice - costOfGoods;
  }

  /**
   * Map database model to DTO
   */
  private mapToProductDto(product: typeof products.$inferSelect): ProductDto {
    const basePrice = parseFloat(product.basePrice);
    const costOfGoods = product.costOfGoods
      ? parseFloat(product.costOfGoods)
      : null;

    // Calculate derived financial metrics
    const margin = this.calculateMargin(basePrice, costOfGoods);
    const markup = this.calculateMarkup(basePrice, costOfGoods);
    const profit = this.calculateProfit(basePrice, costOfGoods);
    const marginWarning = margin !== null && margin < this.MIN_MARGIN_THRESHOLD;

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      status: product.status,
      basePrice,
      costOfGoods,
      // Calculated fields
      margin,
      markup,
      profit,
      marginWarning,
      // End calculated fields
      recipeId: product.recipeId,
      recipeName: product.recipeName,
      estimatedPrepTime: product.estimatedPrepTime,
      allergens: product.allergens,
      tags: product.tags,
      imageUrl: product.imageUrl,
      nutritionalInfo: product.nutritionalInfo,
      availableSeasons: product.availableSeasons,
      minimumOrderQuantity: product.minimumOrderQuantity ?? 1,
      storageInstructions: product.storageInstructions,
      shelfLife: product.shelfLife,
      customizable: product.customizable,
      customizationOptions: product.customizationOptions,
      popularityScore: product.popularityScore ?? 0,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
