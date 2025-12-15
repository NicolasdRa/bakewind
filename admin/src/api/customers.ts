import { get, post, put, del } from './client';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}

export const customersApi = {
  async getAll(): Promise<Customer[]> {
    return get<Customer[]>('/customers');
  },

  async getCustomers(): Promise<Customer[]> {
    return this.getAll();
  },

  async getById(id: string): Promise<Customer> {
    return get<Customer>(`/customers/${id}`);
  },

  async create(data: CreateCustomerDto): Promise<Customer> {
    return post<Customer>('/customers', data);
  },

  async update(id: string, data: UpdateCustomerDto): Promise<Customer> {
    return put<Customer>(`/customers/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return del(`/customers/${id}`);
  },
};
