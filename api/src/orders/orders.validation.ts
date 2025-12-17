import { InferSelectModel } from 'drizzle-orm';
import {
  customerOrders,
  customerOrderItems,
} from '../database/schemas/orders.schema';
import { z } from 'zod';

// Order type values for validation
export const orderTypeValues = ['customer', 'internal'] as const;

// Order status and source values for validation
export const orderStatusValues = [
  'pending',
  'confirmed',
  'in_production',
  'ready',
  'delivered',
  'cancelled',
] as const;

export const orderSourceValues = [
  'online',
  'phone',
  'walk_in',
  'wholesale',
] as const;

export const paymentStatusValues = [
  'pending',
  'paid',
  'partial',
  'refunded',
] as const;

// Order item schema
const orderItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().min(1).max(255),
  quantity: z.number().int().min(1),
  unitPrice: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Unit price must be a positive number',
    }),
  specialInstructions: z.string().optional(),
  customizations: z.record(z.any()).optional(),
});

// Order response schema for API output
export const orderResponseDataSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  orderType: z.enum(orderTypeValues),
  customerId: z.string().uuid().nullable(),
  customerName: z.string(),
  customerPhone: z.string().nullable(),
  customerEmail: z.string().email().nullable(),
  source: z.enum(orderSourceValues),
  status: z.enum(orderStatusValues),
  paymentStatus: z.enum(paymentStatusValues),
  subtotal: z.string(),
  tax: z.string(),
  discount: z.string(),
  total: z.string(),
  pickupTime: z
    .date()
    .transform((date) => date.toISOString())
    .nullable(),
  deliveryTime: z
    .date()
    .transform((date) => date.toISOString())
    .nullable(),
  specialRequests: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date().transform((date) => date.toISOString()),
  updatedAt: z.date().transform((date) => date.toISOString()),
});

export const orderItemResponseDataSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string(),
  quantity: z.number(),
  unitPrice: z.string(),
  specialInstructions: z.string().nullable(),
  customizations: z.record(z.any()).nullable(),
});

// Order creation schema
export const orderCreationSchema = z.object({
  orderNumber: z.string().min(1).max(50),
  orderType: z.enum(orderTypeValues).default('customer'),
  customerId: z.string().uuid().optional(),
  customerName: z.string().min(1).max(255),
  customerPhone: z.string().max(50).optional(),
  customerEmail: z.string().email().optional(),
  source: z.enum(orderSourceValues),
  subtotal: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0),
  tax: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0),
  discount: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0)
    .default('0'),
  total: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0),
  pickupTime: z.date().optional(),
  deliveryTime: z.date().optional(),
  specialRequests: z.string().optional(),
  notes: z.string().optional(),
});

// Order item creation schema
export const orderItemCreationSchema = z.object({
  orderId: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string().min(1).max(255),
  quantity: z.number().int().min(1),
  unitPrice: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Unit price must be a positive number',
    }),
  specialInstructions: z.string().optional(),
  customizations: z.record(z.any()).optional(),
});

// Create order with items schema
export const createOrderWithItemsSchema = z.object({
  order: orderCreationSchema,
  items: z.array(orderItemSchema).min(1),
});

// Order update schema
export const orderUpdateSchema = orderCreationSchema.partial().omit({
  orderNumber: true,
});

// Export types
export type OrdersData = InferSelectModel<typeof customerOrders>;
export type OrderItemsData = InferSelectModel<typeof customerOrderItems>;
export type OrderCreation = z.infer<typeof orderCreationSchema>;
export type OrderItemCreation = z.infer<typeof orderItemCreationSchema>;
export type CreateOrderWithItems = z.infer<typeof createOrderWithItemsSchema>;
export type OrderUpdate = z.infer<typeof orderUpdateSchema>;
export type OrderResponse = z.infer<typeof orderResponseDataSchema>;
export type OrderItemResponse = z.infer<typeof orderItemResponseDataSchema>;
