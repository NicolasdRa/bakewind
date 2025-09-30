import { InferSelectModel } from 'drizzle-orm';
import {
  analyticsEvents,
  dailyMetrics,
  productMetrics,
} from '../database/schemas/analytics.schema';
import { z } from 'zod';

// User response schema for API output
export const analyticsEventResponseDataSchema = z.object({
  id: z.string().uuid(),
  eventType: z.string(),
  eventData: z.record(z.any()).nullable(),
  userId: z.string().uuid().nullable(),
  sessionId: z.string().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  timestamp: z.date().transform((date) => date.toISOString()),
});

export const dailyMetricsResponseDataSchema = z.object({
  id: z.string().uuid(),
  date: z.date().transform((date) => date.toISOString().split('T')[0]),
  totalOrders: z.number(),
  totalRevenue: z.string(),
  totalInternalOrders: z.number(),
  totalProductionItems: z.number(),
  completedProductionItems: z.number(),
  productionEfficiency: z.string().nullable(),
  topProducts: z
    .array(
      z.object({
        productId: z.string(),
        productName: z.string(),
        quantity: z.number(),
        revenue: z.number(),
      }),
    )
    .nullable(),
  lowStockItems: z.number(),
  expiringSoonItems: z.number(),
  inventoryValue: z.string(),
  createdAt: z.date().transform((date) => date.toISOString()),
  updatedAt: z.date().transform((date) => date.toISOString()),
});

export const productMetricsResponseDataSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  date: z.date().transform((date) => date.toISOString().split('T')[0]),
  quantitySold: z.number(),
  revenue: z.string(),
  viewCount: z.number(),
  averageRating: z.string().nullable(),
  popularityScore: z.number().nullable(),
  createdAt: z.date().transform((date) => date.toISOString()),
  updatedAt: z.date().transform((date) => date.toISOString()),
});

// Analytics event creation schema
export const analyticsEventCreationSchema = z.object({
  eventType: z.string().min(1).max(100),
  eventData: z.record(z.any()).optional(),
  userId: z.string().uuid().optional(),
  sessionId: z.string().max(255).optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
});

// Daily metrics creation schema
export const dailyMetricsCreationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalOrders: z.number().int().min(0).default(0),
  totalRevenue: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0)
    .default('0'),
  totalInternalOrders: z.number().int().min(0).default(0),
  totalProductionItems: z.number().int().min(0).default(0),
  completedProductionItems: z.number().int().min(0).default(0),
  productionEfficiency: z
    .string()
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100,
    )
    .optional(),
  topProducts: z
    .array(
      z.object({
        productId: z.string(),
        productName: z.string(),
        quantity: z.number(),
        revenue: z.number(),
      }),
    )
    .optional(),
  lowStockItems: z.number().int().min(0).default(0),
  expiringSoonItems: z.number().int().min(0).default(0),
  inventoryValue: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0)
    .default('0'),
});

// Product metrics creation schema
export const productMetricsCreationSchema = z.object({
  productId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  quantitySold: z.number().int().min(0).default(0),
  revenue: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0)
    .default('0'),
  viewCount: z.number().int().min(0).default(0),
  averageRating: z
    .string()
    .refine(
      (val) =>
        val === '' ||
        (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 5),
    )
    .optional(),
  popularityScore: z.number().int().min(0).max(100).default(0),
});

// Dashboard metrics query schema
export const dashboardMetricsQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  includeProducts: z.boolean().default(false),
});

// Revenue analytics query schema
export const revenueAnalyticsQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
});

// Product analytics query schema
export const productAnalyticsQuerySchema = z.object({
  productId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  limit: z.number().int().min(1).max(100).default(10),
});

// Export types
export type AnalyticsEventsData = InferSelectModel<typeof analyticsEvents>;
export type DailyMetricsData = InferSelectModel<typeof dailyMetrics>;
export type ProductMetricsData = InferSelectModel<typeof productMetrics>;
export type AnalyticsEventCreation = z.infer<
  typeof analyticsEventCreationSchema
>;
export type DailyMetricsCreation = z.infer<typeof dailyMetricsCreationSchema>;
export type ProductMetricsCreation = z.infer<
  typeof productMetricsCreationSchema
>;
export type AnalyticsEventResponse = z.infer<
  typeof analyticsEventResponseDataSchema
>;
export type DailyMetricsResponse = z.infer<
  typeof dailyMetricsResponseDataSchema
>;
export type ProductMetricsResponse = z.infer<
  typeof productMetricsResponseDataSchema
>;
export type DashboardMetricsQuery = z.infer<typeof dashboardMetricsQuerySchema>;
export type RevenueAnalyticsQuery = z.infer<typeof revenueAnalyticsQuerySchema>;
export type ProductAnalyticsQuery = z.infer<typeof productAnalyticsQuerySchema>;
