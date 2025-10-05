/**
 * API Client for BakeWind Admin Dashboard
 *
 * Handles all API communication with the backend
 */

import { API_BASE_URL } from '../config/constants';
import { logger } from '../utils/logger';

export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
}

// Default configuration
const defaultConfig: ApiConfig = {
  baseUrl: API_BASE_URL,
  timeout: 10000,
};

// Module state
let config: ApiConfig = { ...defaultConfig };
let accessToken: string | null = null;
let refreshToken: string | null = null;

// Token management functions
function loadTokens(): void {
  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('accessToken');
    refreshToken = localStorage.getItem('refreshToken');
  }
}

function saveTokens(): void {
  if (typeof window !== 'undefined') {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }
}

export function setTokens(newAccessToken: string, newRefreshToken: string): void {
  accessToken = newAccessToken;
  refreshToken = newRefreshToken;
  saveTokens();
}

export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

// Initialize configuration and load tokens
export function initApiClient(customConfig?: Partial<ApiConfig>): void {
  config = { ...defaultConfig, ...customConfig };
  loadTokens();
}

// Handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text() as unknown as T;
}

// Refresh access token
async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${config.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
    });

    if (response.ok) {
      const data = await response.json();
      accessToken = data.accessToken;
      if (data.refreshToken) {
        refreshToken = data.refreshToken;
      }
      saveTokens();
      return true;
    }
  } catch (error) {
    logger.error('Token refresh failed', error);
  }

  clearTokens();
  return false;
}

// Core request function
export async function request<T = any>(
  method: string,
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  const url = `${config.baseUrl}${endpoint}`;

  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options?.headers,
  });

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const requestOptions: RequestInit = {
    method,
    headers,
    ...options,
  };

  if (data && method !== 'GET') {
    requestOptions.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, requestOptions);

    if (response.status === 401 && refreshToken) {
      // Try to refresh token
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry original request
        headers.set('Authorization', `Bearer ${accessToken}`);
        const retryResponse = await fetch(url, { ...requestOptions, headers });
        return handleResponse<T>(retryResponse);
      }
    }

    return handleResponse<T>(response);
  } catch (error) {
    logger.error('API Request failed', error);
    throw error;
  }
}

// Convenience HTTP methods
export function get<T = any>(endpoint: string, params?: any): Promise<T> {
  const searchParams = params ? '?' + new URLSearchParams(params).toString() : '';
  return request<T>('GET', endpoint + searchParams);
}

export function post<T = any>(endpoint: string, data?: any): Promise<T> {
  return request<T>('POST', endpoint, data);
}

export function put<T = any>(endpoint: string, data?: any): Promise<T> {
  return request<T>('PUT', endpoint, data);
}

export function patch<T = any>(endpoint: string, data?: any): Promise<T> {
  return request<T>('PATCH', endpoint, data);
}

export function del<T = any>(endpoint: string): Promise<T> {
  return request<T>('DELETE', endpoint);
}

// Legacy compatibility - singleton-like object
export const apiClient = {
  request,
  get,
  post,
  put,
  patch,
  delete: del,
  setTokens,
  clearTokens,
};

// Auth API methods
export const authApi = {
  async login(email: string, password: string) {
    const response = await post('/auth/login', { email, password });
    if (response.accessToken && response.refreshToken) {
      setTokens(response.accessToken, response.refreshToken);
    }
    return response;
  },

  async logout() {
    try {
      await post('/auth/logout');
    } finally {
      clearTokens();
      // Redirect to customer app login
      window.location.href = '/login'; // Redirect to admin login, not customer app
    }
  },

  async getProfile() {
    return get('/auth/me');
  },

  async refreshToken() {
    return post('/auth/refresh');
  },
};

// Customers API
export const customersApi = {
  async getCustomers(params?: any) {
    return get('/customers', params);
  },

  async getCustomer(id: string) {
    return get(`/customers/${id}`);
  },

  async createCustomer(data: any) {
    return post('/customers', data);
  },

  async updateCustomer(id: string, data: any) {
    return put(`/customers/${id}`, data);
  },

  async deleteCustomer(id: string) {
    return del(`/customers/${id}`);
  },

  async getCustomerOrders(customerId: string, params?: any) {
    return get(`/customers/${customerId}/orders`, params);
  },
};

// Orders API
export const ordersApi = {
  async getOrders(params?: any) {
    return get('/orders', params);
  },

  async getOrder(id: string) {
    return get(`/orders/${id}`);
  },

  async createOrder(data: any) {
    return post('/orders', data);
  },

  async updateOrder(id: string, data: any) {
    return put(`/orders/${id}`, data);
  },

  async cancelOrder(id: string) {
    return post(`/orders/${id}/cancel`);
  },
};

// Products API
export const productsApi = {
  async getProducts(params?: any) {
    return get('/products', params);
  },

  async getProduct(id: string) {
    return get(`/products/${id}`);
  },

  async createProduct(data: any) {
    return post('/products', data);
  },

  async updateProduct(id: string, data: any) {
    return put(`/products/${id}`, data);
  },

  async deleteProduct(id: string) {
    return del(`/products/${id}`);
  },
};

// Inventory API
export const inventoryApi = {
  async getInventory(params?: any) {
    return get('/inventory', params);
  },

  async getInventoryItem(id: string) {
    return get(`/inventory/${id}`);
  },

  async updateInventory(id: string, data: any) {
    return patch(`/inventory/${id}`, data);
  },

  async adjustStock(id: string, adjustment: number, reason: string) {
    return post(`/inventory/${id}/adjust`, { adjustment, reason });
  },
};

// Analytics API
export const analyticsApi = {
  async getDashboardStats() {
    return get('/analytics/dashboard');
  },

  async getSalesReport(params?: any) {
    return get('/analytics/sales', params);
  },

  async getProductReport(params?: any) {
    return get('/analytics/products', params);
  },

  async getCustomerReport(params?: any) {
    return get('/analytics/customers', params);
  },
};

// User/Profile API
export const userApi = {
  async getProfile() {
    return get('/users/profile');
  },

  async updateProfile(data: any) {
    return patch('/users/profile', data);
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return patch('/users/password', { currentPassword, newPassword });
  },

  async getAccountSettings() {
    return get('/users/account-settings');
  },

  async updateAccountSettings(data: any) {
    return patch('/users/account-settings', data);
  },

  async getSubscriptionStatus() {
    return get('/users/subscription-status');
  },

  async getBillingHistory(limit?: number) {
    return get('/users/billing-history', { limit });
  },
};

// Widgets API
export interface Widget {
  id: string;
  type: 'metrics' | 'orders' | 'inventory' | 'production' | 'chart' | 'preferences';
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config?: Record<string, unknown>;
}

export interface WidgetConfiguration {
  id: string;
  user_id: string;
  layout_type: 'grid' | 'list' | 'masonry';
  widgets: Widget[];
  created_at: string;
  updated_at: string;
}

export interface UpdateWidgetConfigDto {
  layout_type: 'grid' | 'list' | 'masonry';
  widgets: Widget[];
}

export const widgetsApi = {
  async getConfig(): Promise<WidgetConfiguration> {
    return get('/widgets/config');
  },

  async updateConfig(config: UpdateWidgetConfigDto): Promise<WidgetConfiguration> {
    return put('/widgets/config', config);
  },
};

// Initialize on module load
loadTokens();
