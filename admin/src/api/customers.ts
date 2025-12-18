import { get, post, put, del } from './client';

// Types
export type CustomerType = 'individual' | 'business';
export type CustomerStatus = 'active' | 'inactive';
export type PreferredContact = 'email' | 'phone' | 'text';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  // Structured address
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  // Customer type fields
  customerType: CustomerType;
  companyName: string | null;
  taxId: string | null;
  // Preferences
  preferredContact: PreferredContact | null;
  marketingOptIn: boolean;
  // Status
  status: CustomerStatus;
  notes: string | null;
  loyaltyPoints: number;
  // Computed from orders
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderAt: string | null;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone: string;
  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  // Type
  customerType?: CustomerType;
  companyName?: string;
  taxId?: string;
  // Preferences
  preferredContact?: PreferredContact;
  marketingOptIn?: boolean;
  // Notes
  notes?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  email?: string | null;
  phone?: string;
  // Address
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  // Type
  customerType?: CustomerType;
  companyName?: string | null;
  taxId?: string | null;
  // Preferences
  preferredContact?: PreferredContact | null;
  marketingOptIn?: boolean;
  // Status
  status?: CustomerStatus;
  // Notes
  notes?: string | null;
}

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerStatus;
  customerType?: CustomerType;
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastOrderAt' | 'totalSpent';
  sortOrder?: 'asc' | 'desc';
}

export interface CustomersResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
}

export interface CustomerOrdersResponse {
  orders: CustomerOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate: string | null;
  };
}

export const customersApi = {
  /**
   * Get all customers with filtering, pagination, and sorting
   */
  async getCustomers(params?: CustomerQueryParams): Promise<CustomersResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.customerType) searchParams.set('customerType', params.customerType);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const queryString = searchParams.toString();
    const url = queryString ? `/customers?${queryString}` : '/customers';
    return get<CustomersResponse>(url);
  },

  /**
   * Get a single customer by ID
   */
  async getCustomer(id: string): Promise<Customer> {
    return get<Customer>(`/customers/${id}`);
  },

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerDto): Promise<Customer> {
    return post<Customer>('/customers', data);
  },

  /**
   * Update an existing customer
   */
  async updateCustomer(id: string, data: UpdateCustomerDto): Promise<Customer> {
    return put<Customer>(`/customers/${id}`, data);
  },

  /**
   * Delete a customer
   */
  async deleteCustomer(id: string): Promise<void> {
    return del(`/customers/${id}`);
  },

  /**
   * Get customer orders
   */
  async getCustomerOrders(
    customerId: string,
    params?: { page?: number; limit?: number },
  ): Promise<CustomerOrdersResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const url = queryString
      ? `/customers/${customerId}/orders?${queryString}`
      : `/customers/${customerId}/orders`;
    return get<CustomerOrdersResponse>(url);
  },

  // Legacy aliases for backward compatibility
  async getAll(): Promise<Customer[]> {
    const response = await this.getCustomers();
    return response.customers;
  },

  async getById(id: string): Promise<Customer> {
    return this.getCustomer(id);
  },

  async create(data: CreateCustomerDto): Promise<Customer> {
    return this.createCustomer(data);
  },

  async update(id: string, data: UpdateCustomerDto): Promise<Customer> {
    return this.updateCustomer(id, data);
  },

  async delete(id: string): Promise<void> {
    return this.deleteCustomer(id);
  },
};
