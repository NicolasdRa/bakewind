import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { eq, and, or, desc, sql, ilike } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { customerOrders, customerOrderItems } from '../database/schemas';
import { CreateOrderDto, UpdateOrderDto, OrderStatus } from './dto';
import { RealtimeService } from '../realtime/realtime.service';

export interface OrderWithItems {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  source: 'online' | 'phone' | 'walk_in' | 'wholesale';
  status: string;
  priority: string;
  paymentStatus: string;
  subtotal: string;
  tax: string;
  discount: string | null;
  total: string;
  pickupTime: Date | null;
  deliveryTime: Date | null;
  specialRequests: string | null;
  notes: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: string;
    specialInstructions: string | null;
    customizations: Record<string, any> | null;
  }>;
}

@Injectable()
export class OrdersService {
  // Define valid status transitions for customer orders
  private readonly statusTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.DRAFT]: [OrderStatus.PENDING, OrderStatus.CANCELLED],
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.READY, OrderStatus.CANCELLED],
    [OrderStatus.READY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
  };

  constructor(
    private readonly databaseService: DatabaseService,
    @Inject(forwardRef(() => RealtimeService))
    private readonly realtimeService: RealtimeService,
  ) {}

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
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

  async getAllOrders(params?: {
    status?: OrderStatus;
    search?: string;
  }): Promise<OrderWithItems[]> {
    const conditions: any[] = [];

    if (params?.status) {
      conditions.push(eq(customerOrders.status, params.status));
    }

    if (params?.search) {
      conditions.push(
        or(
          ilike(customerOrders.orderNumber, `%${params.search}%`),
          ilike(customerOrders.customerName, `%${params.search}%`),
          ilike(customerOrders.customerEmail, `%${params.search}%`),
          ilike(customerOrders.customerPhone, `%${params.search}%`),
        ),
      );
    }

    const ordersData = await this.databaseService.database
      .select()
      .from(customerOrders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(customerOrders.createdAt));

    const ordersWithItems: OrderWithItems[] = await Promise.all(
      ordersData.map(async (order) => {
        const items = await this.databaseService.database
          .select()
          .from(customerOrderItems)
          .where(eq(customerOrderItems.orderId, order.id));

        return {
          ...order,
          items,
        };
      }),
    );

    return ordersWithItems;
  }

  async getOrderById(orderId: string): Promise<OrderWithItems> {
    const [order] = await this.databaseService.database
      .select()
      .from(customerOrders)
      .where(eq(customerOrders.id, orderId))
      .limit(1);

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const items = await this.databaseService.database
      .select()
      .from(customerOrderItems)
      .where(eq(customerOrderItems.orderId, order.id));

    return {
      ...order,
      items,
    };
  }

  async getOrderByNumber(orderNumber: string): Promise<OrderWithItems> {
    const [order] = await this.databaseService.database
      .select()
      .from(customerOrders)
      .where(eq(customerOrders.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      throw new NotFoundException(`Order ${orderNumber} not found`);
    }

    const items = await this.databaseService.database
      .select()
      .from(customerOrderItems)
      .where(eq(customerOrderItems.orderId, order.id));

    return {
      ...order,
      items,
    };
  }

  async createOrder(createOrderDto: CreateOrderDto): Promise<OrderWithItems> {
    const [existingOrder] = await this.databaseService.database
      .select()
      .from(customerOrders)
      .where(eq(customerOrders.orderNumber, createOrderDto.orderNumber))
      .limit(1);

    if (existingOrder) {
      throw new ConflictException(
        `Order with number ${createOrderDto.orderNumber} already exists`,
      );
    }

    const [newOrder] = await this.databaseService.database
      .insert(customerOrders)
      .values({
        orderNumber: createOrderDto.orderNumber,
        customerId: createOrderDto.customerId || null,
        customerName: createOrderDto.customerName,
        customerPhone: createOrderDto.customerPhone || null,
        customerEmail: createOrderDto.customerEmail || null,
        source: createOrderDto.source,
        status: createOrderDto.status || 'pending',
        priority: createOrderDto.priority || 'normal',
        paymentStatus: createOrderDto.paymentStatus || 'pending',
        subtotal: createOrderDto.subtotal,
        tax: createOrderDto.tax,
        discount: createOrderDto.discount || '0',
        total: createOrderDto.total,
        pickupTime: createOrderDto.pickupTime
          ? new Date(createOrderDto.pickupTime)
          : null,
        deliveryTime: createOrderDto.deliveryTime
          ? new Date(createOrderDto.deliveryTime)
          : null,
        specialRequests: createOrderDto.specialRequests || null,
        notes: createOrderDto.notes || null,
        updatedAt: new Date(),
      })
      .returning();

    if (!newOrder) {
      throw new Error('Failed to create order');
    }

    const items = await this.databaseService.database
      .insert(customerOrderItems)
      .values(
        createOrderDto.items.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          specialInstructions: item.specialInstructions || null,
          customizations: item.customizations || null,
        })),
      )
      .returning();

    const orderWithItems = {
      ...newOrder,
      items,
    };

    this.realtimeService.broadcastToAll('customer-order:created', {
      order_id: newOrder.id,
      order_number: newOrder.orderNumber,
      status: newOrder.status,
    });

    return orderWithItems;
  }

  async updateOrder(
    orderId: string,
    updateOrderDto: UpdateOrderDto,
    userId: string,
  ): Promise<OrderWithItems> {
    const [existingOrder] = await this.databaseService.database
      .select()
      .from(customerOrders)
      .where(eq(customerOrders.id, orderId))
      .limit(1);

    if (!existingOrder) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (updateOrderDto.status) {
      this.validateStatusTransition(
        existingOrder.status as OrderStatus,
        updateOrderDto.status,
      );
    }

    const completedAt =
      updateOrderDto.status === 'delivered'
        ? new Date()
        : existingOrder.completedAt;

    const [updatedOrder] = await this.databaseService.database
      .update(customerOrders)
      .set({
        ...updateOrderDto,
        pickupTime: updateOrderDto.pickupTime
          ? new Date(updateOrderDto.pickupTime)
          : undefined,
        deliveryTime: updateOrderDto.deliveryTime
          ? new Date(updateOrderDto.deliveryTime)
          : undefined,
        completedAt,
        updatedAt: new Date(),
      })
      .where(eq(customerOrders.id, orderId))
      .returning();

    if (!updatedOrder) {
      throw new Error('Failed to update order');
    }

    const items = await this.databaseService.database
      .select()
      .from(customerOrderItems)
      .where(eq(customerOrderItems.orderId, updatedOrder.id));

    const orderWithItems = {
      ...updatedOrder,
      items,
    };

    this.realtimeService.broadcastToAll('customer-order:updated', {
      order_id: updatedOrder.id,
      order_number: updatedOrder.orderNumber,
      changes: updateOrderDto,
    });

    return orderWithItems;
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    userId: string,
  ): Promise<OrderWithItems> {
    const [existingOrder] = await this.databaseService.database
      .select()
      .from(customerOrders)
      .where(eq(customerOrders.id, orderId))
      .limit(1);

    if (!existingOrder) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    this.validateStatusTransition(existingOrder.status as OrderStatus, status);

    const completedAt =
      status === 'delivered' ? new Date() : existingOrder.completedAt;

    const [updatedOrder] = await this.databaseService.database
      .update(customerOrders)
      .set({
        status,
        completedAt,
        updatedAt: new Date(),
      })
      .where(eq(customerOrders.id, orderId))
      .returning();

    if (!updatedOrder) {
      throw new Error('Failed to update order status');
    }

    const items = await this.databaseService.database
      .select()
      .from(customerOrderItems)
      .where(eq(customerOrderItems.orderId, updatedOrder.id));

    const orderWithItems = {
      ...updatedOrder,
      items,
    };

    this.realtimeService.broadcastToAll('customer-order:status-changed', {
      order_id: updatedOrder.id,
      order_number: updatedOrder.orderNumber,
      old_status: existingOrder.status,
      new_status: status,
      completed_at: completedAt?.toISOString() || null,
    });

    return orderWithItems;
  }

  async deleteOrder(orderId: string, userId: string): Promise<void> {
    const [existingOrder] = await this.databaseService.database
      .select()
      .from(customerOrders)
      .where(eq(customerOrders.id, orderId))
      .limit(1);

    if (!existingOrder) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    await this.databaseService.database
      .delete(customerOrderItems)
      .where(eq(customerOrderItems.orderId, orderId));

    await this.databaseService.database
      .delete(customerOrders)
      .where(eq(customerOrders.id, orderId));

    this.realtimeService.broadcastToAll('customer-order:deleted', {
      order_id: orderId,
      order_number: existingOrder.orderNumber,
    });
  }

  async getOrderStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: string;
  }> {
    const [stats] = await this.databaseService.database
      .select({
        totalOrders: sql<number>`count(*)::int`,
        pendingOrders: sql<number>`count(*) filter (where ${customerOrders.status} in ('pending', 'confirmed', 'ready'))::int`,
        completedOrders: sql<number>`count(*) filter (where ${customerOrders.status} = 'delivered')::int`,
        totalRevenue: sql<string>`coalesce(sum(${customerOrders.total}::decimal), 0)::text`,
      })
      .from(customerOrders);

    return (
      stats || {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: '0',
      }
    );
  }
}
