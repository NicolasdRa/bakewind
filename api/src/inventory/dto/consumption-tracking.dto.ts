import { z } from 'zod';

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

// TypeScript types
export type SetCustomThresholdDto = z.infer<typeof setCustomThresholdSchema>;
export type ConsumptionTrackingDto = z.infer<typeof consumptionTrackingSchema>;
export type ConsumptionTrackingSummaryDto = z.infer<
  typeof consumptionTrackingSummarySchema
>;

// Extended inventory item with tracking
export interface InventoryItemWithTrackingDto {
  id: string;
  name: string;
  current_stock: number;
  unit: string;
  category: string;
  lead_time_days?: number;
  low_stock: boolean;
  consumption_tracking: ConsumptionTrackingSummaryDto | null;
}
