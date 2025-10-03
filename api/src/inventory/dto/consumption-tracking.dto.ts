import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';

// Zod validation schemas
export const setCustomThresholdSchema = z.object({
  custom_reorder_threshold: z.number().min(0, 'Threshold must be non-negative'),
  custom_lead_time_days: z.number().int().min(1).optional(),
});

export const consumptionTrackingSchema = z.object({
  id: z.string().uuid(),
  inventory_item_id: z.string().uuid(),
  avg_daily_consumption: z.number(),
  calculation_period_days: z.number().int(),
  last_calculated_at: z.string().datetime(),
  calculation_method: z.enum(['historical_orders', 'manual', 'predicted']),
  custom_reorder_threshold: z.number().nullable(),
  custom_lead_time_days: z.number().int().nullable(),
  sample_size: z.number().int(),
  days_of_supply_remaining: z.number(),
  predicted_stockout_date: z.string().date().nullable(),
});

export const consumptionTrackingSummarySchema = z.object({
  avg_daily_consumption: z.number(),
  days_of_supply_remaining: z.number(),
  has_custom_threshold: z.boolean(),
});

// DTOs using createZodDto
export class SetCustomThresholdDto extends createZodDto(
  setCustomThresholdSchema,
) {}

export class ConsumptionTrackingDto extends createZodDto(
  consumptionTrackingSchema,
) {}

export class ConsumptionTrackingSummaryDto extends createZodDto(
  consumptionTrackingSummarySchema,
) {}

// Extended inventory item with tracking
export class InventoryItemWithTrackingDto {
  @ApiProperty({
    description: 'Inventory item ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Item name',
    example: 'All-Purpose Flour',
  })
  name!: string;

  @ApiProperty({
    description: 'Current stock quantity',
    example: 50.5,
  })
  current_stock!: number;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'kg',
  })
  unit!: string;

  @ApiProperty({
    description: 'Item category',
    example: 'Ingredients',
  })
  category!: string;

  @ApiProperty({
    description: 'Lead time in days',
    example: 3,
    required: false,
  })
  lead_time_days?: number;

  @ApiProperty({
    description: 'Whether stock is low',
    example: false,
  })
  low_stock!: boolean;

  @ApiProperty({
    description: 'Consumption tracking summary',
    type: ConsumptionTrackingSummaryDto,
    nullable: true,
  })
  consumption_tracking!: ConsumptionTrackingSummaryDto | null;
}
