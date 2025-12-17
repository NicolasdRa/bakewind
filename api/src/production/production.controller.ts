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
import { ProductionService } from './production.service';
import {
  CreateProductionScheduleDto,
  UpdateProductionScheduleDto,
  UpdateProductionItemDto,
  ProductionScheduleDto,
  ProductionItemDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('production')
@Controller('production')
@UsePipes(new ValidationPipe({ transform: true }))
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get('schedules')
  @ApiOperation({ summary: 'Get all production schedules' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date filter (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date filter (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Production schedules retrieved successfully',
    type: [ProductionScheduleDto],
  })
  async getAllSchedules(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ProductionScheduleDto[]> {
    return this.productionService.getAllSchedules(startDate, endDate);
  }

  @Get('schedules/:id')
  @ApiOperation({ summary: 'Get production schedule by ID' })
  @ApiResponse({
    status: 200,
    description: 'Production schedule retrieved successfully',
    type: ProductionScheduleDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Production schedule not found',
  })
  async getScheduleById(
    @Param('id') id: string,
  ): Promise<ProductionScheduleDto> {
    return this.productionService.getScheduleById(id);
  }

  @Post('schedules')
  @ApiOperation({ summary: 'Create a new production schedule' })
  @ApiResponse({
    status: 201,
    description: 'Production schedule created successfully',
    type: ProductionScheduleDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async createSchedule(
    @Request() req: any,
    @Body() createDto: CreateProductionScheduleDto,
  ): Promise<ProductionScheduleDto> {
    const userId = req.user.sub;
    return this.productionService.createSchedule(createDto, userId);
  }

  @Post('schedules/from-order/:orderId')
  @ApiOperation({
    summary: 'Create a production schedule from an internal order (legacy)',
  })
  @ApiResponse({
    status: 201,
    description: 'Production schedule created from order successfully',
    type: ProductionScheduleDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid order or order has no products with recipes',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async createScheduleFromOrder(
    @Request() req: any,
    @Param('orderId') orderId: string,
    @Body('scheduledDate') scheduledDate: string,
  ): Promise<ProductionScheduleDto> {
    const userId = req.user.sub;
    return this.productionService.createScheduleFromOrder(
      orderId,
      scheduledDate,
      userId,
    );
  }

  @Post('schedules/from-internal-order/:orderId')
  @ApiOperation({
    summary: 'Create a production schedule from an internal order',
  })
  @ApiResponse({
    status: 201,
    description: 'Production schedule created from internal order successfully',
    type: ProductionScheduleDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid order or order has no products with recipes',
  })
  @ApiResponse({
    status: 404,
    description: 'Internal order not found',
  })
  async createScheduleFromInternalOrder(
    @Request() req: any,
    @Param('orderId') orderId: string,
    @Body('scheduledDate') scheduledDate: string,
  ): Promise<ProductionScheduleDto> {
    const userId = req.user.sub;
    return this.productionService.createScheduleFromInternalOrder(
      orderId,
      scheduledDate,
      userId,
    );
  }

  @Post('schedules/from-customer-order/:orderId')
  @ApiOperation({
    summary: 'Create a production schedule from a customer order',
  })
  @ApiResponse({
    status: 201,
    description: 'Production schedule created from customer order successfully',
    type: ProductionScheduleDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid order or order has no products with recipes',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer order not found',
  })
  async createScheduleFromCustomerOrder(
    @Request() req: any,
    @Param('orderId') orderId: string,
    @Body('scheduledDate') scheduledDate: string,
  ): Promise<ProductionScheduleDto> {
    const userId = req.user.sub;
    return this.productionService.createScheduleFromCustomerOrder(
      orderId,
      scheduledDate,
      userId,
    );
  }

  @Put('schedules/:id')
  @ApiOperation({ summary: 'Update a production schedule' })
  @ApiResponse({
    status: 200,
    description: 'Production schedule updated successfully',
    type: ProductionScheduleDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Production schedule not found',
  })
  async updateSchedule(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductionScheduleDto,
  ): Promise<ProductionScheduleDto> {
    return this.productionService.updateSchedule(id, updateDto);
  }

  @Delete('schedules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a production schedule' })
  @ApiResponse({
    status: 204,
    description: 'Production schedule deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Production schedule not found',
  })
  async deleteSchedule(@Param('id') id: string): Promise<void> {
    await this.productionService.deleteSchedule(id);
  }

  @Put('schedules/:scheduleId/items/:itemId')
  @ApiOperation({ summary: 'Update a production item' })
  @ApiResponse({
    status: 200,
    description: 'Production item updated successfully',
    type: ProductionItemDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Production item not found',
  })
  async updateProductionItem(
    @Param('scheduleId') scheduleId: string,
    @Param('itemId') itemId: string,
    @Body() updateDto: UpdateProductionItemDto,
  ): Promise<ProductionItemDto> {
    return this.productionService.updateProductionItem(
      scheduleId,
      itemId,
      updateDto,
    );
  }

  @Post('schedules/:scheduleId/items/:itemId/start')
  @ApiOperation({ summary: 'Start production for an item' })
  @ApiResponse({
    status: 200,
    description: 'Production started successfully',
    type: ProductionItemDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Production item not found',
  })
  async startProduction(
    @Param('scheduleId') scheduleId: string,
    @Param('itemId') itemId: string,
  ): Promise<ProductionItemDto> {
    return this.productionService.startProduction(scheduleId, itemId);
  }

  @Post('schedules/:scheduleId/items/:itemId/complete')
  @ApiOperation({ summary: 'Complete production for an item' })
  @ApiResponse({
    status: 200,
    description: 'Production completed successfully',
    type: ProductionItemDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Production item not found',
  })
  async completeProduction(
    @Param('scheduleId') scheduleId: string,
    @Param('itemId') itemId: string,
    @Body('qualityCheck') qualityCheck: boolean,
    @Body('qualityNotes') qualityNotes?: string,
  ): Promise<ProductionItemDto> {
    return this.productionService.completeProduction(
      scheduleId,
      itemId,
      qualityCheck,
      qualityNotes,
    );
  }
}
