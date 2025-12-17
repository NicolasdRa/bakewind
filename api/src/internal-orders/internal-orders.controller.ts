import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InternalOrdersService } from './internal-orders.service';
import {
  CreateInternalOrderDto,
  UpdateInternalOrderDto,
  InternalOrderStatus,
  InternalOrderSource,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('internal-orders')
@Controller('internal-orders')
@UsePipes(new ValidationPipe({ transform: true }))
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InternalOrdersController {
  constructor(private readonly internalOrdersService: InternalOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all internal orders' })
  @ApiQuery({ name: 'source', required: false, enum: InternalOrderSource })
  @ApiQuery({ name: 'status', required: false, enum: InternalOrderStatus })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by order number, requested by, or department',
  })
  @ApiResponse({
    status: 200,
    description: 'Internal orders retrieved successfully',
  })
  async getAllOrders(
    @Query('source') source?: InternalOrderSource,
    @Query('status') status?: InternalOrderStatus,
    @Query('search') search?: string,
  ) {
    const params: {
      source?: InternalOrderSource;
      status?: InternalOrderStatus;
      search?: string;
    } = {};
    if (source !== undefined) params.source = source;
    if (status !== undefined) params.status = status;
    if (search !== undefined) params.search = search;
    return this.internalOrdersService.getAllOrders(params);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get internal orders statistics' })
  @ApiQuery({ name: 'source', required: false, enum: InternalOrderSource })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStats(@Query('source') source?: InternalOrderSource) {
    return this.internalOrdersService.getOrderStats(source);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get internal order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Internal order retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Internal order not found',
  })
  async getOrderById(@Param('id') id: string) {
    return this.internalOrdersService.getOrderById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new internal order' })
  @ApiResponse({
    status: 201,
    description: 'Internal order created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'Order number already exists',
  })
  async createOrder(@Body() createDto: CreateInternalOrderDto) {
    return this.internalOrdersService.createOrder(createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an internal order' })
  @ApiResponse({
    status: 200,
    description: 'Internal order updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Internal order not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Order is locked by another user',
  })
  async updateOrder(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateInternalOrderDto,
  ) {
    const userId = req.user.sub;
    return this.internalOrdersService.updateOrder(id, updateDto, userId);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update internal order status' })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: 404,
    description: 'Internal order not found',
  })
  async updateOrderStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: InternalOrderStatus,
  ) {
    const userId = req.user.sub;
    return this.internalOrdersService.updateOrderStatus(id, status, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an internal order' })
  @ApiResponse({
    status: 204,
    description: 'Internal order deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Internal order not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Order is locked by another user',
  })
  async deleteOrder(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<void> {
    const userId = req.user.sub;
    await this.internalOrdersService.deleteOrder(id, userId);
  }
}
