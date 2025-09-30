/**
 * Typed API client for BakeWind SaaS Customer Portal
 *
 * This client provides type-safe access to the BakeWind API with automatic
 * authentication handling, error management, and retry logic.
 */

import { ApiConfig, ApiResponse, ApiError, HttpMethod } from '../types/api.types';

// Environment configuration
const API_CONFIG: ApiConfig = {
  baseUrl: typeof window !== 'undefined'
    ? window.location.hostname === 'localhost'
      ? 'http://localhost:5000/api/v1'
      : 'https://api.bakewind.com/api/v1'
    : process.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Global authentication state
let authToken: string | null = null;
let refreshToken: string | null = null;

/**
 * Core API client class with authentication support
 */
export class ApiClient {
  private config: ApiConfig;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor(config: ApiConfig = API_CONFIG) {
    this.config = config;
  }

  /**
   * Set authentication tokens
   */
  setAuthTokens(accessToken: string, refreshTokenValue: string) {
    authToken = accessToken;
    refreshToken = refreshTokenValue;
  }

  /**
   * Clear authentication tokens
   */
  clearAuthTokens() {
    authToken = null;
    refreshToken = null;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return authToken;
  }

  /**
   * Make authenticated API request
   */
  async request<T = any>(
    method: HttpMethod,
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;

    // Prepare headers
    const headers = new Headers({
      ...this.config.headers,
      ...options.headers,
    });

    // Add authentication if available
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers,
      ...options,
    };

    // Add body for non-GET requests
    if (data && method !== HttpMethod.GET) {
      requestOptions.body = JSON.stringify(data);
    }

    // Add query parameters for GET requests
    let finalUrl = url;
    if (data && method === HttpMethod.GET) {
      const searchParams = new URLSearchParams(data);
      finalUrl = `${url}?${searchParams.toString()}`;
    }

    try {
      const response = await this.fetchWithTimeout(finalUrl, requestOptions);

      // Handle authentication errors
      if (response.status === 401 && authToken && refreshToken) {
        try {
          await this.refreshAccessToken();
          // Retry original request with new token
          const newHeaders = new Headers(headers);
          newHeaders.set('Authorization', `Bearer ${authToken}`);
          const retryResponse = await this.fetchWithTimeout(finalUrl, {
            ...requestOptions,
            headers: newHeaders,
          });
          return this.handleResponse<T>(retryResponse);
        } catch (refreshError) {
          // Refresh failed, clear tokens and throw original error
          this.clearAuthTokens();
          return this.handleResponse<T>(response);
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let data: T;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = (await response.text()) as unknown as T;
    }

    if (!response.ok) {
      throw {
        message: typeof data === 'object' && data && 'message' in data
          ? (data as any).message
          : 'Request failed',
        status: response.status,
        statusText: response.statusText,
        details: data,
      } as ApiError;
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers,
    };
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): ApiError {
    if (error.name === 'AbortError') {
      return {
        message: 'Request timeout',
        status: 408,
        statusText: 'Request Timeout',
      };
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        message: 'Network error - please check your connection',
        status: 0,
        statusText: 'Network Error',
      };
    }

    // Already an ApiError
    if (error.status && error.message) {
      return error;
    }

    return {
      message: error.message || 'Unknown error occurred',
      details: error,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshPromise;
      this.isRefreshing = false;
      this.refreshPromise = null;
      return newToken;
    } catch (error) {
      this.isRefreshing = false;
      this.refreshPromise = null;
      throw error;
    }
  }

  /**
   * Perform actual token refresh
   */
  private async performTokenRefresh(): Promise<string> {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.config.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    const newAccessToken = data.accessToken;
    const newRefreshToken = data.refreshToken;

    if (!newAccessToken) {
      throw new Error('Invalid refresh response');
    }

    // Update tokens
    authToken = newAccessToken;
    if (newRefreshToken) {
      refreshToken = newRefreshToken;
    }

    return newAccessToken;
  }

  // Convenience methods for common HTTP verbs
  async get<T = any>(endpoint: string, params?: any): Promise<ApiResponse<T>> {
    return this.request<T>(HttpMethod.GET, endpoint, params);
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(HttpMethod.POST, endpoint, data);
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(HttpMethod.PUT, endpoint, data);
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(HttpMethod.PATCH, endpoint, data);
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(HttpMethod.DELETE, endpoint);
  }
}

// Default API client instance
export const apiClient = new ApiClient();

/**
 * Authentication API methods
 */
export const authApi = {
  /**
   * Sign up for trial account
   */
  async trialSignup(data: {
    businessName: string;
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    locations: '1' | '2-3' | '4-10' | '10+';
    agreeToTerms: boolean;
    marketingConsent?: boolean;
    referralSource?: string;
  }) {
    const response = await apiClient.post('/auth/trial-signup', data);

    // Set authentication tokens if signup successful
    if (response.data.accessToken && response.data.refreshToken) {
      apiClient.setAuthTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  },

  /**
   * Login with email and password
   */
  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });

    // Set authentication tokens if login successful
    if (response.data.accessToken && response.data.refreshToken) {
      apiClient.setAuthTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  },

  /**
   * Logout and clear tokens
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      apiClient.clearAuthTokens();
    }
  },

  /**
   * Get current user profile
   */
  async getProfile() {
    return apiClient.get('/auth/me');
  },

  /**
   * Refresh authentication tokens
   */
  async refreshTokens() {
    return apiClient.post('/auth/refresh');
  },
};

