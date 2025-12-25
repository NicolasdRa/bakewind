import { InferSelectModel } from 'drizzle-orm';
import {
  internalOrders,
  internalOrderItems,
} from '../database/schemas/internal-orders.schema';
import { z } from 'zod';

// Internal order source, status, priority, and frequency values for validation
export const internalOrderSourceValues = [
  'cafe',
  'restaurant',
  'front_house',
  'catering',
  'retail',
  'events',
] as const;

export const internalOrderStatusValues = [
  'requested',
  'approved',
  'in_preparation',
  'ready',
  'delivered',
  'rejected',
] as const;

export const internalOrderPriorityValues = [
  'low',
  'normal',
  'high',
  'urgent',
] as const;

export const internalOrderFrequencyValues = [
  'daily',
  'weekly',
  'monthly',
] as const;

// Internal order response schema for API output
export const internalOrderResponseDataSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  source: z.enum(internalOrderSourceValues),
  status: z.enum(internalOrderStatusValues),
  priority: z.enum(internalOrderPriorityValues),
  requestedBy: z.string(),
  requestedByEmail: z.string().nullable(),
  totalCost: z.string().nullable(),
  requestedDate: z.date().transform((date) => date.toISOString()),
  neededByDate: z.date().transform((date) => date.toISOString()),
  approvedBy: z.string().nullable(),
  approvedAt: z
    .date()
    .transform((date) => date.toISOString())
    .nullable(),
  completedAt: z
    .date()
    .transform((date) => date.toISOString())
    .nullable(),
  deliveredAt: z
    .date()
    .transform((date) => date.toISOString())
    .nullable(),
  specialInstructions: z.string().nullable(),
  notes: z.string().nullable(),
  isRecurring: z.boolean(),
  recurringFrequency: z.enum(internalOrderFrequencyValues).nullable(),
  nextOrderDate: z
    .date()
    .transform((date) => date.toISOString())
    .nullable(),
  recurringEndDate: z
    .date()
    .transform((date) => date.toISOString())
    .nullable(),
  createdAt: z.date().transform((date) => date.toISOString()),
  updatedAt: z.date().transform((date) => date.toISOString()),
});

// Internal order item response schema for API output
export const internalOrderItemResponseDataSchema = z.object({
  id: z.string().uuid(),
  internalOrderId: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string(),
  quantity: z.number(),
  unitCost: z.string().nullable(),
  specialInstructions: z.string().nullable(),
  customizations: z.record(z.any()).nullable(),
});

// Internal order item schema
const internalOrderItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().min(1).max(255),
  quantity: z.number().int().min(1),
  unitCost: z
    .string()
    .refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Unit cost must be a non-negative number',
    })
    .optional(),
  specialInstructions: z.string().optional(),
  customizations: z.record(z.any()).optional(),
});

// Recurring schema
const recurringSchema = z
  .object({
    frequency: z.enum(internalOrderFrequencyValues),
    nextOrderDate: z.date().optional(),
    endDate: z.date().optional(),
  })
  .optional();

// Internal order creation schema
export const internalOrderCreationSchema = z.object({
  orderNumber: z.string().min(1).max(50),
  source: z.enum(internalOrderSourceValues),
  priority: z.enum(internalOrderPriorityValues).default('normal'),
  requestedBy: z.string().min(1).max(255),
  requestedByEmail: z.string().email().optional(),
  totalCost: z
    .string()
    .refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Total cost must be a non-negative number',
    })
    .optional(),
  requestedDate: z.date(),
  neededByDate: z.date(),
  specialInstructions: z.string().optional(),
  notes: z.string().optional(),
  recurring: recurringSchema,
});

// Internal order item creation schema
export const internalOrderItemCreationSchema = z.object({
  internalOrderId: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string().min(1).max(255),
  quantity: z.number().int().min(1),
  unitCost: z
    .string()
    .refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Unit cost must be a non-negative number',
    })
    .optional(),
  specialInstructions: z.string().optional(),
  customizations: z.record(z.any()).optional(),
});

// Create internal order with items schema
export const createInternalOrderWithItemsSchema = z.object({
  order: internalOrderCreationSchema,
  items: z.array(internalOrderItemSchema).min(1),
});

// Internal order update schema
export const internalOrderUpdateSchema = internalOrderCreationSchema
  .partial()
  .omit({
    orderNumber: true,
  });

// Update internal order status schema
export const updateInternalOrderStatusSchema = z.object({
  status: z.enum(internalOrderStatusValues),
  approvedBy: z.string().optional(),
  notes: z.string().optional(),
});

// Export types
export type InternalOrdersData = InferSelectModel<typeof internalOrders>;
export type InternalOrderItemsData = InferSelectModel<
  typeof internalOrderItems
>;
export type InternalOrderCreation = z.infer<typeof internalOrderCreationSchema>;
export type InternalOrderItemCreation = z.infer<
  typeof internalOrderItemCreationSchema
>;
export type CreateInternalOrderWithItems = z.infer<
  typeof createInternalOrderWithItemsSchema
>;
export type InternalOrderUpdate = z.infer<typeof internalOrderUpdateSchema>;
export type UpdateInternalOrderStatus = z.infer<
  typeof updateInternalOrderStatusSchema
>;
export type InternalOrderResponse = z.infer<
  typeof internalOrderResponseDataSchema
>;
export type InternalOrderItemResponse = z.infer<
  typeof internalOrderItemResponseDataSchema
>;
