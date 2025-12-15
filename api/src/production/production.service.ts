import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  productionSchedules,
  productionItems,
  recipes,
  recipeIngredients,
  inventoryItems,
  internalOrders,
  internalOrderItems,
  customerOrders,
  customerOrderItems,
  products,
} from '../database/schemas';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import {
  CreateProductionScheduleDto,
  UpdateProductionScheduleDto,
  ProductionScheduleDto,
  UpdateProductionItemDto,
  ProductionItemDto,
  ProductionStatus,
} from './dto';

@Injectable()
export class ProductionService {
  private readonly logger = new Logger(ProductionService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get all production schedules with optional date filtering
   */
  async getAllSchedules(startDate?: string, endDate?: string): Promise<ProductionScheduleDto[]> {
    const conditions: any[] = [];

    if (startDate) {
      conditions.push(gte(productionSchedules.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(productionSchedules.date, endDate));
    }

    const schedules = await this.databaseService.database
      .select()
      .from(productionSchedules)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(productionSchedules.date));

    // Fetch items for each schedule
    const schedulesWithItems = await Promise.all(
      schedules.map(async (schedule) => {
        const items = await this.databaseService.database
          .select()
          .from(productionItems)
          .where(eq(productionItems.scheduleId, schedule.id));

        return this.mapToScheduleDto(schedule, items);
      }),
    );

    return schedulesWithItems;
  }

  /**
   * Get a single production schedule by ID
   */
  async getScheduleById(id: string): Promise<ProductionScheduleDto> {
    const [schedule] = await this.databaseService.database
      .select()
      .from(productionSchedules)
      .where(eq(productionSchedules.id, id))
      .limit(1);

    if (!schedule) {
      throw new NotFoundException('Production schedule not found');
    }

    const items = await this.databaseService.database
      .select()
      .from(productionItems)
      .where(eq(productionItems.scheduleId, id));

    return this.mapToScheduleDto(schedule, items);
  }

  /**
   * Create a new production schedule with items
   * Validates recipes and checks inventory availability
   */
  async createSchedule(
    dto: CreateProductionScheduleDto,
    userId: string,
  ): Promise<ProductionScheduleDto> {
    // Validate all recipes exist (simplified validation for first recipe)
    const recipeIds = dto.items.map((item) => item.recipeId);
    if (recipeIds.length > 0 && recipeIds[0]) {
      const foundRecipes = await this.databaseService.database
        .select()
        .from(recipes)
        .where(eq(recipes.id, recipeIds[0]));
    }

    // Check if we have enough inventory for each recipe
    const inventoryWarnings = await this.checkInventoryAvailability(dto.items);
    if (inventoryWarnings.length > 0) {
      this.logger.warn(`Inventory warnings for production schedule: ${JSON.stringify(inventoryWarnings)}`);
      // Continue anyway but log warnings
    }

    // Create schedule
    const [schedule] = await this.databaseService.database
      .insert(productionSchedules)
      .values({
        date: dto.date,
        totalItems: dto.items.length,
        completedItems: 0,
        notes: dto.notes || null,
        createdBy: dto.createdBy || userId,
      })
      .returning();

    if (!schedule) {
      throw new Error('Failed to create production schedule');
    }

    // Create production items
    const createdItems = await Promise.all(
      dto.items.map(async (item) => {
        const [created] = await this.databaseService.database
          .insert(productionItems)
          .values({
            scheduleId: schedule.id,
            internalOrderId: item.orderId || null, // Map orderId to internalOrderId for backward compatibility
            customerOrderId: null,
            recipeId: item.recipeId,
            recipeName: item.recipeName,
            quantity: item.quantity,
            status: item.status || ProductionStatus.SCHEDULED,
            scheduledTime: new Date(item.scheduledTime),
            startTime: item.startTime ? new Date(item.startTime) : null,
            completedTime: item.completedTime ? new Date(item.completedTime) : null,
            assignedTo: item.assignedTo || null,
            notes: item.notes || null,
            batchNumber: item.batchNumber || null,
            qualityCheck: item.qualityCheck || false,
            qualityNotes: item.qualityNotes || null,
          })
          .returning();

        return created!;
      }),
    );

    return this.mapToScheduleDto(schedule, createdItems);
  }

  /**
   * Create a production schedule from an internal order
   * Automatically maps order items to production items using their recipes
   */
  async createScheduleFromInternalOrder(
    orderId: string,
    scheduledDate: string,
    userId: string,
  ): Promise<ProductionScheduleDto> {
    // Fetch the order with its items
    const [order] = await this.databaseService.database
      .select()
      .from(internalOrders)
      .where(eq(internalOrders.id, orderId))
      .limit(1);

    if (!order) {
      throw new NotFoundException('Internal order not found');
    }

    // Fetch order items
    const items = await this.databaseService.database
      .select()
      .from(internalOrderItems)
      .where(eq(internalOrderItems.internalOrderId, orderId));

    if (items.length === 0) {
      throw new BadRequestException('Order has no items');
    }

    // For each order item, fetch the product's recipe
    const productionScheduleItems = await Promise.all(
      items.map(async (item) => {
        const [product] = await this.databaseService.database
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!product || !product.recipeId) {
          throw new BadRequestException(
            `Product ${item.productName} does not have a recipe associated`,
          );
        }

        const scheduleItem: any = {
          internalOrderId: orderId,
          recipeId: product.recipeId,
          recipeName: product.recipeName || product.name,
          quantity: item.quantity,
          scheduledTime: new Date(scheduledDate).toISOString(),
        };

        // Only add notes if specialInstructions exists
        if (item.specialInstructions) {
          scheduleItem.notes = item.specialInstructions;
        }

        return scheduleItem;
      }),
    );

    // Create the production schedule
    const scheduleDto: CreateProductionScheduleDto = {
      date: scheduledDate,
      notes: `Created from internal order ${order.orderNumber}`,
      createdBy: userId,
      items: productionScheduleItems,
    };

    const productionSchedule = await this.createSchedule(scheduleDto, userId);

    // Note: Order status will be updated by the caller (frontend)
    // We don't automatically change status here to allow proper workflow control

    this.logger.log(`Created production schedule from internal order ${order.orderNumber}`);

    return productionSchedule;
  }

