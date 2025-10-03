import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { InventoryService } from './inventory.service';
import {
  setCustomThresholdSchema,
  SetCustomThresholdDto,
} from './dto/consumption-tracking.dto';

@ApiTags('inventory')
@Controller('api/v1/inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List inventory with low-stock indicators' })
  @ApiQuery({ name: 'low_stock_only', required: false, type: Boolean })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Inventory items retrieved' })
  async getInventory(
    @Query('low_stock_only') lowStockOnly?: string,
    @Query('category') category?: string,
  ) {
    const lowStockFilter = lowStockOnly === 'true';
    return this.inventoryService.getInventory(lowStockFilter, category);
  }

  @Get(':itemId/consumption')
  @ApiOperation({ summary: 'Get consumption tracking data for item' })
  @ApiResponse({ status: 200, description: 'Consumption data retrieved' })
  @ApiResponse({
    status: 404,
    description: 'Item not found or no tracking data',
  })
  async getConsumption(@Param('itemId') itemId: string) {
    return this.inventoryService.getConsumptionTracking(itemId);
  }

  @Put(':itemId/consumption/threshold')
  @ApiOperation({ summary: 'Set custom reorder threshold' })
  @ApiResponse({ status: 200, description: 'Threshold updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async setThreshold(
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(setCustomThresholdSchema))
    dto: SetCustomThresholdDto,
  ) {
    return this.inventoryService.setCustomThreshold(itemId, dto);
  }

  @Delete(':itemId/consumption/threshold')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove custom threshold' })
  @ApiResponse({ status: 204, description: 'Custom threshold removed' })
  async deleteThreshold(@Param('itemId') itemId: string) {
    await this.inventoryService.deleteCustomThreshold(itemId);
  }

  @Post(':itemId/consumption/recalculate')
  @ApiOperation({ summary: 'Trigger on-demand recalculation' })
  @ApiResponse({ status: 200, description: 'Recalculation completed' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async recalculate(@Param('itemId') itemId: string) {
    return this.inventoryService.recalculate(itemId);
  }
}
