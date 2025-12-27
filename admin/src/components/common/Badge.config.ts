/**
 * Badge Configuration Helpers
 *
 * Predefined color configurations for common badge use cases.
 * These provide consistent styling across the application.
 */

import type { BadgeVariant } from './Badge';

/**
 * Product category badge colors
 */
export const categoryBadgeColors: Record<string, string> = {
  bread: 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400',
  pastry: 'border-pink-600 text-pink-600 dark:border-pink-400 dark:text-pink-400',
  cake: 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400',
  cookie: 'border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-400',
  sandwich: 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400',
  beverage: 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400',
  seasonal: 'border-yellow-600 text-yellow-600 dark:border-yellow-400 dark:text-yellow-400',
  custom: 'border-gray-600 text-gray-600 dark:border-gray-400 dark:text-gray-400',
};

/**
 * Recipe category badge colors
 */
export const recipeCategoryColors: Record<string, string> = {
  bread: 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400',
  pastry: 'border-pink-600 text-pink-600 dark:border-pink-400 dark:text-pink-400',
  cake: 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400',
  cookie: 'border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-400',
  sandwich: 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400',
  beverage: 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400',
  sauce: 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400',
  filling: 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400',
  topping: 'border-cyan-600 text-cyan-600 dark:border-cyan-400 dark:text-cyan-400',
  other: 'border-gray-600 text-gray-600 dark:border-gray-400 dark:text-gray-400',
};

/**
 * Product status badge variants
 */
export const productStatusVariants: Record<string, BadgeVariant> = {
  active: 'success',
  inactive: 'neutral',
  seasonal: 'warning',
  discontinued: 'error',
};

/**
 * Stock status badge variants
 */
export const stockStatusVariants: Record<string, BadgeVariant> = {
  out: 'error',        // Out of stock
  low: 'warning',      // Low stock
  good: 'success',     // In stock
  critical: 'error',   // Critical level
};

/**
 * User status badge variants
 */
export const userStatusVariants: Record<string, BadgeVariant> = {
  active: 'success',
  inactive: 'error',
  pending: 'warning',
  suspended: 'error',
};

/**
 * Role badge colors
 */
export const roleBadgeColors: Record<string, string> = {
  admin: 'border-red-600 text-red-600 dark:border-red-400 dark:text-red-400',
  manager: 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400',
  head_baker: 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400',
  head_pastry_chef: 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400',
  baker: 'border-yellow-600 text-yellow-600 dark:border-yellow-400 dark:text-yellow-400',
  pastry_chef: 'border-yellow-600 text-yellow-600 dark:border-yellow-400 dark:text-yellow-400',
  cashier: 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400',
};

/**
 * Helper to get category badge color
 */
export const getCategoryBadgeColor = (category: string): string => {
  return categoryBadgeColors[category] || categoryBadgeColors.custom;
};

/**
 * Helper to get product status variant
 */
export const getProductStatusVariant = (status: string): BadgeVariant => {
  return productStatusVariants[status] || 'neutral';
};

/**
 * Helper to get stock status variant
 */
export const getStockStatusVariant = (status: string): BadgeVariant => {
  return stockStatusVariants[status] || 'neutral';
};

/**
 * Helper to get user status variant
 */
export const getUserStatusVariant = (status: string): BadgeVariant => {
  return userStatusVariants[status] || 'neutral';
};

/**
 * Helper to get role badge color
 */
export const getRoleBadgeColor = (role: string): string => {
  return roleBadgeColors[role] || categoryBadgeColors.custom;
};

/**
 * Helper to get recipe category badge color
 */
export const getRecipeCategoryColor = (category: string): string => {
  return recipeCategoryColors[category] || recipeCategoryColors.other;
};

/**
 * Customer order status badge variants
 */
export const customerOrderStatusVariants: Record<string, BadgeVariant> = {
  draft: 'neutral',
  pending: 'warning',
  confirmed: 'info',
  in_production: 'info',
  ready: 'success',
  delivered: 'success',
  cancelled: 'error',
};

/**
 * Payment status badge variants
 */
export const paymentStatusVariants: Record<string, BadgeVariant> = {
  pending: 'warning',
  paid: 'success',
  partial: 'info',
  refunded: 'error',
};

/**
 * Internal order status badge variants
 */
export const internalOrderStatusVariants: Record<string, BadgeVariant> = {
  draft: 'neutral',
  requested: 'warning',
  approved: 'info',
  scheduled: 'info',
  in_production: 'info',
  quality_check: 'warning',
  ready: 'success',
  completed: 'success',
  delivered: 'success',
  cancelled: 'error',
};

/**
 * Order priority badge variants
 */
export const orderPriorityVariants: Record<string, BadgeVariant> = {
  low: 'success',
  normal: 'info',
  high: 'warning',
  rush: 'error',
};

/**
 * Helper to get customer order status variant
 */
export const getCustomerOrderStatusVariant = (status: string): BadgeVariant => {
  return customerOrderStatusVariants[status] || 'neutral';
};

/**
 * Helper to get payment status variant
 */
export const getPaymentStatusVariant = (status: string): BadgeVariant => {
  return paymentStatusVariants[status] || 'neutral';
};

/**
 * Helper to get internal order status variant
 */
export const getInternalOrderStatusVariant = (status: string): BadgeVariant => {
  return internalOrderStatusVariants[status] || 'neutral';
};

/**
 * Helper to get order priority variant
 */
export const getOrderPriorityVariant = (priority: string): BadgeVariant => {
  return orderPriorityVariants[priority] || 'info';
};
