import { apiClient } from '../utils/api';
import type { DashboardUserData } from '../types/auth';

export async function loginUser(email: string, password: string) {
  console.log('🔐 [AUTH] Attempting login with email:', email);
  console.log('🌐 [API] Target URL:', `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/login`);

  try {
    const response = await apiClient.post<{
      accessToken: string;
      refreshToken: string;
      user: DashboardUserData;
    }>('/auth/login', { email, password });

    console.log('✅ [AUTH] Login successful, user:', response.user.email);

    // Store tokens
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);

    console.log('💾 [AUTH] Tokens stored successfully');

    return response.user;
  } catch (error) {
    console.error('❌ [AUTH] Login failed:', error);
    console.error('🔍 [DEBUG] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000'
    });
    throw error;
  }
}

export async function registerUser(email: string, password: string, firstName: string, lastName: string) {
  console.log('📝 [AUTH] Attempting registration with email:', email);
  console.log('🌐 [API] Target URL:', `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/register`);

  try {
    const response = await apiClient.post<{
      accessToken: string;
      refreshToken: string;
      user: DashboardUserData;
    }>('/auth/register', {
      email,
      password,
      firstName,
      lastName,
      role: 'CUSTOMER' // Default role
    });

    console.log('✅ [AUTH] Registration successful, user:', response.user.email);

    // Store tokens
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);

    console.log('💾 [AUTH] Tokens stored successfully');

    return response.user;
  } catch (error) {
    console.error('❌ [AUTH] Registration failed:', error);
    console.error('🔍 [DEBUG] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000'
    });
    throw error;
  }
}

export async function getCurrentUser(): Promise<DashboardUserData> {
  console.log('👤 [AUTH] Fetching current user');
  console.log('🌐 [API] Target URL:', `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/me`);

  try {
    const user = await apiClient.get<DashboardUserData>('/auth/me');
    console.log('✅ [AUTH] Current user fetched successfully:', user.email);
    return user;
  } catch (error) {
    console.error('❌ [AUTH] Failed to fetch current user:', error);
    console.error('🔍 [DEBUG] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      hasToken: !!localStorage.getItem('accessToken'),
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000'
    });
    throw error;
  }
}

export async function updateUserProfile(data: Partial<DashboardUserData>): Promise<DashboardUserData> {
  // Filter out undefined values and system fields
  const updateData: any = {};
  const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'bio', 'gender', 'dateOfBirth', 'country', 'city'];

  for (const field of allowedFields) {
    if (data[field as keyof DashboardUserData] !== undefined) {
      updateData[field] = data[field as keyof DashboardUserData];
    }
  }

  return await apiClient.put<DashboardUserData>('/users/profile', updateData);
}

export async function updateUserSettings(settings: {
  email?: string;
  password?: string;
  currentPassword?: string;
}): Promise<DashboardUserData> {
  const endpoint = settings.password ? '/auth/change-password' : '/users/profile';

  if (settings.password) {
    // Password change requires current password
    await apiClient.post('/auth/change-password', {
      currentPassword: settings.currentPassword,
      newPassword: settings.password
    });
  }

  if (settings.email) {
    // Update email
    return await apiClient.put<DashboardUserData>('/users/profile', { email: settings.email });
  }

  return await getCurrentUser();
}

export async function logoutUser(): Promise<void> {
  console.log('🚪 [AUTH] Attempting logout');
  console.log('🌐 [API] Target URL:', `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/logout`);

  try {
    await apiClient.post('/auth/logout');
    console.log('✅ [AUTH] Server logout successful');
  } catch (error) {
    // Even if logout fails on server, clear local tokens
    console.error('⚠️ [AUTH] Server logout failed, clearing local tokens anyway:', error);
  } finally {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    console.log('🗑️ [AUTH] Local tokens cleared');
  }
}