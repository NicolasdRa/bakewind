/**
 * Cookie-Based API Client for BakeWind Admin Dashboard
 *
 * Uses httpOnly cookies for authentication instead of localStorage
 * This is more secure against XSS attacks
 */

export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
}

class ApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:5000/api/v1',
      timeout: config.timeout || 10000,
    };
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

    const requestOptions: RequestInit = {
      method,
      headers,
      credentials: 'include', // CRITICAL: Send cookies with requests
      ...options,
    };

    if (data && method !== 'GET') {
      requestOptions.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, requestOptions);

      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry original request
          const retryResponse = await fetch(url, requestOptions);
          return this.handleResponse<T>(retryResponse);
        }

        // If refresh failed, redirect to login
        this.handleUnauthorized();
        throw new Error('Authentication failed');
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Send refresh token cookie
      });

      if (response.ok) {
        console.log('[ApiClient] Access token refreshed successfully');
        return true;
      }

      console.warn('[ApiClient] Token refresh failed');
      return false;
    } catch (error) {
      console.error('[ApiClient] Token refresh error:', error);
      return false;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: any = new Error('API request failed');
      error.status = response.status;

      try {
        error.data = await response.json();
      } catch {
        error.data = { message: response.statusText };
      }

      throw error;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text() as any;
  }

  private handleUnauthorized() {
    console.log('[ApiClient] Unauthorized - redirecting to login');
    const customerAppUrl = import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:3000';
    window.location.href = `${customerAppUrl}/login`;
  }

  // Convenience methods
  get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>('POST', endpoint, data, options);
  }

  put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  patch<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }
}

// Create singleton instance
export const apiClient = new ApiClient({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
});

// Auth API methods
export const authApi = {
  async getProfile() {
    return apiClient.get('/auth/me');
  },

  async logout() {
    await apiClient.post('/auth/logout');
    const customerAppUrl = import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:3000';
    window.location.href = `${customerAppUrl}/login`;
  },

  async refresh() {
    return apiClient.post('/auth/refresh');
  },
};

export { apiClient as default };
