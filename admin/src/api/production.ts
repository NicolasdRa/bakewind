import { apiClient } from './client';

// Production Status Enum
export type ProductionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

// Production Item Types
export interface ProductionItem {
  id: string;
  schedule_id: string;
  internal_order_id: string | null;
  customer_order_id: string | null;
  recipe_id: string;
  recipe_name: string;
  quantity: number;
  status: ProductionStatus;
  scheduled_time: string;
  start_time: string | null;
  completed_time: string | null;
  assigned_to: string | null;
  notes: string | null;
  batch_number: string | null;
  quality_check: boolean;
  quality_notes: string | null;
}

// Production Schedule Types
export interface ProductionSchedule {
  id: string;
  date: string;
  total_items: number;
  completed_items: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  items: ProductionItem[];
}

// Request Types
export interface CreateProductionItemRequest {
  recipeId: string;
  recipeName: string;
  quantity: number;
  status?: ProductionStatus;
  scheduledTime: string;
  startTime?: string;
  completedTime?: string;
  assignedTo?: string;
  notes?: string;
  batchNumber?: string;
  qualityCheck?: boolean;
  qualityNotes?: string;
}

export interface CreateProductionScheduleRequest {
  date: string;
  notes?: string;
  createdBy?: string;
  items: CreateProductionItemRequest[];
}

export interface UpdateProductionItemRequest {
  status?: ProductionStatus;
  startTime?: string;
  completedTime?: string;
  assignedTo?: string;
  notes?: string;
  batchNumber?: string;
  qualityCheck?: boolean;
  qualityNotes?: string;
}

export interface UpdateProductionScheduleRequest {
  date?: string;
  notes?: string;
  items?: CreateProductionItemRequest[];
}

export interface CompleteProductionRequest {
  qualityCheck: boolean;
  qualityNotes?: string;
}

// API functions
export const productionApi = {
  /**
   * Get all production schedules with optional date filtering
   */
  async getAllSchedules(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ProductionSchedule[]> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    const url = query ? `/production/schedules?${query}` : '/production/schedules';

    return apiClient.get<ProductionSchedule[]>(url);
  },

  /**
   * Get a single production schedule by ID
   */
  async getScheduleById(id: string): Promise<ProductionSchedule> {
    return apiClient.get<ProductionSchedule>(`/production/schedules/${id}`);
  },

  /**
   * Create a new production schedule
   */
  async createSchedule(data: CreateProductionScheduleRequest): Promise<ProductionSchedule> {
    return apiClient.post<ProductionSchedule>('/production/schedules', data);
  },

  /**
   * Create a production schedule from an internal order (legacy)
   */
  async createScheduleFromOrder(orderId: string, scheduledDate: string): Promise<ProductionSchedule> {
    return apiClient.post<ProductionSchedule>(`/production/schedules/from-order/${orderId}`, {
      scheduledDate,
    });
  },

  /**
   * Create a production schedule from an internal order
   */
  async createScheduleFromInternalOrder(orderId: string, scheduledDate: string): Promise<ProductionSchedule> {
    return apiClient.post<ProductionSchedule>(`/production/schedules/from-internal-order/${orderId}`, {
      scheduledDate,
    });
  },

  /**
   * Create a production schedule from a customer order
   */
  async createScheduleFromCustomerOrder(orderId: string, scheduledDate: string): Promise<ProductionSchedule> {
    return apiClient.post<ProductionSchedule>(`/production/schedules/from-customer-order/${orderId}`, {
      scheduledDate,
    });
  },

  /**
   * Update a production schedule
   */
  async updateSchedule(id: string, data: UpdateProductionScheduleRequest): Promise<ProductionSchedule> {
    return apiClient.put<ProductionSchedule>(`/production/schedules/${id}`, data);
  },

  /**
   * Delete a production schedule
   */
  async deleteSchedule(id: string): Promise<void> {
    return apiClient.delete(`/production/schedules/${id}`);
  },

  /**
   * Update a production item
   */
  async updateProductionItem(
    scheduleId: string,
    itemId: string,
    data: UpdateProductionItemRequest,
  ): Promise<ProductionItem> {
    return apiClient.put<ProductionItem>(
      `/production/schedules/${scheduleId}/items/${itemId}`,
      data,
    );
  },

  /**
   * Start production for an item
   */
  async startProduction(scheduleId: string, itemId: string): Promise<ProductionItem> {
    return apiClient.post<ProductionItem>(
      `/production/schedules/${scheduleId}/items/${itemId}/start`,
      {},
    );
  },

  /**
   * Complete production for an item
   */
  async completeProduction(
    scheduleId: string,
    itemId: string,
    data: CompleteProductionRequest,
  ): Promise<ProductionItem> {
    return apiClient.post<ProductionItem>(
      `/production/schedules/${scheduleId}/items/${itemId}/complete`,
      data,
    );
  },
};
