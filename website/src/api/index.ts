// Main API client exports

// Import everything first
import { authApi, usersApi, healthApi, apiClient, ApiError } from './client';
import type { ApiConfig, paths } from './client';
import { productsApi } from './products';
import type { Product, ProductsResponse, ProductFilters } from './products';
import { ordersApi } from './orders';
import type { Order, OrderItem, CreateOrderRequest, OrdersResponse } from './orders';
import {
  useProducts,
  useProduct,
  useFeaturedProducts,
  useOrders,
  useOrder,
  useAuth,
  useHealth,
} from './composables';

// Re-export everything
export { authApi, usersApi, healthApi, ApiError };
export type { ApiConfig, paths };
export { productsApi };
export type { Product, ProductsResponse, ProductFilters };
export { ordersApi };
export type { Order, OrderItem, CreateOrderRequest, OrdersResponse };
export {
  useProducts,
  useProduct,
  useFeaturedProducts,
  useOrders,
  useOrder,
  useAuth,
  useHealth,
};

// Generated OpenAPI types
export type { paths as ApiPaths } from './types';

// Main unified API object
export const api = {
  auth: authApi,
  users: usersApi,
  health: healthApi,
  products: productsApi,
  orders: ordersApi,
};

// Default export should be the unified API object
export default api;