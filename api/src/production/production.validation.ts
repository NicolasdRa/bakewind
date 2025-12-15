import { InferSelectModel } from 'drizzle-orm';
import {
  productionSchedules,
  productionItems,
} from '../database/schemas/production.schema';
import { z } from 'zod';

// Production status values for validation
export const productionStatusValues = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
] as const;

// Production schedule response schema for API output
export const productionScheduleResponseDataSchema = z.object({
  id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Already in YYYY-MM-DD format from database
  totalItems: z.number(),
  completedItems: z.number(),
  notes: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.date().transform((date) => date.toISOString()),
  updatedAt: z.date().transform((date) => date.toISOString()),
});

// Production item response schema for API output
export const productionItemResponseDataSchema = z.object({
  id: z.string().uuid(),
  scheduleId: z.string().uuid(),
  recipeId: z.string().uuid(),
  recipeName: z.string(),
  quantity: z.number(),
  status: z.enum(productionStatusValues),
  scheduledTime: z.date().transform((date) => date.toISOString()),
  startTime: z
    .date()
    .transform((date) => date.toISOString())
    .nullable(),
  completedTime: z
    .date()
    .transform((date) => date.toISOString())
    .nullable(),
  assignedTo: z.string().nullable(),
  notes: z.string().nullable(),
  batchNumber: z.string().nullable(),
  qualityCheck: z.boolean(),
  qualityNotes: z.string().nullable(),
});

// Production schedule creation schema
export const productionScheduleCreationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
  createdBy: z.string().min(1).max(255),
});

// Production item creation schema
export const productionItemCreationSchema = z.object({
  scheduleId: z.string().uuid(),
  recipeId: z.string().uuid(),
  recipeName: z.string().min(1).max(255),
  quantity: z.number().int().min(1),
  scheduledTime: z.date(),
  assignedTo: z.string().max(255).optional(),
  notes: z.string().optional(),
  batchNumber: z.string().max(100).optional(),
});

// Create production schedule with items schema
export const createProductionScheduleWithItemsSchema = z.object({
  schedule: productionScheduleCreationSchema,
  items: z
    .array(productionItemCreationSchema.omit({ scheduleId: true }))
    .min(1),
});

// Production schedule update schema
export const productionScheduleUpdateSchema =
  productionScheduleCreationSchema.partial();

// Production item update schema
export const productionItemUpdateSchema = productionItemCreationSchema
  .partial()
  .omit({
    scheduleId: true,
    recipeId: true,
  });

// Update production item status schema
export const updateProductionItemStatusSchema = z.object({
  status: z.enum(productionStatusValues),
  startTime: z.date().optional(),
  completedTime: z.date().optional(),
  assignedTo: z.string().max(255).optional(),
  notes: z.string().optional(),
  qualityCheck: z.boolean().optional(),
  qualityNotes: z.string().optional(),
});

// Production demand query schema
export const productionDemandQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  includeExternal: z.boolean().default(true),
  includeInternal: z.boolean().default(true),
});

// Export types
export type ProductionSchedulesData = InferSelectModel<
  typeof productionSchedules
>;
export type ProductionItemsData = InferSelectModel<typeof productionItems>;
export type ProductionScheduleCreation = z.infer<
  typeof productionScheduleCreationSchema
>;
export type ProductionItemCreation = z.infer<
  typeof productionItemCreationSchema
>;
export type CreateProductionScheduleWithItems = z.infer<
  typeof createProductionScheduleWithItemsSchema
>;
export type ProductionScheduleUpdate = z.infer<
  typeof productionScheduleUpdateSchema
>;
export type ProductionItemUpdate = z.infer<typeof productionItemUpdateSchema>;
export type UpdateProductionItemStatus = z.infer<
  typeof updateProductionItemStatusSchema
>;
export type ProductionDemandQuery = z.infer<typeof productionDemandQuerySchema>;
export type ProductionScheduleResponse = z.infer<
  typeof productionScheduleResponseDataSchema
>;
export type ProductionItemResponse = z.infer<
  typeof productionItemResponseDataSchema
>;
