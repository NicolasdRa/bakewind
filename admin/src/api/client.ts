/**
 * API Client for BakeWind Admin Dashboard
 *
 * Handles all API communication with the backend
 */

export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
}

class ApiClient {
  private config: ApiConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(config: ApiConfig) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:5000/api/v1',
      timeout: config.timeout || 10000,
    };

    // Load tokens from localStorage if available
    this.loadTokens();
  }

  private loadTokens() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  private saveTokens() {
    if (typeof window !== 'undefined') {
      if (this.accessToken) {
        localStorage.setItem('accessToken', this.accessToken);
      }
      if (this.refreshToken) {
        localStorage.setItem('refreshToken', this.refreshToken);
      }
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.saveTokens();
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  async request<T = any>(
    method: string,
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const headers = new Headers({
      'Content-Type': 'application/json',
      ...options?.headers,
    });

    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
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

      if (response.status === 401 && this.refreshToken) {
        // Try to refresh token
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry original request
          headers.set('Authorization', `Bearer ${this.accessToken}`);
          const retryResponse = await fetch(url, { ...requestOptions, headers });
          return this.handleResponse<T>(retryResponse);
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
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

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.config.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.accessToken;
        if (data.refreshToken) {
          this.refreshToken = data.refreshToken;
        }
        this.saveTokens();
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    this.clearTokens();
    return false;
  }

  // Convenience methods
  get<T = any>(endpoint: string, params?: any) {
    const searchParams = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<T>('GET', endpoint + searchParams);
  }

  post<T = any>(endpoint: string, data?: any) {
    return this.request<T>('POST', endpoint, data);
  }

  put<T = any>(endpoint: string, data?: any) {
    return this.request<T>('PUT', endpoint, data);
  }

  patch<T = any>(endpoint: string, data?: any) {
    return this.request<T>('PATCH', endpoint, data);
  }

  delete<T = any>(endpoint: string) {
    return this.request<T>('DELETE', endpoint);
  }
}

// Create singleton instance
export const apiClient = new ApiClient({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
});

// Auth API methods
export const authApi = {
  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.accessToken && response.refreshToken) {
      apiClient.setTokens(response.accessToken, response.refreshToken);
    }
    return response;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      apiClient.clearTokens();
      // Redirect to customer app login
      window.location.href = import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:3000/login';
    }
  },

  async getProfile() {
    return apiClient.get('/auth/me');
  },

  async refreshToken() {
    return apiClient.post('/auth/refresh');
  },
};

// Customers API
export const customersApi = {
  async getCustomers(params?: any) {
    return apiClient.get('/customers', params);
  },

  async getCustomer(id: string) {
    return apiClient.get(`/customers/${id}`);
  },

  async createCustomer(data: any) {
    return apiClient.post('/customers', data);
  },

  async updateCustomer(id: string, data: any) {
    return apiClient.put(`/customers/${id}`, data);
  },

  async deleteCustomer(id: string) {
    return apiClient.delete(`/customers/${id}`);
  },

  async getCustomerOrders(customerId: string, params?: any) {
    return apiClient.get(`/customers/${customerId}/orders`, params);
  },
};

// Orders API
export const ordersApi = {
  async getOrders(params?: any) {
    return apiClient.get('/orders', params);
  },

  async getOrder(id: string) {
    return apiClient.get(`/orders/${id}`);
  },

  async createOrder(data: any) {
    return apiClient.post('/orders', data);
  },

  async updateOrder(id: string, data: any) {
    return apiClient.put(`/orders/${id}`, data);
  },

  async cancelOrder(id: string) {
    return apiClient.post(`/orders/${id}/cancel`);
  },
};

// Products API
export const productsApi = {
  async getProducts(params?: any) {
    return apiClient.get('/products', params);
  },

  async getProduct(id: string) {
    return apiClient.get(`/products/${id}`);
  },

  async createProduct(data: any) {
    return apiClient.post('/products', data);
  },

  async updateProduct(id: string, data: any) {
    return apiClient.put(`/products/${id}`, data);
  },

  async deleteProduct(id: string) {
    return apiClient.delete(`/products/${id}`);
  },
};

// Inventory API
export const inventoryApi = {
  async getInventory(params?: any) {
    return apiClient.get('/inventory', params);
  },

  async getInventoryItem(id: string) {
    return apiClient.get(`/inventory/${id}`);
  },

  async updateInventory(id: string, data: any) {
    return apiClient.patch(`/inventory/${id}`, data);
  },

  async adjustStock(id: string, adjustment: number, reason: string) {
    return apiClient.post(`/inventory/${id}/adjust`, { adjustment, reason });
  },
};

// Analytics API
export const analyticsApi = {
  async getDashboardStats() {
    return apiClient.get('/analytics/dashboard');
  },

  async getSalesReport(params?: any) {
    return apiClient.get('/analytics/sales', params);
  },

  async getProductReport(params?: any) {
    return apiClient.get('/analytics/products', params);
  },

  async getCustomerReport(params?: any) {
    return apiClient.get('/analytics/customers', params);
  },
};

// User/Profile API
export const userApi = {
  async getProfile() {
    return apiClient.get('/users/profile');
  },

  async updateProfile(data: any) {
    return apiClient.patch('/users/profile', data);
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return apiClient.patch('/users/password', { currentPassword, newPassword });
  },

  async getAccountSettings() {
    return apiClient.get('/users/account-settings');
  },

  async updateAccountSettings(data: any) {
    return apiClient.patch('/users/account-settings', data);
  },

  async getSubscriptionStatus() {
    return apiClient.get('/users/subscription-status');
  },

  async getBillingHistory(limit?: number) {
    return apiClient.get('/users/billing-history', { limit });
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
    return apiClient.get('/widgets/config');
  },

  async updateConfig(config: UpdateWidgetConfigDto): Promise<WidgetConfiguration> {
    return apiClient.put('/widgets/config', config);
  },
};