import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { eq, and, or, desc, sql, ilike } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { internalOrders, internalOrderItems } from '../database/schemas';
import {
  CreateInternalOrderDto,
  UpdateInternalOrderDto,
  InternalOrderStatus,
  InternalOrderSource,
} from './dto';
import { OrderLocksService } from '../order-locks/order-locks.service';
import { RealtimeService } from '../realtime/realtime.service';

export interface InternalOrderWithItems {
  id: string;
  orderNumber: string;
  source: string;
  status: string;
  priority: string;
  requestedBy: string;
  requestedByEmail: string | null;
  department: string;
  totalCost: string | null;
  requestedDate: Date;
  neededByDate: Date;
  approvedBy: string | null;
  approvedAt: Date | null;
  completedAt: Date | null;
  deliveredAt: Date | null;
  specialInstructions: string | null;
  notes: string | null;
  // Production fields
  productionDate: Date | null;
  productionShift: string | null;
  batchNumber: string | null;
  assignedStaff: string | null;
  workstation: string | null;
  targetQuantity: number | null;
  actualQuantity: number | null;
  wasteQuantity: number | null;
  qualityNotes: string | null;
  // Recurring fields
  isRecurring: boolean | null;
  recurringFrequency: string | null;
  nextOrderDate: Date | null;
  recurringEndDate: Date | null;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    internalOrderId: string;
    productId: string;
    productName: string;
    quantity: number;
    unitCost: string | null;
    specialInstructions: string | null;
    customizations: Record<string, any> | null;
  }>;
}

