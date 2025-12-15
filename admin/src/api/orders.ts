import { apiClient } from './client';

export type CustomerOrderStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export type OrderPriority = 'low' | 'normal' | 'high' | 'rush';

export type OrderSource = 'online' | 'phone' | 'walk_in' | 'wholesale';

export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded';

export interface CustomerOrderItem {
  id: string;
  customerOrderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  specialInstructions: string | null;
  customizations: Record<string, any> | null;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  source: OrderSource;
  status: CustomerOrderStatus;
  priority: OrderPriority;
  paymentStatus: PaymentStatus;
  subtotal: string;
  tax: string;
  discount: string | null;
  total: string;
  pickupTime: string | null;
  deliveryTime: string | null;
  specialRequests: string | null;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: CustomerOrderItem[];
}

export interface CreateCustomerOrderItemRequest {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  specialInstructions?: string;
  customizations?: Record<string, any>;
}

export interface CreateCustomerOrderRequest {
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  source: OrderSource;
  status?: CustomerOrderStatus;
  priority?: OrderPriority;
  paymentStatus?: PaymentStatus;
  subtotal: string;
  tax: string;
  discount?: string;
  total: string;
  pickupTime?: string;
  deliveryTime?: string;
  specialRequests?: string;
  notes?: string;
  items: CreateCustomerOrderItemRequest[];
}

export interface UpdateCustomerOrderRequest {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  source?: OrderSource;
  status?: CustomerOrderStatus;
  priority?: OrderPriority;
  paymentStatus?: PaymentStatus;
  subtotal?: string;
  tax?: string;
  discount?: string;
  total?: string;
  pickupTime?: string;
  deliveryTime?: string;
  specialRequests?: string;
  notes?: string;
}

export interface CustomerOrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: string;
}

export const customerOrdersApi = {
  async getAllOrders(params?: {
    status?: CustomerOrderStatus;
    search?: string;
  }): Promise<CustomerOrder[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    const url = query ? `/orders?${query}` : '/orders';

    return apiClient.get<CustomerOrder[]>(url);
  },

  async getOrderStats(): Promise<CustomerOrderStats> {
    return apiClient.get<CustomerOrderStats>('/orders/stats');
  },

  async getOrderById(id: string): Promise<CustomerOrder> {
    return apiClient.get<CustomerOrder>(`/orders/${id}`);
  },

  async getOrderByNumber(orderNumber: string): Promise<CustomerOrder> {
    return apiClient.get<CustomerOrder>(`/orders/number/${orderNumber}`);
  },

  async createOrder(request: CreateCustomerOrderRequest): Promise<CustomerOrder> {
    return apiClient.post<CustomerOrder>('/orders', request);
  },

  async updateOrder(id: string, request: UpdateCustomerOrderRequest): Promise<CustomerOrder> {
    return apiClient.put<CustomerOrder>(`/orders/${id}`, request);
  },

  async updateOrderStatus(id: string, status: CustomerOrderStatus): Promise<CustomerOrder> {
    return apiClient.put<CustomerOrder>(`/orders/${id}/status`, { status });
  },

  async deleteOrder(id: string): Promise<void> {
    return apiClient.delete(`/orders/${id}`);
  },
};

// Legacy export for backwards compatibility - will be removed after migration
export const ordersApi = customerOrdersApi;
