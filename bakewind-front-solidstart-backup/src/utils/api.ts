const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    console.log('🚀 [API] Making request:', {
      method: options.method || 'GET',
      url,
      hasToken: !!token,
      baseURL: this.baseURL
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log('🔑 [API] Using auth token:', token.substring(0, 20) + '...');
    } else {
      console.log('⚠️ [API] No auth token found');
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      console.log('📝 [API] Response status:', response.status, response.statusText);

      if (!response.ok) {
        // Handle 401 errors by clearing tokens
        if (response.status === 401) {
          console.warn('🚫 [API] 401 Unauthorized - clearing tokens and redirecting');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          // Redirect to login if needed
          window.location.href = '/login';
        }

        const errorData = await response.json().catch(() => ({
          message: `HTTP ${response.status}`
        }));

        console.error('❌ [API] Request failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url
        });

        throw new Error(errorData.message || 'Request failed');
      }

      const data = await response.json();
      console.log('✅ [API] Request successful:', {
        method: options.method || 'GET',
        url,
        dataKeys: typeof data === 'object' ? Object.keys(data) : 'non-object'
      });

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 [API] Network error - server may be down:', {
          url,
          baseURL: this.baseURL,
          error: error.message,
          suggestion: 'Check if the backend server is running'
        });
      }
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();