/**
 * Subscription Plans API methods
 */
export const subscriptionApi = {
  /**
   * Get all subscription plans
   */
  async getPlans() {
    return apiClient.get('/subscriptions/plans');
  },

  /**
   * Get specific plan by ID
   */
  async getPlan(planId: string) {
    return apiClient.get(`/subscriptions/plans/${planId}`);
  },

  /**
   * Compare multiple plans
   */
  async comparePlans(planIds: string[]) {
    return apiClient.get('/subscriptions/plans/compare', {
      planIds: planIds.join(','),
    });
  },

  /**
   * Get recommended plan for business size
   */
  async getRecommendedPlan(businessSize: '1' | '2-3' | '4-10' | '10+') {
    return apiClient.get('/subscriptions/plans/recommend', { businessSize });
  },
};

/**
 * Software Features API methods
 */
export const featuresApi = {
  /**
   * Get all features
   */
  async getFeatures(category?: string, highlighted?: boolean) {
    const params: any = {};
    if (category) params.category = category;
    if (highlighted !== undefined) params.highlighted = highlighted.toString();

    return apiClient.get('/features', params);
  },

  /**
   * Get feature by ID
   */
  async getFeature(featureId: string) {
    return apiClient.get(`/features/${featureId}`);
  },

  /**
   * Get features by category
   */
  async getFeatureCategories() {
    return apiClient.get('/features/categories');
  },

  /**
   * Get feature availability matrix
   */
  async getFeatureMatrix() {
    return apiClient.get('/features/matrix');
  },

  /**
   * Compare features across plans
   */
  async compareFeatures(planIds: string[]) {
    return apiClient.get('/features/compare', {
      planIds: planIds.join(','),
    });
  },

  /**
   * Get features for specific plan
   */
  async getFeaturesForPlan(planId: string) {
    return apiClient.get(`/features/plans/${planId}`);
  },
};

/**
 * Trials API methods
 */
export const trialsApi = {
  /**
   * Get trial account details
   */
  async getTrial(trialId: string) {
    return apiClient.get(`/trials/${trialId}`);
  },

  /**
   * Get trial by user ID
   */
  async getTrialByUser(userId: string) {
    return apiClient.get(`/trials/user/${userId}`);
  },

  /**
   * Update trial onboarding progress
   */
  async updateOnboarding(
    trialId: string,
    data: {
      onboardingStatus?: 'pending' | 'started' | 'in_progress' | 'completed' | 'abandoned';
      onboardingStepsCompleted?: string[];
    }
  ) {
    return apiClient.patch(`/trials/${trialId}/onboarding`, data);
  },

  /**
   * Convert trial to paid subscription
   */
  async convertTrial(trialId: string, subscriptionPlanId: string) {
    return apiClient.post(`/trials/${trialId}/convert`, { subscriptionPlanId });
  },
};

/**
 * Error handling utilities
 */
export const handleApiError = (error: ApiError): string => {
  if (error.status === 401) {
    return 'Please log in to access this feature';
  }

  if (error.status === 403) {
    return 'You do not have permission to perform this action';
  }

  if (error.status === 404) {
    return 'The requested resource was not found';
  }

  if (error.status === 429) {
    return 'Too many requests. Please try again later';
  }

  if (error.status >= 500) {
    return 'A server error occurred. Please try again later';
  }

  if (error.status === 0) {
    return 'Network connection error. Please check your internet connection';
  }

  return error.message || 'An unexpected error occurred';
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return apiClient.getAccessToken() !== null;
};

/**
 * Initialize API client with stored tokens (for SSR/hydration)
 */
export const initializeApiClient = (accessToken?: string, refreshTokenValue?: string) => {
  if (accessToken && refreshTokenValue) {
    apiClient.setAuthTokens(accessToken, refreshTokenValue);
  }
};

export default apiClient;