import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

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
  type: z.enum([
    'metrics',
    'orders',
    'inventory',
    'production',
    'chart',
    'preferences',
  ]),
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

// DTOs using createZodDto
export class UpdateWidgetConfigDto extends createZodDto(
  updateWidgetConfigSchema,
) {}

export class WidgetDto extends createZodDto(widgetSchema) {}

export class WidgetPositionDto extends createZodDto(widgetPositionSchema) {}

// LayoutTypeDto cannot extend createZodDto directly from z.enum, so we use a type alias
export type LayoutType = z.infer<typeof layoutTypeSchema>;
