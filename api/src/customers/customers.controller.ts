import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
  CustomerQueryDto,
} from './dto/customers.dto';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get customers for current user account' })
  @ApiQuery({
    name: 'page',
    description: 'Page number (1-based)',
    required: false,
    type: 'number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: 'number',
    example: 20,
  })
  @ApiQuery({
    name: 'search',
    description: 'Search by name, email, or phone',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by customer status',
    required: false,
    enum: ['active', 'inactive'],
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'Sort field',
    required: false,
    enum: ['name', 'email', 'createdAt', 'lastOrderAt'],
  })
  @ApiQuery({
    name: 'sortOrder',
    description: 'Sort direction',
    required: false,
    enum: ['asc', 'desc'],
  })
  @ApiResponse({
    status: 200,
    description: 'List of customers',
    schema: {
      type: 'object',
      properties: {
        customers: {
          type: 'array',
          items: { $ref: '#/components/schemas/CustomerResponseDto' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getCustomers(
    @Request() req: any,
    @Query() query: CustomerQueryDto,
  ) {
    const userId = req.user.sub;
    return this.customersService.findAllByUser(userId, query);
  }

  @Get(':customerId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiParam({ name: 'customerId', description: 'Customer ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Customer details',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Customer belongs to different account',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async getCustomer(
    @Request() req: any,
    @Param('customerId') customerId: string,
  ): Promise<CustomerResponseDto> {
    const userId = req.user.sub;
    return this.customersService.findByIdAndUser(customerId, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({ summary: 'Create new customer' })
  @ApiResponse({
    status: 201,
    description: 'Customer created successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid customer data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async createCustomer(
    @Request() req: any,
    @Body() createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const userId = req.user.sub;
    return this.customersService.create(userId, createCustomerDto);
  }

  @Put(':customerId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({ summary: 'Update customer' })
  @ApiParam({ name: 'customerId', description: 'Customer ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Customer updated successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid customer data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Customer belongs to different account',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async updateCustomer(
    @Request() req: any,
    @Param('customerId') customerId: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const userId = req.user.sub;
    return this.customersService.updateByIdAndUser(customerId, userId, updateCustomerDto);
  }

  @Delete(':customerId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete customer (soft delete)' })
  @ApiParam({ name: 'customerId', description: 'Customer ID', type: 'string' })
  @ApiResponse({
    status: 204,
    description: 'Customer deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Customer belongs to different account',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async deleteCustomer(
    @Request() req: any,
    @Param('customerId') customerId: string,
  ): Promise<void> {
    const userId = req.user.sub;
    return this.customersService.deleteByIdAndUser(customerId, userId);
  }

  @Get(':customerId/orders')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get customer order history' })
  @ApiParam({ name: 'customerId', description: 'Customer ID', type: 'string' })
  @ApiQuery({
    name: 'page',
    description: 'Page number (1-based)',
    required: false,
    type: 'number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: 'number',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by order status',
    required: false,
    enum: ['pending', 'confirmed', 'in_production', 'ready', 'completed', 'cancelled'],
  })
  @ApiResponse({
    status: 200,
    description: 'Customer order history',
    schema: {
      type: 'object',
      properties: {
        orders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              orderNumber: { type: 'string' },
              status: { type: 'string' },
              totalAmount: { type: 'number' },
              orderDate: { type: 'string', format: 'date-time' },
              completedAt: { type: 'string', format: 'date-time', nullable: true },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    productName: { type: 'string' },
                    quantity: { type: 'number' },
                    unitPrice: { type: 'number' },
                    totalPrice: { type: 'number' },
                  },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
        summary: {
          type: 'object',
          properties: {
            totalOrders: { type: 'number' },
            totalSpent: { type: 'number' },
            averageOrderValue: { type: 'number' },
            lastOrderDate: { type: 'string', format: 'date-time', nullable: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Customer belongs to different account',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async getCustomerOrders(
    @Request() req: any,
    @Param('customerId') customerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const userId = req.user.sub;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    return this.customersService.getCustomerOrders(customerId, userId, {
      page: pageNum,
      limit: limitNum,
      status: status as any,
    });
  }

  @Get(':customerId/analytics')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get customer analytics and insights' })
  @ApiParam({ name: 'customerId', description: 'Customer ID', type: 'string' })
  @ApiQuery({
    name: 'period',
    description: 'Analytics period',
    required: false,
    enum: ['30d', '90d', '1y', 'all'],
  })
  @ApiResponse({
    status: 200,
    description: 'Customer analytics data',
    schema: {
      type: 'object',
      properties: {
        overview: {
          type: 'object',
          properties: {
            totalOrders: { type: 'number' },
            totalSpent: { type: 'number' },
            averageOrderValue: { type: 'number' },
            firstOrderDate: { type: 'string', format: 'date-time', nullable: true },
            lastOrderDate: { type: 'string', format: 'date-time', nullable: true },
            customerLifetimeValue: { type: 'number' },
          },
        },
        orderFrequency: {
          type: 'object',
          properties: {
            averageDaysBetweenOrders: { type: 'number' },
            orderFrequencyCategory: { type: 'string' },
            predictedNextOrder: { type: 'string', format: 'date', nullable: true },
          },
        },
        preferences: {
          type: 'object',
          properties: {
            favoriteProducts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productName: { type: 'string' },
                  orderCount: { type: 'number' },
                  totalQuantity: { type: 'number' },
                },
              },
            },
            preferredOrderDays: { type: 'array', items: { type: 'string' } },
            averageOrderSize: { type: 'number' },
          },
        },
        trends: {
          type: 'object',
          properties: {
            monthlyOrders: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  month: { type: 'string' },
                  orderCount: { type: 'number' },
                  totalAmount: { type: 'number' },
                },
              },
            },
            orderValueTrend: { type: 'string', enum: ['increasing', 'decreasing', 'stable'] },
            riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Customer belongs to different account',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async getCustomerAnalytics(
    @Request() req: any,
    @Param('customerId') customerId: string,
    @Query('period') period?: string,
  ) {
    const userId = req.user.sub;
    return this.customersService.getCustomerAnalytics(customerId, userId, period || '90d');
  }

  @Post('import')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 requests per 5 minutes
  @ApiOperation({ summary: 'Bulk import customers from CSV' })
  @ApiResponse({
    status: 200,
    description: 'Customer import results',
    schema: {
      type: 'object',
      properties: {
        imported: { type: 'number' },
        failed: { type: 'number' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              row: { type: 'number' },
              email: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid import data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async importCustomers(
    @Request() req: any,
    @Body() importData: { customers: CreateCustomerDto[] },
  ) {
    const userId = req.user.sub;
    return this.customersService.bulkImport(userId, importData.customers);
  }

  @Get('export/csv')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Export customers to CSV' })
  @ApiQuery({
    name: 'status',
    description: 'Filter by customer status',
    required: false,
    enum: ['active', 'inactive'],
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file data',
    headers: {
      'Content-Type': { description: 'text/csv' },
      'Content-Disposition': { description: 'attachment; filename=customers.csv' },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async exportCustomersCSV(
    @Request() req: any,
    @Query('status') status?: string,
  ) {
    const userId = req.user.sub;
    return this.customersService.exportToCSV(userId, { status: status as any });
  }
}