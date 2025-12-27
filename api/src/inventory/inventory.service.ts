import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, gte, desc } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import {
  inventoryItems,
  inventoryConsumptionTracking,
  customerOrders,
  customerOrderItems,
  recipeIngredients,
  recipes,
  products,
} from '../database/schemas';
import {
  ConsumptionTrackingDto,
  SetCustomThresholdDto,
  InventoryItemWithTrackingDto,
} from './dto/consumption-tracking.dto';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  InventoryItemDto,
} from './dto/inventory-item.dto';

@Injectable()
export class InventoryService {
  private readonly CALCULATION_PERIOD_DAYS = 7;
  private readonly SAFETY_BUFFER_DAYS = 1;

  constructor(private readonly databaseService: DatabaseService) {}

  async getInventory(
    lowStockOnly = false,
    category?: string,
  ): Promise<InventoryItemWithTrackingDto[]> {
    // Build query conditions
    const conditions: any[] = [];
    if (category) {
      conditions.push(
        eq(
          inventoryItems.category,
          category as 'ingredient' | 'packaging' | 'supplies',
        ),
      );
    }

    // Get all inventory items
    const items = await this.databaseService.database
      .select()
      .from(inventoryItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get consumption tracking for all items
    const trackingRecords = await this.databaseService.database
      .select()
      .from(inventoryConsumptionTracking);
    const trackingMap = new Map(
      trackingRecords.map(
        (t: typeof inventoryConsumptionTracking.$inferSelect) => [
          t.inventoryItemId,
          t,
        ],
      ),
    );

    // Map to response DTOs with low_stock calculation
    const result = items.map((item) => {
      const tracking = trackingMap.get(item.id);
      const lowStock = this.calculateLowStock(item, tracking);

      return {
        id: item.id,
        name: item.name,
        current_stock: parseFloat(item.currentStock),
        unit: item.unit,
        category: item.category,
        lead_time_days: 3, // Default lead time, could be from item.supplier config
        low_stock: lowStock,
        consumption_tracking: tracking
          ? {
              avg_daily_consumption: parseFloat(tracking.avgDailyConsumption),
              days_of_supply_remaining: this.calculateDaysRemaining(
                parseFloat(item.currentStock),
                parseFloat(tracking.avgDailyConsumption),
              ),
              has_custom_threshold: tracking.customReorderThreshold !== null,
            }
          : null,
      };
    });

    // Filter by low_stock if requested
    if (lowStockOnly) {
      return result.filter((item) => item.low_stock);
    }

    return result;
  }

  async getConsumptionTracking(
    itemId: string,
  ): Promise<ConsumptionTrackingDto> {
    // Check if item exists
    const [item] = await this.databaseService.database
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId))
      .limit(1);
    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    // Get tracking record
    const [tracking] = await this.databaseService.database
      .select()
      .from(inventoryConsumptionTracking)
      .where(eq(inventoryConsumptionTracking.inventoryItemId, itemId))
      .limit(1);

    if (!tracking) {
      throw new NotFoundException('No consumption tracking data found');
    }

    const avgDailyConsumption = parseFloat(tracking.avgDailyConsumption);
    const currentStock = parseFloat(item.currentStock);
    const daysRemaining = this.calculateDaysRemaining(
      currentStock,
      avgDailyConsumption,
    );