@Injectable()
export class InternalOrdersService {
  // Define valid status transitions for internal orders
  private readonly statusTransitions: Record<
    InternalOrderStatus,
    InternalOrderStatus[]
  > = {
    [InternalOrderStatus.DRAFT]: [
      InternalOrderStatus.REQUESTED,
      InternalOrderStatus.CANCELLED,
    ],
    [InternalOrderStatus.REQUESTED]: [
      InternalOrderStatus.APPROVED,
      InternalOrderStatus.CANCELLED,
    ],
    [InternalOrderStatus.APPROVED]: [
      InternalOrderStatus.SCHEDULED,
      InternalOrderStatus.CANCELLED,
    ],
    [InternalOrderStatus.SCHEDULED]: [
      InternalOrderStatus.IN_PRODUCTION,
      InternalOrderStatus.CANCELLED,
    ],
    [InternalOrderStatus.IN_PRODUCTION]: [
      InternalOrderStatus.QUALITY_CHECK,
      InternalOrderStatus.CANCELLED,
    ],
    [InternalOrderStatus.QUALITY_CHECK]: [
      InternalOrderStatus.READY,
      InternalOrderStatus.IN_PRODUCTION,
      InternalOrderStatus.CANCELLED,
    ],
    [InternalOrderStatus.READY]: [
      InternalOrderStatus.COMPLETED,
      InternalOrderStatus.DELIVERED,
    ],
    [InternalOrderStatus.COMPLETED]: [InternalOrderStatus.DELIVERED],
    [InternalOrderStatus.DELIVERED]: [],
    [InternalOrderStatus.CANCELLED]: [],
  };

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly orderLocksService: OrderLocksService,
    @Inject(forwardRef(() => RealtimeService))
    private readonly realtimeService: RealtimeService,
  ) {}

  private validateStatusTransition(
    currentStatus: InternalOrderStatus,
    newStatus: InternalOrderStatus,
  ): void {
    if (currentStatus === newStatus) {
      return;
    }

    const allowedTransitions = this.statusTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition: cannot change from "${currentStatus}" to "${newStatus}". Allowed transitions: ${allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'none'}`,
      );
    }
  }

  private async validateOrderLock(
    orderId: string,
    userId: string,
  ): Promise<void> {
    try {
      const lockStatus = await this.orderLocksService.getLockStatus(orderId);

      if ('locked_by_user_id' in lockStatus) {
        if (lockStatus.locked_by_user_id !== userId) {
          throw new ForbiddenException(
            `Order is locked by ${lockStatus.locked_by_user_name}. You cannot modify it until the lock is released.`,
          );
        }
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      console.warn(
        `Lock validation warning for order ${orderId}:`,
        error.message,
      );
    }
  }

  async getAllOrders(params?: {
    source?: InternalOrderSource;
    status?: InternalOrderStatus;
    search?: string;
  }): Promise<InternalOrderWithItems[]> {
    const conditions: any[] = [];

    if (params?.source) {
      conditions.push(eq(internalOrders.source, params.source));
    }

    if (params?.status) {
      conditions.push(eq(internalOrders.status, params.status));
    }

    if (params?.search) {
      conditions.push(
        or(
          ilike(internalOrders.orderNumber, `%${params.search}%`),
          ilike(internalOrders.requestedBy, `%${params.search}%`),
          ilike(internalOrders.department, `%${params.search}%`),
        ),
      );
    }

    const ordersData = await this.databaseService.database
      .select()
      .from(internalOrders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(internalOrders.createdAt));

    const ordersWithItems: InternalOrderWithItems[] = await Promise.all(
      ordersData.map(async (order) => {
        const items = await this.databaseService.database
          .select()
          .from(internalOrderItems)
          .where(eq(internalOrderItems.internalOrderId, order.id));

        return {
          ...order,
          items,
        };
      }),
    );

    return ordersWithItems;
  }

  async getOrderById(orderId: string): Promise<InternalOrderWithItems> {
    const [order] = await this.databaseService.database
      .select()
      .from(internalOrders)
      .where(eq(internalOrders.id, orderId))
      .limit(1);

    if (!order) {
      throw new NotFoundException(
        `Internal order with ID ${orderId} not found`,
      );
    }

    const items = await this.databaseService.database
      .select()
      .from(internalOrderItems)
      .where(eq(internalOrderItems.internalOrderId, order.id));

    return {
      ...order,
      items,
    };
  }

  async getOrderByNumber(orderNumber: string): Promise<InternalOrderWithItems> {
    const [order] = await this.databaseService.database
      .select()
      .from(internalOrders)
      .where(eq(internalOrders.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      throw new NotFoundException(`Internal order ${orderNumber} not found`);
    }

    const items = await this.databaseService.database
      .select()
      .from(internalOrderItems)
      .where(eq(internalOrderItems.internalOrderId, order.id));

    return {
      ...order,
      items,
    };
  }

  async createOrder(
    createOrderDto: CreateInternalOrderDto,
  ): Promise<InternalOrderWithItems> {
    const [existingOrder] = await this.databaseService.database
      .select()
      .from(internalOrders)
      .where(eq(internalOrders.orderNumber, createOrderDto.orderNumber))
      .limit(1);

    if (existingOrder) {
      throw new ConflictException(
        `Internal order with number ${createOrderDto.orderNumber} already exists`,
      );
    }

    const [newOrder] = await this.databaseService.database
      .insert(internalOrders)
      .values({
        orderNumber: createOrderDto.orderNumber,
        source: createOrderDto.source,
        status: createOrderDto.status || 'draft',
        priority: createOrderDto.priority || 'normal',
        requestedBy: createOrderDto.requestedBy,
        requestedByEmail: createOrderDto.requestedByEmail || null,
        department: createOrderDto.department,
        totalCost: createOrderDto.totalCost || null,
        requestedDate: new Date(createOrderDto.requestedDate),
        neededByDate: new Date(createOrderDto.neededByDate),
        approvedBy: createOrderDto.approvedBy || null,
        approvedAt: createOrderDto.approvedAt
          ? new Date(createOrderDto.approvedAt)
          : null,
        specialInstructions: createOrderDto.specialInstructions || null,
        notes: createOrderDto.notes || null,
        // Production fields
        productionDate: createOrderDto.productionDate
          ? new Date(createOrderDto.productionDate)
          : null,
        productionShift: createOrderDto.productionShift || null,
        batchNumber: createOrderDto.batchNumber || null,
        assignedStaff: createOrderDto.assignedStaff || null,
        workstation: createOrderDto.workstation || null,
        targetQuantity: createOrderDto.targetQuantity || null,
        actualQuantity: createOrderDto.actualQuantity || null,
        wasteQuantity: createOrderDto.wasteQuantity || null,
        qualityNotes: createOrderDto.qualityNotes || null,
        // Recurring fields
        isRecurring: createOrderDto.isRecurring || false,
        recurringFrequency: createOrderDto.recurringFrequency || null,
        nextOrderDate: createOrderDto.nextOrderDate
          ? new Date(createOrderDto.nextOrderDate)
          : null,
        recurringEndDate: createOrderDto.recurringEndDate
          ? new Date(createOrderDto.recurringEndDate)
          : null,
        updatedAt: new Date(),
      })
      .returning();

    if (!newOrder) {
      throw new Error('Failed to create internal order');
    }

    const items = await this.databaseService.database
      .insert(internalOrderItems)
      .values(
        createOrderDto.items.map((item) => ({
          internalOrderId: newOrder.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitCost: item.unitCost || null,
          specialInstructions: item.specialInstructions || null,
          customizations: item.customizations || null,
        })),
      )
      .returning();

    const orderWithItems = {
      ...newOrder,
      items,
    };

    this.realtimeService.broadcastToAll('internal-order:created', {
      order_id: newOrder.id,
      order_number: newOrder.orderNumber,
      source: newOrder.source,
      status: newOrder.status,
    });

    return orderWithItems;
  }

  async updateOrder(
    orderId: string,
    updateOrderDto: UpdateInternalOrderDto,
    userId: string,
  ): Promise<InternalOrderWithItems> {
    const [existingOrder] = await this.databaseService.database
      .select()
      .from(internalOrders)
      .where(eq(internalOrders.id, orderId))
      .limit(1);

    if (!existingOrder) {
      throw new NotFoundException(
        `Internal order with ID ${orderId} not found`,
      );
    }

    await this.validateOrderLock(orderId, userId);

    if (updateOrderDto.status) {
      this.validateStatusTransition(
        existingOrder.status as InternalOrderStatus,
        updateOrderDto.status,
      );
    }

    const completedAt =
      updateOrderDto.status === 'completed' ||
      updateOrderDto.status === 'delivered'
        ? new Date()
        : existingOrder.completedAt;

    const deliveredAt =
      updateOrderDto.status === 'delivered'
        ? new Date()
        : existingOrder.deliveredAt;

    const [updatedOrder] = await this.databaseService.database
      .update(internalOrders)
      .set({
        ...updateOrderDto,
        neededByDate: updateOrderDto.neededByDate
          ? new Date(updateOrderDto.neededByDate)
          : undefined,
        approvedAt: updateOrderDto.approvedAt
          ? new Date(updateOrderDto.approvedAt)
          : undefined,
        productionDate: updateOrderDto.productionDate
          ? new Date(updateOrderDto.productionDate)
          : undefined,
        nextOrderDate: updateOrderDto.nextOrderDate
          ? new Date(updateOrderDto.nextOrderDate)
          : undefined,
        recurringEndDate: updateOrderDto.recurringEndDate
          ? new Date(updateOrderDto.recurringEndDate)
          : undefined,
        completedAt,
        deliveredAt,
        updatedAt: new Date(),
      })
      .where(eq(internalOrders.id, orderId))
      .returning();

    if (!updatedOrder) {
      throw new Error('Failed to update internal order');
    }

    const items = await this.databaseService.database
      .select()
      .from(internalOrderItems)
      .where(eq(internalOrderItems.internalOrderId, updatedOrder.id));

    const orderWithItems = {
      ...updatedOrder,
      items,
    };

    this.realtimeService.broadcastToAll('internal-order:updated', {
      order_id: updatedOrder.id,
      order_number: updatedOrder.orderNumber,
      changes: updateOrderDto,
    });

    return orderWithItems;
  }

  async updateOrderStatus(
    orderId: string,
    status: InternalOrderStatus,
    userId: string,
  ): Promise<InternalOrderWithItems> {
    const [existingOrder] = await this.databaseService.database
      .select()
      .from(internalOrders)
      .where(eq(internalOrders.id, orderId))
      .limit(1);

    if (!existingOrder) {
      throw new NotFoundException(
        `Internal order with ID ${orderId} not found`,
      );
    }

    await this.validateOrderLock(orderId, userId);

    this.validateStatusTransition(
      existingOrder.status as InternalOrderStatus,
      status,
    );

    const completedAt =
      status === 'completed' || status === 'delivered'
        ? new Date()
        : existingOrder.completedAt;
    const deliveredAt =
      status === 'delivered' ? new Date() : existingOrder.deliveredAt;

    const [updatedOrder] = await this.databaseService.database
      .update(internalOrders)
      .set({
        status,
        completedAt,
        deliveredAt,
        updatedAt: new Date(),
      })
      .where(eq(internalOrders.id, orderId))
      .returning();

    if (!updatedOrder) {
      throw new Error('Failed to update internal order status');
    }

    const items = await this.databaseService.database
      .select()
      .from(internalOrderItems)
      .where(eq(internalOrderItems.internalOrderId, updatedOrder.id));

    const orderWithItems = {
      ...updatedOrder,
      items,
    };

    this.realtimeService.broadcastToAll('internal-order:status-changed', {
      order_id: updatedOrder.id,
      order_number: updatedOrder.orderNumber,
      old_status: existingOrder.status,
      new_status: status,
    });

    return orderWithItems;
  }

  async deleteOrder(orderId: string, userId: string): Promise<void> {
    const [existingOrder] = await this.databaseService.database
      .select()
      .from(internalOrders)
      .where(eq(internalOrders.id, orderId))
      .limit(1);

    if (!existingOrder) {
      throw new NotFoundException(
        `Internal order with ID ${orderId} not found`,
      );
    }

    await this.validateOrderLock(orderId, userId);

    await this.databaseService.database
      .delete(internalOrderItems)
      .where(eq(internalOrderItems.internalOrderId, orderId));

    await this.databaseService.database
      .delete(internalOrders)
      .where(eq(internalOrders.id, orderId));

    this.realtimeService.broadcastToAll('internal-order:deleted', {
      order_id: orderId,
      order_number: existingOrder.orderNumber,
    });
  }

  async getOrderStats(source?: InternalOrderSource): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
  }> {
    const conditions: any[] = [];

    if (source) {
      conditions.push(eq(internalOrders.source, source));
    }

    const [stats] = await this.databaseService.database
      .select({
        totalOrders: sql<number>`count(*)::int`,
        pendingOrders: sql<number>`count(*) filter (where ${internalOrders.status} in ('requested', 'approved', 'scheduled', 'in_production'))::int`,
        completedOrders: sql<number>`count(*) filter (where ${internalOrders.status} in ('completed', 'delivered'))::int`,
      })
      .from(internalOrders)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return stats || { totalOrders: 0, pendingOrders: 0, completedOrders: 0 };
  }
}
