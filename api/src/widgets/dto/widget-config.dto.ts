import { z } from 'zod';

// Widget position schema
const widgetPositionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1),
  h: z.number().int().min(1),
});

// Widget schema
const widgetSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['metrics', 'orders', 'inventory', 'production', 'chart', 'preferences']),
  position: widgetPositionSchema,
  config: z.record(z.unknown()).optional(),
});

// Layout type schema
const layoutTypeSchema = z.enum(['grid', 'list', 'masonry']);

// Create/Update widget configuration DTO
export const updateWidgetConfigSchema = z.object({
  layout_type: layoutTypeSchema,
  widgets: z.array(widgetSchema).max(20, 'Maximum 20 widgets allowed per user'),
});

export type UpdateWidgetConfigDto = z.infer<typeof updateWidgetConfigSchema>;
export type WidgetDto = z.infer<typeof widgetSchema>;
export type WidgetPositionDto = z.infer<typeof widgetPositionSchema>;
export type LayoutTypeDto = z.infer<typeof layoutTypeSchema>;