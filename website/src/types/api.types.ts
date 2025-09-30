/**
 * API Types for BakeWind SaaS Customer Portal
 */

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  headers: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
  code?: string;
  details?: any;
  timestamp?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

// Authentication Types
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  businessName: string;
  role: string;
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled';
  trialEndsAt: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  dashboardUrl: string;
}

export interface TrialSignupData {
  businessName: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  locations: '1' | '2-3' | '4-10' | '10+';
  agreeToTerms: boolean;
}

// Subscription Plan Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceMonthlyUsd: number;
  priceAnnualUsd: number;
  maxLocations: number | null;
  maxUsers: number | null;
  features: string[];
  stripePriceIdMonthly: string | null;
  stripePriceIdAnnual: string | null;
  isPopular: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Software Feature Types
export interface SoftwareFeature {
  id: string;
  name: string;
  description: string;
  iconName: string;
  category: 'orders' | 'inventory' | 'production' | 'analytics' | 'customers' | 'products';
  availableInPlans: string[];
  demoUrl: string | null;
  helpDocUrl: string | null;
  sortOrder: number;
  isHighlighted: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Trial Types
export interface Trial {
  id: string;
  userId: string;
  businessSize: '1' | '2-3' | '4-10' | '10+';
  onboardingStatus: 'pending' | 'started' | 'in_progress' | 'completed' | 'abandoned';
  onboardingStepsCompleted: string[];
  lastOnboardingActivity: string | null;
  hasConvertedToPaid: boolean;
  convertedAt: string | null;
  subscriptionPlanId: string | null;
  createdAt: string;
  updatedAt: string;
}

// User Profile Types
export interface UserProfile {
  id: string;
  email: string;
  companyName: string;
  companyPhone: string | null;
  companyAddress: string | null;
  companyWebsite: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  timezone: string | null;
  language: string | null;
  stripeCustomerId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  company: string | null;
  notes: string | null;
  customerType: 'individual' | 'business' | 'restaurant' | 'event_planner';
  preferredContact: 'email' | 'phone' | 'text' | null;
  status: 'active' | 'inactive';
  marketingOptIn: boolean;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderAt: string | null;
  createdAt: string;
  updatedAt: string;
}