  /**
   * Create a production schedule from a customer order
   * Automatically maps order items to production items using their recipes
   */
  async createScheduleFromCustomerOrder(
    orderId: string,
    scheduledDate: string,
    userId: string,
  ): Promise<ProductionScheduleDto> {
    // Fetch the order with its items
    const [order] = await this.databaseService.database
      .select()
      .from(customerOrders)
      .where(eq(customerOrders.id, orderId))
      .limit(1);

    if (!order) {
      throw new NotFoundException('Customer order not found');
    }

    // Fetch order items
    const items = await this.databaseService.database
      .select()
      .from(customerOrderItems)
      .where(eq(customerOrderItems.orderId, orderId));

    if (items.length === 0) {
      throw new BadRequestException('Order has no items');
    }

    // For each order item, fetch the product's recipe
    const productionScheduleItems = await Promise.all(
      items.map(async (item) => {
        const [product] = await this.databaseService.database
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!product || !product.recipeId) {
          throw new BadRequestException(
            `Product ${item.productName} does not have a recipe associated`,
          );
        }

        const scheduleItem: any = {
          customerOrderId: orderId,
          recipeId: product.recipeId,
          recipeName: product.recipeName || product.name,
          quantity: item.quantity,
          scheduledTime: new Date(scheduledDate).toISOString(),
        };

        // Only add notes if specialInstructions exists
        if (item.specialInstructions) {
          scheduleItem.notes = item.specialInstructions;
        }

        return scheduleItem;
      }),
    );

    // Create the production schedule
    const scheduleDto: CreateProductionScheduleDto = {
      date: scheduledDate,
      notes: `Created from customer order ${order.orderNumber}`,
      createdBy: userId,
      items: productionScheduleItems,
    };

    const productionSchedule = await this.createSchedule(scheduleDto, userId);

    // Update order status to confirmed (ready for production)
    await this.databaseService.database
      .update(customerOrders)
      .set({
        status: 'confirmed',
        updatedAt: new Date(),
      })
      .where(eq(customerOrders.id, orderId));

