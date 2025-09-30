import { getTokenFromSession } from "~/lib/auth-session";

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000';

export class ServerApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async getAuthToken(): Promise<string | null> {
    "use server";
    return await getTokenFromSession();
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    "use server";

    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getAuthToken();

    console.log('🚀 [SERVER_API] Making request:', {
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
      console.log('🔑 [SERVER_API] Using session token');
    } else {
      console.log('⚠️ [SERVER_API] No session token found');
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('📝 [SERVER_API] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP ${response.status}`
        }));

        console.error('❌ [SERVER_API] Request failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url
        });

        throw new Error(errorData.message || 'Request failed');
      }

      const data = await response.json();
      console.log('✅ [SERVER_API] Request successful:', {
        method: options.method || 'GET',
        url,
        dataKeys: typeof data === 'object' ? Object.keys(data) : 'non-object'
      });

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 [SERVER_API] Network error - server may be down:', {
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
    "use server";
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    "use server";
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    "use server";
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    "use server";
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const serverApiClient = new ServerApiClient();