import type { paths } from './types';

// Base configuration
export interface ApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

// Default configuration
const defaultConfig: ApiConfig = {
  baseUrl: process.env.NODE_ENV === 'production'
    ? 'https://api.bakewind.com'
    : 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // For cookies (refresh tokens)
};

// Generic API error class
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any,
    message?: string
  ) {
    super(message || `API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

// HTTP method types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Generic fetch wrapper with type safety
async function apiFetch<T = any>(
  endpoint: string,
  options: {
    method?: HttpMethod;
    body?: any;
    headers?: Record<string, string>;
    config?: Partial<ApiConfig>;
  } = {}
): Promise<T> {
  const config = { ...defaultConfig, ...options.config };
  const url = `${config.baseUrl}/api/v1${endpoint}`;

  const headers = {
    ...config.headers,
    ...options.headers,
  };

  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
    credentials: config.credentials,
  };

  // Add body for non-GET requests
  if (options.body && options.method !== 'GET') {
    if (options.body instanceof FormData) {
      // Don't set Content-Type for FormData, let browser set it
      delete headers['Content-Type'];
      fetchOptions.body = options.body;
    } else {
      fetchOptions.body = JSON.stringify(options.body);
    }
  }

  try {
    const response = await fetch(url, fetchOptions);

    // Handle non-JSON responses (like 204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new ApiError(
        response.status,
        response.statusText,
        data,
        data?.message || `Request failed: ${response.status} ${response.statusText}`
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, 'Network Error', null, error instanceof Error ? error.message : 'Unknown error');
  }
}

// Authentication API
export const authApi = {
  login: (
    credentials: paths['/auth/login']['post']['requestBody']['content']['application/json']
  ) => apiFetch<paths['/auth/login']['post']['responses']['200']['content']['application/json']>(
    '/auth/login',
    { method: 'POST', body: credentials }
  ),

  register: (
    userData: any // TODO: Add proper type when available
  ) => apiFetch<paths['/auth/register']['post']['responses']['201']['content']['application/json']>(
    '/auth/register',
    { method: 'POST', body: userData }
  ),

  refresh: () => apiFetch<paths['/auth/refresh']['post']['responses']['200']['content']['application/json']>(
    '/auth/refresh',
    { method: 'POST' }
  ),

  logout: () => apiFetch<paths['/auth/logout']['post']['responses']['200']['content']['application/json']>(
    '/auth/logout',
    { method: 'POST' }
  ),

  getProfile: () => apiFetch<paths['/auth/me']['get']['responses']['200']['content']['application/json']>(
    '/auth/me'
  ),
};

// Users API
export const usersApi = {
  getProfile: () => apiFetch<any>('/users/me'),

  updateProfile: (updates: any) => apiFetch<any>(
    '/users/me',
    { method: 'PATCH', body: updates }
  ),
};

// Health API
export const healthApi = {
  check: () => apiFetch<paths['/health']['get']['responses']['200']['content']['application/json']>(
    '/health'
  ),
};

// Main API client with all endpoints
export const apiClient = {
  auth: authApi,
  users: usersApi,
  health: healthApi,

  // Utility methods
  setAuthToken: (token: string) => {
    defaultConfig.headers = {
      ...defaultConfig.headers,
      Authorization: `Bearer ${token}`,
    };
  },

  clearAuthToken: () => {
    if (defaultConfig.headers?.Authorization) {
      delete defaultConfig.headers.Authorization;
    }
  },

  updateConfig: (newConfig: Partial<ApiConfig>) => {
    Object.assign(defaultConfig, newConfig);
  },
};

// Export types for external use
export type {
  paths,
  ApiConfig,
};

// Export the default client
export default apiClient;