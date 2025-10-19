/**
 * Cookie-Based API Client for BakeWind Admin Dashboard
 *
 * Uses httpOnly cookies for authentication instead of localStorage
 * This is more secure against XSS attacks
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

let config: ApiConfig = { ...defaultConfig };

// Initialize configuration
export function initApiClient(customConfig?: Partial<ApiConfig>): void {
  config = { ...defaultConfig, ...customConfig };
}

// Handle unauthorized responses
function handleUnauthorized(): void {
  logger.api('Unauthorized - redirecting to login');
  // Only redirect if not already on an auth page
  const authPages = ['/login', '/register', '/trial-signup', '/forgot-password'];
  const currentPath = window.location.pathname;
  if (!authPages.includes(currentPath)) {
    window.location.href = '/login';
  }
}

// Refresh access token using refresh token cookie
async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${config.baseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Send refresh token cookie
    });

    if (response.ok) {
      logger.api('Access token refreshed successfully');
      return true;
    }

    logger.warn('Token refresh failed');
    return false;
  } catch (error) {
    logger.error('Token refresh error', error);
    return false;
  }
}

// Handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
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

// Core request function
export async function request<T = any>(
  method: string,
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  const url = `${config.baseUrl}${endpoint}`;

  const headers = new Headers(options?.headers);

  // Only set Content-Type if we have data to send
  if (data && method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

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
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry original request
        const retryResponse = await fetch(url, requestOptions);
        return handleResponse<T>(retryResponse);
      }

      // If refresh failed, redirect to login
      handleUnauthorized();
      throw new Error('Authentication failed');
    }

    return handleResponse<T>(response);
  } catch (error) {
    logger.error('API request failed', error);
    throw error;
  }
}

// Convenience HTTP methods
export function get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  return request<T>('GET', endpoint, undefined, options);
}

export function post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
  return request<T>('POST', endpoint, data, options);
}

export function put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
  return request<T>('PUT', endpoint, data, options);
}

export function patch<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
  return request<T>('PATCH', endpoint, data, options);
}

export function del<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  return request<T>('DELETE', endpoint, undefined, options);
}

// Export the API client object
export const apiClient = {
  request,
  get,
  post,
  put,
  patch,
  delete: del,
};

export default apiClient;
