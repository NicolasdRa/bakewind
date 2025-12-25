import { apiClient } from './client';

export type InternalOrderSource =
  | 'cafe'
  | 'restaurant'
  | 'front_house'
  | 'catering'
  | 'retail'
  | 'events'
  | 'management'
  | 'bakery'
  | 'patisserie';

export type InternalOrderStatus =
  | 'draft'
  | 'requested'
  | 'approved'
  | 'scheduled'
  | 'in_production'
  | 'quality_check'
  | 'ready'
  | 'completed'
  | 'delivered'
  | 'cancelled';

export type InternalOrderPriority = 'low' | 'normal' | 'high' | 'rush';

export type InternalOrderFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface InternalOrderItem {
  id: string;
  internalOrderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: string | null;
  specialInstructions: string | null;
  customizations: Record<string, any> | null;
}

export interface InternalOrder {
  id: string;
  orderNumber: string;
  source: InternalOrderSource;
  status: InternalOrderStatus;
  priority: InternalOrderPriority;
  requestedBy: string;
  requestedByEmail: string | null;
  totalCost: string | null;
  requestedDate: string;
  neededByDate: string;
  approvedBy: string | null;
  approvedAt: string | null;
  completedAt: string | null;
  deliveredAt: string | null;
  specialInstructions: string | null;
  notes: string | null;
  // Production fields
  productionDate: string | null;
  productionShift: string | null;
  batchNumber: string | null;
  assignedStaff: string | null;
  workstation: string | null;
  targetQuantity: number | null;
  actualQuantity: number | null;
  wasteQuantity: number | null;
  qualityNotes: string | null;
  // Recurring fields
  isRecurring: boolean | null;
  recurringFrequency: InternalOrderFrequency | null;
  nextOrderDate: string | null;
  recurringEndDate: string | null;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  items: InternalOrderItem[];
}

export interface CreateInternalOrderItemRequest {
  productId: string;
  productName: string;
  quantity: number;
  unitCost?: string;
  specialInstructions?: string;
  customizations?: Record<string, any>;
}

export interface CreateInternalOrderRequest {
  orderNumber: string;
  source: InternalOrderSource;
  status?: InternalOrderStatus;
  priority?: InternalOrderPriority;
  requestedBy: string;
  requestedByEmail?: string;
  totalCost?: string;
  neededByDate: string;
  approvedBy?: string;
  approvedAt?: string;
  specialInstructions?: string;
  notes?: string;
  // Production fields
  batchNumber?: string;
  qualityNotes?: string;
  // Recurring fields
  isRecurring?: boolean;
  recurringFrequency?: InternalOrderFrequency;
  nextOrderDate?: string;
  recurringEndDate?: string;
  items: CreateInternalOrderItemRequest[];
}

export interface UpdateInternalOrderRequest {
  source?: InternalOrderSource;
  status?: InternalOrderStatus;
  priority?: InternalOrderPriority;
  requestedBy?: string;
  requestedByEmail?: string;
  totalCost?: string;
  neededByDate?: string;
  approvedBy?: string;
  approvedAt?: string;
  specialInstructions?: string;
  notes?: string;
  // Production fields
  productionDate?: string;
  productionShift?: string;
  batchNumber?: string;
  assignedStaff?: string;
  workstation?: string;
  targetQuantity?: number;
  actualQuantity?: number;
  wasteQuantity?: number;
  qualityNotes?: string;
  // Recurring fields
  isRecurring?: boolean;
  recurringFrequency?: InternalOrderFrequency;
  nextOrderDate?: string;
  recurringEndDate?: string;
}

export interface InternalOrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
}

export const internalOrdersApi = {
  async getAllOrders(params?: {
    source?: InternalOrderSource;
    status?: InternalOrderStatus;
    search?: string;
  }): Promise<InternalOrder[]> {
    const queryParams = new URLSearchParams();
    if (params?.source) queryParams.append('source', params.source);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    const url = query ? `/internal-orders?${query}` : '/internal-orders';

    return apiClient.get<InternalOrder[]>(url);
  },

  async getOrderStats(source?: InternalOrderSource): Promise<InternalOrderStats> {
    const query = source ? `?source=${source}` : '';
    return apiClient.get<InternalOrderStats>(`/internal-orders/stats${query}`);
  },

  async getOrderById(id: string): Promise<InternalOrder> {
    return apiClient.get<InternalOrder>(`/internal-orders/${id}`);
  },

  async createOrder(request: CreateInternalOrderRequest): Promise<InternalOrder> {
    return apiClient.post<InternalOrder>('/internal-orders', request);
  },

  async updateOrder(id: string, request: UpdateInternalOrderRequest): Promise<InternalOrder> {
    return apiClient.put<InternalOrder>(`/internal-orders/${id}`, request);
  },

  async updateOrderStatus(id: string, status: InternalOrderStatus): Promise<InternalOrder> {
    return apiClient.put<InternalOrder>(`/internal-orders/${id}/status`, { status });
  },

  async deleteOrder(id: string): Promise<void> {
    return apiClient.delete(`/internal-orders/${id}`);
  },
};