    return {
      id: tracking.id,
      inventory_item_id: tracking.inventoryItemId,
      avg_daily_consumption: avgDailyConsumption,
      calculation_period_days: tracking.calculationPeriodDays,
      last_calculated_at: tracking.lastCalculatedAt.toISOString(),
      calculation_method: tracking.calculationMethod as
        | 'historical_orders'
        | 'manual'
        | 'predicted',
      custom_reorder_threshold: tracking.customReorderThreshold
        ? parseFloat(tracking.customReorderThreshold)
        : null,
      custom_lead_time_days: tracking.customLeadTimeDays,
      sample_size: tracking.sampleSize,
      days_of_supply_remaining: daysRemaining,
      predicted_stockout_date: this.calculateStockoutDate(
        currentStock,
        avgDailyConsumption,
      ),
    };
  }

  async setCustomThreshold(
    itemId: string,
    dto: SetCustomThresholdDto,
  ): Promise<ConsumptionTrackingDto> {
    // Check if item exists
    const [item] = await this.databaseService.database
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId))
      .limit(1);
    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    // Update or create tracking record
    const [existing] = await this.databaseService.database
      .select()
      .from(inventoryConsumptionTracking)
      .where(eq(inventoryConsumptionTracking.inventoryItemId, itemId))
      .limit(1);

    if (existing) {
      const [updated] = await this.databaseService.database
        .update(inventoryConsumptionTracking)
        .set({
          customReorderThreshold: dto.custom_reorder_threshold.toString(),
          customLeadTimeDays: dto.custom_lead_time_days || null,
          updatedAt: new Date(),
        })
        .where(eq(inventoryConsumptionTracking.id, existing.id))
        .returning();

      if (!updated) {
        throw new Error('Failed to update consumption tracking');
      }

      return this.mapToConsumptionDto(updated, parseFloat(item.currentStock));
    } else {
      // Create new tracking record with custom threshold
      const [created] = await this.databaseService.database
        .insert(inventoryConsumptionTracking)
        .values({
          inventoryItemId: itemId,
          avgDailyConsumption: '0',
          calculationPeriodDays: this.CALCULATION_PERIOD_DAYS,
          lastCalculatedAt: new Date(),
          calculationMethod: 'manual',
          customReorderThreshold: dto.custom_reorder_threshold.toString(),
          customLeadTimeDays: dto.custom_lead_time_days || null,
          sampleSize: 0,
        })
        .returning();

      if (!created) {
        throw new Error('Failed to create consumption tracking');
      }

      return this.mapToConsumptionDto(created, parseFloat(item.currentStock));
    }
  }

  async deleteCustomThreshold(itemId: string): Promise<void> {
    const [tracking] = await this.databaseService.database
      .select()
      .from(inventoryConsumptionTracking)
      .where(eq(inventoryConsumptionTracking.inventoryItemId, itemId))
      .limit(1);

    if (tracking) {
      await this.databaseService.database
        .update(inventoryConsumptionTracking)
        .set({
          customReorderThreshold: null,
          customLeadTimeDays: null,
          updatedAt: new Date(),
        })
        .where(eq(inventoryConsumptionTracking.id, tracking.id));
    }
  }

  async recalculate(itemId: string): Promise<ConsumptionTrackingDto> {
    // Check if item exists
    const [item] = await this.databaseService.database
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId))
      .limit(1);
    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    // Calculate consumption from orders in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - this.CALCULATION_PERIOD_DAYS);

    // Calculate consumption by tracing: inventoryItem → recipeIngredients → recipes → products → orderItems → orders
    // For each order of a product, we consume: (order_quantity * ingredient_quantity / recipe_yield)
    const consumptionData = await this.databaseService.database
      .select({
        orderQuantity: customerOrderItems.quantity,
        ingredientQuantity: recipeIngredients.quantity,
        recipeYield: recipes.yield,
        orderDate: customerOrders.createdAt,
      })
      .from(recipeIngredients)
      .innerJoin(recipes, eq(recipeIngredients.recipeId, recipes.id))
      .innerJoin(products, eq(products.recipeId, recipes.id))
      .innerJoin(
        customerOrderItems,
        eq(customerOrderItems.productId, products.id),
      )
      .innerJoin(
        customerOrders,
        eq(customerOrderItems.orderId, customerOrders.id),
      )
      .where(
        and(
          eq(recipeIngredients.ingredientId, itemId),
          gte(customerOrders.createdAt, sevenDaysAgo),
        ),
      )
      .orderBy(desc(customerOrders.createdAt));

    // Calculate total consumption: sum of (order_quantity * ingredient_quantity / recipe_yield)
    const totalQuantity = consumptionData.reduce((total, row) => {
      const orderQty = row.orderQuantity;
      const ingredientQty = parseFloat(row.ingredientQuantity);
      const recipeYield = row.recipeYield;
      // Consumption = orderQuantity * (ingredientQuantity / recipeYield)
      return total + (orderQty * ingredientQty) / recipeYield;
    }, 0);
    const avgDailyConsumption = totalQuantity / this.CALCULATION_PERIOD_DAYS;
    const sampleSize = consumptionData.length;

    // Update or create tracking record
    const [existing] = await this.databaseService.database
      .select()
      .from(inventoryConsumptionTracking)
      .where(eq(inventoryConsumptionTracking.inventoryItemId, itemId))
      .limit(1);

    if (existing) {
      const [updated] = await this.databaseService.database
        .update(inventoryConsumptionTracking)
        .set({
          avgDailyConsumption: avgDailyConsumption.toString(),
          calculationPeriodDays: this.CALCULATION_PERIOD_DAYS,
          lastCalculatedAt: new Date(),
          calculationMethod: 'historical_orders',
          sampleSize,
          updatedAt: new Date(),
        })
        .where(eq(inventoryConsumptionTracking.id, existing.id))
        .returning();

      if (!updated) {
        throw new Error('Failed to update consumption tracking');
      }

      return this.mapToConsumptionDto(updated, parseFloat(item.currentStock));
    } else {
      const [created] = await this.databaseService.database
        .insert(inventoryConsumptionTracking)
        .values({
          inventoryItemId: itemId,
          avgDailyConsumption: avgDailyConsumption.toString(),
          calculationPeriodDays: this.CALCULATION_PERIOD_DAYS,
          lastCalculatedAt: new Date(),
          calculationMethod: 'historical_orders',
          sampleSize,
        })
        .returning();

      if (!created) {
        throw new Error('Failed to create consumption tracking');
      }

      return this.mapToConsumptionDto(created, parseFloat(item.currentStock));
    }
  }

  private calculateLowStock(
    item: typeof inventoryItems.$inferSelect,
    tracking: typeof inventoryConsumptionTracking.$inferSelect | undefined,
  ): boolean {
    if (!tracking) {
      // Fallback to simple threshold if no tracking
      return parseFloat(item.currentStock) < parseFloat(item.minimumStock);
    }

    // Use custom threshold if set
    if (tracking.customReorderThreshold) {
      return (
        parseFloat(item.currentStock) <
        parseFloat(tracking.customReorderThreshold)
      );
    }

    // Predictive calculation: (current_stock / avg_daily_consumption) < (lead_time + safety_buffer)
    const avgDailyConsumption = parseFloat(tracking.avgDailyConsumption);
    if (avgDailyConsumption === 0) {
      return false; // No consumption history
    }

    const leadTime = tracking.customLeadTimeDays || 3; // Default 3 days
    const daysRemaining = parseFloat(item.currentStock) / avgDailyConsumption;

    return daysRemaining < leadTime + this.SAFETY_BUFFER_DAYS;
  }

  private calculateDaysRemaining(
    currentStock: number,
    avgDailyConsumption: number,
  ): number {
    if (avgDailyConsumption === 0) {
      return 999; // Essentially infinite if no consumption
    }
    return Math.round((currentStock / avgDailyConsumption) * 10) / 10; // Round to 1 decimal
  }

  private calculateStockoutDate(
    currentStock: number,
    avgDailyConsumption: number,
  ): string | null {
    if (avgDailyConsumption === 0) {
      return null;
    }

    const daysUntilStockout = currentStock / avgDailyConsumption;
    const stockoutDate = new Date();
    stockoutDate.setDate(stockoutDate.getDate() + Math.ceil(daysUntilStockout));

    const dateString = stockoutDate.toISOString().split('T')[0];
    return dateString || null; // Return YYYY-MM-DD
  }

  private mapToConsumptionDto(
    tracking: typeof inventoryConsumptionTracking.$inferSelect,
    currentStock: number,
  ): ConsumptionTrackingDto {
    const avgDailyConsumption = parseFloat(tracking.avgDailyConsumption);
    return {
      id: tracking.id,
      inventory_item_id: tracking.inventoryItemId,
      avg_daily_consumption: avgDailyConsumption,
      calculation_period_days: tracking.calculationPeriodDays,
      last_calculated_at: tracking.lastCalculatedAt.toISOString(),
      calculation_method: tracking.calculationMethod as
        | 'historical_orders'
        | 'manual'
        | 'predicted',
      custom_reorder_threshold: tracking.customReorderThreshold
        ? parseFloat(tracking.customReorderThreshold)
        : null,
      custom_lead_time_days: tracking.customLeadTimeDays,
      sample_size: tracking.sampleSize,
      days_of_supply_remaining: this.calculateDaysRemaining(
        currentStock,
        avgDailyConsumption,
      ),
      predicted_stockout_date: this.calculateStockoutDate(
        currentStock,
        avgDailyConsumption,
      ),
    };
  }

  // CRUD operations for inventory items

  async getInventoryItem(itemId: string): Promise<InventoryItemDto> {
    const [item] = await this.databaseService.database
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId))
      .limit(1);

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    return this.mapToInventoryItemDto(item);
  }

  async createInventoryItem(
    dto: CreateInventoryItemDto,
    tenantId: string,
  ): Promise<InventoryItemDto> {
    const [created] = await this.databaseService.database
      .insert(inventoryItems)
      .values({
        tenantId,
        name: dto.name,
        category: dto.category,
        unit: dto.unit,
        currentStock: dto.currentStock.toString(),
        minimumStock: dto.minimumStock.toString(),
        reorderPoint: dto.reorderPoint.toString(),
        reorderQuantity: dto.reorderQuantity.toString(),
        costPerUnit: dto.costPerUnit.toString(),
        supplier: dto.supplier || null,
        location: dto.location || null,
        notes: dto.notes || null,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create inventory item');
    }

    return this.mapToInventoryItemDto(created);
  }

  async updateInventoryItem(
    itemId: string,
    dto: UpdateInventoryItemDto,
  ): Promise<InventoryItemDto> {
    const [existing] = await this.databaseService.database
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Inventory item not found');
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.unit !== undefined) updateData.unit = dto.unit;
    if (dto.currentStock !== undefined)
      updateData.currentStock = dto.currentStock.toString();
    if (dto.minimumStock !== undefined)
      updateData.minimumStock = dto.minimumStock.toString();
    if (dto.reorderPoint !== undefined)
      updateData.reorderPoint = dto.reorderPoint.toString();
    if (dto.reorderQuantity !== undefined)
      updateData.reorderQuantity = dto.reorderQuantity.toString();
    if (dto.costPerUnit !== undefined)
      updateData.costPerUnit = dto.costPerUnit.toString();
    if (dto.supplier !== undefined) updateData.supplier = dto.supplier;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    updateData.updatedAt = new Date();

    const [updated] = await this.databaseService.database
      .update(inventoryItems)
      .set(updateData)
      .where(eq(inventoryItems.id, itemId))
      .returning();

    if (!updated) {
      throw new Error('Failed to update inventory item');
    }

    return this.mapToInventoryItemDto(updated);
  }

  async deleteInventoryItem(itemId: string): Promise<void> {
    const [existing] = await this.databaseService.database
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Inventory item not found');
    }

    // Check if this inventory item is used in any recipes
    const usedInRecipes = await this.databaseService.database
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.ingredientId, itemId))
      .limit(1);

    if (usedInRecipes.length > 0) {
      throw new BadRequestException(
        'Cannot delete inventory item because it is used in one or more recipes. Please remove it from all recipes first.',
      );
    }

    // Delete associated consumption tracking first
    await this.databaseService.database
      .delete(inventoryConsumptionTracking)
      .where(eq(inventoryConsumptionTracking.inventoryItemId, itemId));

    // Delete the inventory item
    await this.databaseService.database
      .delete(inventoryItems)
      .where(eq(inventoryItems.id, itemId));
  }

  private mapToInventoryItemDto(
    item: typeof inventoryItems.$inferSelect,
  ): InventoryItemDto {
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      currentStock: parseFloat(item.currentStock),
      minimumStock: parseFloat(item.minimumStock),
      reorderPoint: parseFloat(item.reorderPoint),
      reorderQuantity: parseFloat(item.reorderQuantity),
      costPerUnit: parseFloat(item.costPerUnit),
      supplier: item.supplier,
      location: item.location,
      notes: item.notes,
      expirationDate: item.expirationDate || null,
      lastRestocked: item.lastRestocked
        ? item.lastRestocked.toISOString()
        : null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