    this.logger.log(`Created production schedule from customer order ${order.orderNumber}`);

    return productionSchedule;
  }

  /**
   * Legacy method for backward compatibility - routes to internal orders
   * @deprecated Use createScheduleFromInternalOrder or createScheduleFromCustomerOrder instead
   */
  async createScheduleFromOrder(
    orderId: string,
    scheduledDate: string,
    userId: string,
  ): Promise<ProductionScheduleDto> {
    // Try internal orders first for backward compatibility
    return this.createScheduleFromInternalOrder(orderId, scheduledDate, userId);
  }

  /**
   * Update a production schedule
   */
  async updateSchedule(
    id: string,
    dto: UpdateProductionScheduleDto,
  ): Promise<ProductionScheduleDto> {
    const [existingSchedule] = await this.databaseService.database
      .select()
      .from(productionSchedules)
      .where(eq(productionSchedules.id, id))
      .limit(1);

    if (!existingSchedule) {
      throw new NotFoundException('Production schedule not found');
    }

    // Update schedule
    const [updated] = await this.databaseService.database
      .update(productionSchedules)
      .set({
        date: dto.date || existingSchedule.date,
        notes: dto.notes !== undefined ? dto.notes : existingSchedule.notes,
        updatedAt: new Date(),
      })
      .where(eq(productionSchedules.id, id))
      .returning();

    if (!updated) {
      throw new Error('Failed to update production schedule');
    }

    // If items are provided, update them
    if (dto.items && dto.items.length > 0) {
      // Delete existing items
      await this.databaseService.database
        .delete(productionItems)
        .where(eq(productionItems.scheduleId, id));

      // Create new items
      const newItems = await Promise.all(
        dto.items.map(async (item) => {
          const [created] = await this.databaseService.database
            .insert(productionItems)
            .values({
              scheduleId: id,
              internalOrderId: item.orderId || null, // Map orderId to internalOrderId for backward compatibility
              customerOrderId: null,
              recipeId: item.recipeId,
              recipeName: item.recipeName,
              quantity: item.quantity,
              status: item.status || ProductionStatus.SCHEDULED,
              scheduledTime: new Date(item.scheduledTime),
              startTime: item.startTime ? new Date(item.startTime) : null,
              completedTime: item.completedTime ? new Date(item.completedTime) : null,
              assignedTo: item.assignedTo || null,
              notes: item.notes || null,
              batchNumber: item.batchNumber || null,
              qualityCheck: item.qualityCheck || false,
              qualityNotes: item.qualityNotes || null,
            })
            .returning();

          return created!;
        }),
      );

      // Update totals
      await this.databaseService.database
        .update(productionSchedules)
        .set({
          totalItems: newItems.length,
          completedItems: newItems.filter((i) => i && i.status === ProductionStatus.COMPLETED).length,
        })
        .where(eq(productionSchedules.id, id));

      return this.mapToScheduleDto(updated, newItems);
    }

    // Fetch existing items if not updating
    const items = await this.databaseService.database
      .select()
      .from(productionItems)
      .where(eq(productionItems.scheduleId, id));

    return this.mapToScheduleDto(updated, items);
  }

  /**
   * Delete a production schedule
   */
  async deleteSchedule(id: string): Promise<void> {
    const [schedule] = await this.databaseService.database
      .select()
      .from(productionSchedules)
      .where(eq(productionSchedules.id, id))
      .limit(1);

    if (!schedule) {
      throw new NotFoundException('Production schedule not found');
    }

    await this.databaseService.database
      .delete(productionSchedules)
      .where(eq(productionSchedules.id, id));
  }

  /**
   * Update a production item status
   */
  async updateProductionItem(
    scheduleId: string,
    itemId: string,
    dto: UpdateProductionItemDto,
  ): Promise<ProductionItemDto> {
    const [existingItem] = await this.databaseService.database
      .select()
      .from(productionItems)
      .where(and(eq(productionItems.id, itemId), eq(productionItems.scheduleId, scheduleId)))
      .limit(1);

    if (!existingItem) {
      throw new NotFoundException('Production item not found');
    }

    const [updatedItem] = await this.databaseService.database
      .update(productionItems)
      .set({
        status: dto.status || existingItem.status,
        startTime: dto.startTime ? new Date(dto.startTime) : existingItem.startTime,
        completedTime: dto.completedTime ? new Date(dto.completedTime) : existingItem.completedTime,
        assignedTo: dto.assignedTo !== undefined ? dto.assignedTo : existingItem.assignedTo,
        notes: dto.notes !== undefined ? dto.notes : existingItem.notes,
        batchNumber: dto.batchNumber !== undefined ? dto.batchNumber : existingItem.batchNumber,
        qualityCheck: dto.qualityCheck !== undefined ? dto.qualityCheck : existingItem.qualityCheck,
        qualityNotes: dto.qualityNotes !== undefined ? dto.qualityNotes : existingItem.qualityNotes,
      })
      .where(eq(productionItems.id, itemId))
      .returning();

    if (!updatedItem) {
      throw new Error('Failed to update production item');
    }

    // Update schedule totals
    await this.updateScheduleTotals(scheduleId);

    // If item is completed, deduct inventory
    if (dto.status === ProductionStatus.COMPLETED && existingItem.status !== ProductionStatus.COMPLETED) {
      await this.deductInventoryForRecipe(existingItem.recipeId, existingItem.quantity);

      // If this item is linked to an order, check if all items from that order are completed
      if (updatedItem.internalOrderId) {
        await this.checkAndUpdateInternalOrderStatus(updatedItem.internalOrderId);
      } else if (updatedItem.customerOrderId) {
        await this.checkAndUpdateCustomerOrderStatus(updatedItem.customerOrderId);
      }
    }

    return this.mapToItemDto(updatedItem);
  }

  /**
   * Start production for an item
   */
  async startProduction(scheduleId: string, itemId: string): Promise<ProductionItemDto> {
    return this.updateProductionItem(scheduleId, itemId, {
      status: ProductionStatus.IN_PROGRESS,
      startTime: new Date().toISOString(),
    });
  }

  /**
   * Complete production for an item
   */
  async completeProduction(
    scheduleId: string,
    itemId: string,
    qualityCheck: boolean,
    qualityNotes?: string,
  ): Promise<ProductionItemDto> {
    const updateData: any = {
      status: ProductionStatus.COMPLETED,
      completedTime: new Date().toISOString(),
      qualityCheck,
    };

    if (qualityNotes) {
      updateData.qualityNotes = qualityNotes;
    }

    return this.updateProductionItem(scheduleId, itemId, updateData);
  }

  /**
   * Check inventory availability for production items
   */
  private async checkInventoryAvailability(
    items: { recipeId: string; quantity: number }[],
  ): Promise<string[]> {
    const warnings: string[] = [];

    for (const item of items) {
      const ingredients = await this.databaseService.database
        .select()
        .from(recipeIngredients)
        .where(eq(recipeIngredients.recipeId, item.recipeId));

      for (const ingredient of ingredients) {
        const [inventoryItem] = await this.databaseService.database
          .select()
          .from(inventoryItems)
          .where(eq(inventoryItems.id, ingredient.ingredientId))
          .limit(1);

        if (inventoryItem) {
          const requiredQuantity = parseFloat(ingredient.quantity.toString()) * item.quantity;
          const availableQuantity = parseFloat(inventoryItem.currentStock);

          if (requiredQuantity > availableQuantity) {
            warnings.push(
              `Insufficient ${inventoryItem.name}: need ${requiredQuantity} ${inventoryItem.unit}, have ${availableQuantity} ${inventoryItem.unit}`,
            );
          }
        }
      }
    }

    return warnings;
  }

  /**
   * Deduct inventory for a completed recipe
   */
  private async deductInventoryForRecipe(recipeId: string, multiplier: number): Promise<void> {
    const ingredients = await this.databaseService.database
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipeId));

    for (const ingredient of ingredients) {
      const [inventoryItem] = await this.databaseService.database
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.id, ingredient.ingredientId))
        .limit(1);

      if (inventoryItem) {
        const deductionAmount = parseFloat(ingredient.quantity.toString()) * multiplier;
        const newStock = parseFloat(inventoryItem.currentStock) - deductionAmount;

        await this.databaseService.database
          .update(inventoryItems)
          .set({
            currentStock: Math.max(0, newStock).toString(),
            updatedAt: new Date(),
          })
          .where(eq(inventoryItems.id, ingredient.ingredientId));

        this.logger.log(
          `Deducted ${deductionAmount} ${inventoryItem.unit} of ${inventoryItem.name} for recipe ${recipeId}`,
        );
      }
    }
  }

  /**
   * Update schedule totals
   */
  private async updateScheduleTotals(scheduleId: string): Promise<void> {
    const items = await this.databaseService.database
      .select()
      .from(productionItems)
      .where(eq(productionItems.scheduleId, scheduleId));

    const completedCount = items.filter((i) => i.status === ProductionStatus.COMPLETED).length;

    await this.databaseService.database
      .update(productionSchedules)
      .set({
        completedItems: completedCount,
        updatedAt: new Date(),
      })
      .where(eq(productionSchedules.id, scheduleId));
  }

  /**
   * Check if all production items for an internal order are completed and update order status
   */
  private async checkAndUpdateInternalOrderStatus(orderId: string): Promise<void> {
    // Get all production items linked to this internal order
    const orderProductionItems = await this.databaseService.database
      .select()
      .from(productionItems)
      .where(eq(productionItems.internalOrderId, orderId));

    // Check if all items are completed
    const allCompleted = orderProductionItems.every(
      (item) => item.status === ProductionStatus.COMPLETED,
    );

    if (allCompleted && orderProductionItems.length > 0) {
      // Update internal order status to completed
      await this.databaseService.database
        .update(internalOrders)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(internalOrders.id, orderId));

      this.logger.log(`Internal order ${orderId} marked as completed - all production items finished`);
    }
  }

  /**
   * Check if all production items for a customer order are completed and update order status
   */
  private async checkAndUpdateCustomerOrderStatus(orderId: string): Promise<void> {
    // Get all production items linked to this customer order
    const orderProductionItems = await this.databaseService.database
      .select()
      .from(productionItems)
      .where(eq(productionItems.customerOrderId, orderId));

    // Check if all items are completed
    const allCompleted = orderProductionItems.every(
      (item) => item.status === ProductionStatus.COMPLETED,
    );

    if (allCompleted && orderProductionItems.length > 0) {
      // Update customer order status to ready (not completed, as delivery is needed)
      await this.databaseService.database
        .update(customerOrders)
        .set({
          status: 'ready',
          updatedAt: new Date(),
        })
        .where(eq(customerOrders.id, orderId));

      this.logger.log(`Customer order ${orderId} marked as ready - all production items finished`);
    }
  }

  /**
   * Map database model to DTO
   */
  private mapToScheduleDto(
    schedule: typeof productionSchedules.$inferSelect,
    items: (typeof productionItems.$inferSelect)[],
  ): ProductionScheduleDto {
    return {
      id: schedule.id,
      date: schedule.date,
      total_items: schedule.totalItems,
      completed_items: schedule.completedItems,
      notes: schedule.notes,
      created_by: schedule.createdBy,
      created_at: schedule.createdAt.toISOString(),
      updated_at: schedule.updatedAt.toISOString(),
      items: items.map((item) => this.mapToItemDto(item)),
    };
  }

  /**
   * Map production item to DTO
   */
  private mapToItemDto(item: typeof productionItems.$inferSelect): ProductionItemDto {
    return {
      id: item.id,
      schedule_id: item.scheduleId,
      order_id: item.internalOrderId || item.customerOrderId || null, // Map both order types to order_id for backward compatibility
      recipe_id: item.recipeId,
      recipe_name: item.recipeName,
      quantity: item.quantity,
      status: item.status as ProductionStatus,
      scheduled_time: item.scheduledTime.toISOString(),
      start_time: item.startTime?.toISOString() || null,
      completed_time: item.completedTime?.toISOString() || null,
      assigned_to: item.assignedTo,
      notes: item.notes,
      batch_number: item.batchNumber,
      quality_check: item.qualityCheck !== null ? item.qualityCheck : false,
      quality_notes: item.qualityNotes,
    };
  }
}
