import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, ilike, or, sql, SQL, desc, asc, gte } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { customers } from '../database/schemas/customers.schema';
import {
  customerOrders,
  customerOrderItems,
} from '../database/schemas/orders.schema';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
  CustomerQueryDto,
} from './dto/customers.dto';

interface CustomerWithStats {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  phone: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  customerType: 'individual' | 'business';
  companyName: string | null;
  taxId: string | null;
  preferredContact: 'email' | 'phone' | 'text' | null;
  marketingOptIn: boolean;
  status: 'active' | 'inactive';
  notes: string | null;
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: Date | null;
}

@Injectable()
export class CustomersService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get all customers for a user with filtering, pagination, and sorting
   */
  async findAllByUser(userId: string, query: CustomerQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    // Build filter conditions
    const conditions: SQL[] = [eq(customers.userId, userId)];

    // Filter by status
    if (query.status) {
      conditions.push(eq(customers.status, query.status));
    }

    // Filter by customer type
    if (query.customerType) {
      conditions.push(eq(customers.customerType, query.customerType));
    }

    // Search by name, email, phone, or company name
    if (query.search) {
      const searchTerm = `%${query.search}%`;
      const searchCondition = or(
        ilike(customers.name, searchTerm),
        ilike(customers.email, searchTerm),
        ilike(customers.phone, searchTerm),
        ilike(customers.companyName, searchTerm),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Get total count
    const [countResult] = await this.databaseService.database
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(and(...conditions));

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // Build order by clause
    const sortOrder = query.sortOrder === 'desc' ? desc : asc;
    let orderByClause: ReturnType<typeof sortOrder>;

    switch (query.sortBy) {
      case 'email':
        orderByClause = sortOrder(customers.email);
        break;
      case 'createdAt':
        orderByClause = sortOrder(customers.createdAt);
        break;
      default:
        orderByClause = sortOrder(customers.name);
    }

    // Fetch customers with order statistics using a subquery
    const customerList = await this.databaseService.database
      .select({
        id: customers.id,
        userId: customers.userId,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        addressLine1: customers.addressLine1,
        addressLine2: customers.addressLine2,
        city: customers.city,
        state: customers.state,
        zipCode: customers.zipCode,
        customerType: customers.customerType,
        companyName: customers.companyName,
        taxId: customers.taxId,
        preferredContact: customers.preferredContact,
        marketingOptIn: customers.marketingOptIn,
        status: customers.status,
        notes: customers.notes,
        loyaltyPoints: customers.loyaltyPoints,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
      })
      .from(customers)
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // Get order statistics for each customer
    const customersWithStats = await Promise.all(
      customerList.map(async (customer) => {
        const stats = await this.getCustomerOrderStats(customer.id);
        return {
          ...customer,
          ...stats,
        };
      }),
    );

    return {
      customers: customersWithStats.map((c) => this.mapToResponseDto(c)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get a single customer by ID with ownership check
   */
  async findByIdAndUser(
    customerId: string,
    userId: string,
  ): Promise<CustomerResponseDto> {
    const [customer] = await this.databaseService.database
      .select()
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.userId, userId)));

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const stats = await this.getCustomerOrderStats(customerId);

    return this.mapToResponseDto({
      ...customer,
      ...stats,
    });
  }

  /**
   * Create a new customer
   */
  async create(
    userId: string,
    dto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const [created] = await this.databaseService.database
      .insert(customers)
      .values({
        userId,
        name: dto.name,
        email: dto.email || null,
        phone: dto.phone,
        addressLine1: dto.addressLine1 || null,
        addressLine2: dto.addressLine2 || null,
        city: dto.city || null,
        state: dto.state || null,
        zipCode: dto.zipCode || null,
        customerType: dto.customerType || 'business',
        companyName: dto.companyName || null,
        taxId: dto.taxId || null,
        preferredContact: dto.preferredContact || null,
        marketingOptIn: dto.marketingOptIn || false,
        notes: dto.notes || null,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create customer');
    }

    return this.mapToResponseDto({
      ...created,
      totalOrders: 0,
      totalSpent: 0,
      lastOrderAt: null,
    });
  }

  /**
   * Update an existing customer
   */
  async updateByIdAndUser(
    customerId: string,
    userId: string,
    dto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    // Verify ownership
    await this.findByIdAndUser(customerId, userId);

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    // Only update provided fields
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.addressLine1 !== undefined)
      updateData.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== undefined)
      updateData.addressLine2 = dto.addressLine2;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.state !== undefined) updateData.state = dto.state;
    if (dto.zipCode !== undefined) updateData.zipCode = dto.zipCode;
    if (dto.customerType !== undefined)
      updateData.customerType = dto.customerType;
    if (dto.companyName !== undefined) updateData.companyName = dto.companyName;
    if (dto.taxId !== undefined) updateData.taxId = dto.taxId;
    if (dto.preferredContact !== undefined)
      updateData.preferredContact = dto.preferredContact;
    if (dto.marketingOptIn !== undefined)
      updateData.marketingOptIn = dto.marketingOptIn;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const [updated] = await this.databaseService.database
      .update(customers)
      .set(updateData)
      .where(and(eq(customers.id, customerId), eq(customers.userId, userId)))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const stats = await this.getCustomerOrderStats(customerId);

    return this.mapToResponseDto({
      ...updated,
      ...stats,
    });
  }

  /**
   * Delete a customer (soft delete by setting status to inactive, or hard delete if no orders)
   */
  async deleteByIdAndUser(customerId: string, userId: string): Promise<void> {
    // Verify ownership
    await this.findByIdAndUser(customerId, userId);

    // Check if customer has orders
    const [orderCount] = await this.databaseService.database
      .select({ count: sql<number>`count(*)::int` })
      .from(customerOrders)
      .where(eq(customerOrders.customerId, customerId));

    if (orderCount && orderCount.count > 0) {
      // Soft delete: set status to inactive
      await this.databaseService.database
        .update(customers)
        .set({ status: 'inactive', updatedAt: new Date() })
        .where(and(eq(customers.id, customerId), eq(customers.userId, userId)));
    } else {
      // Hard delete: remove the customer
      await this.databaseService.database
        .delete(customers)
        .where(and(eq(customers.id, customerId), eq(customers.userId, userId)));
    }
  }

  /**
   * Get customer orders with pagination
   */
  async getCustomerOrders(
    customerId: string,
    userId: string,
    options: { page?: number; limit?: number; status?: string },
  ) {
    // Verify ownership
    await this.findByIdAndUser(customerId, userId);

    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const offset = (page - 1) * limit;

    // Get orders for this customer
    const orders = await this.databaseService.database
      .select()
      .from(customerOrders)
      .where(eq(customerOrders.customerId, customerId))
      .orderBy(desc(customerOrders.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [countResult] = await this.databaseService.database
      .select({ count: sql<number>`count(*)::int` })
      .from(customerOrders)
      .where(eq(customerOrders.customerId, customerId));

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // Get summary stats
    const stats = await this.getCustomerOrderStats(customerId);

    return {
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: parseFloat(order.total),
        createdAt: order.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      summary: {
        totalOrders: stats.totalOrders,
        totalSpent: stats.totalSpent,
        averageOrderValue:
          stats.totalOrders > 0 ? stats.totalSpent / stats.totalOrders : 0,
        lastOrderDate: stats.lastOrderAt?.toISOString() || null,
      },
    };
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(
    customerId: string,
    userId: string,
    period: string,
  ) {
    // Verify ownership
    await this.findByIdAndUser(customerId, userId);
    const stats = await this.getCustomerOrderStats(customerId);

    // Determine date range based on period
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get first and last order dates
    const [firstOrder] = await this.databaseService.database
      .select({ createdAt: customerOrders.createdAt })
      .from(customerOrders)
      .where(eq(customerOrders.customerId, customerId))
      .orderBy(asc(customerOrders.createdAt))
      .limit(1);

    // Get all order dates for frequency calculation
    const orderDates = await this.databaseService.database
      .select({ createdAt: customerOrders.createdAt })
      .from(customerOrders)
      .where(eq(customerOrders.customerId, customerId))
      .orderBy(asc(customerOrders.createdAt));

    // Calculate average days between orders
    let avgDaysBetween = 0;
    if (orderDates.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < orderDates.length; i++) {
        const prev = orderDates[i - 1]!.createdAt;
        const curr = orderDates[i]!.createdAt;
        const daysDiff = Math.floor(
          (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
        );
        intervals.push(daysDiff);
      }
      avgDaysBetween = Math.round(
        intervals.reduce((a, b) => a + b, 0) / intervals.length,
      );
    }

    // Get favorite products (top 5 by quantity ordered)
    const favoriteProducts = await this.databaseService.database
      .select({
        productName: customerOrderItems.productName,
        orderCount: sql<number>`count(distinct ${customerOrderItems.orderId})::int`,
        totalQuantity: sql<number>`sum(${customerOrderItems.quantity})::int`,
      })
      .from(customerOrderItems)
      .innerJoin(
        customerOrders,
        eq(customerOrderItems.orderId, customerOrders.id),
      )
      .where(eq(customerOrders.customerId, customerId))
      .groupBy(customerOrderItems.productName)
      .orderBy(desc(sql`sum(${customerOrderItems.quantity})`))
      .limit(5);

    // Get preferred order days (day of week analysis)
    const orderDayStats = await this.databaseService.database
      .select({
        dayOfWeek: sql<number>`extract(dow from ${customerOrders.createdAt})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(customerOrders)
      .where(eq(customerOrders.customerId, customerId))
      .groupBy(sql`extract(dow from ${customerOrders.createdAt})`)
      .orderBy(desc(sql`count(*)`));

    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const preferredOrderDays = orderDayStats
      .slice(0, 3)
      .map((d) => dayNames[d.dayOfWeek] || 'Unknown');

    // Get monthly orders for the period
    const monthlyOrders = await this.databaseService.database
      .select({
        month: sql<string>`to_char(${customerOrders.createdAt}, 'YYYY-MM')`,
        orderCount: sql<number>`count(*)::int`,
        totalAmount: sql<number>`sum(${customerOrders.total}::numeric)::float`,
      })
      .from(customerOrders)
      .where(
        and(
          eq(customerOrders.customerId, customerId),
          gte(customerOrders.createdAt, startDate),
        ),
      )
      .groupBy(sql`to_char(${customerOrders.createdAt}, 'YYYY-MM')`)
      .orderBy(asc(sql`to_char(${customerOrders.createdAt}, 'YYYY-MM')`));

    // Calculate order value trend
    let orderValueTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (monthlyOrders.length >= 3) {
      const recentMonths = monthlyOrders.slice(-3);
      const avgValues = recentMonths.map((m) =>
        m.orderCount > 0 ? (m.totalAmount || 0) / m.orderCount : 0,
      );
      if (avgValues.length >= 2) {
        const lastValue = avgValues[avgValues.length - 1] || 0;
        const firstValue = avgValues[0] || 0;
        const change =
          firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
        if (change > 10) orderValueTrend = 'increasing';
        else if (change < -10) orderValueTrend = 'decreasing';
      }
    }

    // Calculate risk level based on recency of last order
    let riskLevel: 'low' | 'medium' | 'high' = 'high';
    if (stats.totalOrders === 0) {
      riskLevel = 'high';
    } else if (stats.lastOrderAt) {
      const daysSinceLastOrder = Math.floor(
        (now.getTime() - stats.lastOrderAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceLastOrder < 30) riskLevel = 'low';
      else if (daysSinceLastOrder < 90) riskLevel = 'medium';
      else riskLevel = 'high';
    }

    // Predict next order date based on average frequency
    let predictedNextOrder: string | null = null;
    if (avgDaysBetween > 0 && stats.lastOrderAt) {
      const predicted = new Date(
        stats.lastOrderAt.getTime() + avgDaysBetween * 24 * 60 * 60 * 1000,
      );
      if (predicted > now) {
        predictedNextOrder = predicted.toISOString().split('T')[0] || null;
      }
    }

    const avgOrderValue =
      stats.totalOrders > 0 ? stats.totalSpent / stats.totalOrders : 0;

    return {
      overview: {
        totalOrders: stats.totalOrders,
        totalSpent: stats.totalSpent,
        averageOrderValue: avgOrderValue,
        firstOrderDate: firstOrder?.createdAt?.toISOString() || null,
        lastOrderDate: stats.lastOrderAt?.toISOString() || null,
        customerLifetimeValue: stats.totalSpent,
      },
      orderFrequency: {
        averageDaysBetweenOrders: avgDaysBetween,
        orderFrequencyCategory:
          stats.totalOrders >= 10
            ? 'frequent'
            : stats.totalOrders >= 3
              ? 'regular'
              : 'new',
        predictedNextOrder,
      },
      preferences: {
        favoriteProducts: favoriteProducts.map((p) => ({
          productName: p.productName,
          orderCount: p.orderCount || 0,
          totalQuantity: p.totalQuantity || 0,
        })),
        preferredOrderDays,
        averageOrderSize: avgOrderValue,
      },
      trends: {
        monthlyOrders: monthlyOrders.map((m) => ({
          month: m.month || '',
          orderCount: m.orderCount || 0,
          totalAmount: m.totalAmount || 0,
        })),
        orderValueTrend,
        riskLevel,
      },
    };
  }

  /**
   * Bulk import customers
   */
  async bulkImport(userId: string, customersData: CreateCustomerDto[]) {
    const results = {
      imported: 0,
      failed: 0,
      errors: [] as Array<{
        row: number;
        email: string | undefined;
        error: string;
      }>,
    };

    for (let i = 0; i < customersData.length; i++) {
      const customerData = customersData[i]!;
      try {
        await this.create(userId, customerData);
        results.imported++;
      } catch (error: unknown) {
        results.failed++;
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          row: i + 1,
          email: customerData.email,
          error: errorMessage,
        });
      }
    }

    return results;
  }

  /**
   * Export customers to CSV
   */
  async exportToCSV(
    userId: string,
    options?: { status?: 'active' | 'inactive' },
  ) {
    // Build conditions
    const conditions: SQL[] = [eq(customers.userId, userId)];

    if (options?.status) {
      conditions.push(eq(customers.status, options.status));
    }

    const customerList = await this.databaseService.database
      .select()
      .from(customers)
      .where(and(...conditions))
      .orderBy(asc(customers.name));

    // CSV header
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Customer Type',
      'Company Name',
      'Address Line 1',
      'City',
      'State',
      'ZIP Code',
      'Status',
      'Notes',
      'Created At',
    ];

    const rows = customerList.map((c) => [
      c.name,
      c.email || '',
      c.phone,
      c.customerType,
      c.companyName || '',
      c.addressLine1 || '',
      c.city || '',
      c.state || '',
      c.zipCode || '',
      c.status,
      (c.notes || '').replace(/"/g, '""'),
      c.createdAt.toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Helper: Get order statistics for a customer
   */
  private async getCustomerOrderStats(customerId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    lastOrderAt: Date | null;
  }> {
    const [stats] = await this.databaseService.database
      .select({
        totalOrders: sql<number>`count(*)::int`,
        totalSpent: sql<number>`coalesce(sum(${customerOrders.total}::numeric), 0)::float`,
        lastOrderAt: sql<Date | null>`max(${customerOrders.createdAt})`,
      })
      .from(customerOrders)
      .where(eq(customerOrders.customerId, customerId));

    return {
      totalOrders: stats?.totalOrders || 0,
      totalSpent: stats?.totalSpent || 0,
      lastOrderAt: stats?.lastOrderAt || null,
    };
  }

  /**
   * Helper: Map database record to response DTO
   */
  private mapToResponseDto(customer: CustomerWithStats): CustomerResponseDto {
    const avgOrderValue =
      customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0;

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      addressLine1: customer.addressLine1,
      addressLine2: customer.addressLine2,
      city: customer.city,
      state: customer.state,
      zipCode: customer.zipCode,
      customerType: customer.customerType,
      companyName: customer.companyName,
      taxId: customer.taxId,
      preferredContact: customer.preferredContact,
      marketingOptIn: customer.marketingOptIn,
      status: customer.status,
      notes: customer.notes,
      loyaltyPoints: customer.loyaltyPoints,
      totalOrders: customer.totalOrders,
      totalSpent: customer.totalSpent,
      averageOrderValue: avgOrderValue,
      lastOrderAt: customer.lastOrderAt?.toISOString() || null,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }
}
