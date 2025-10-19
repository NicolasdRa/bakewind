import apiClient from "./client";


// Types matching backend contract
export interface ConsumptionTrackingSummary {
  avg_daily_consumption: number;
  days_of_supply_remaining: number;
  has_custom_threshold: boolean;
}

export interface InventoryItemWithTracking {
  id: string;
  name: string;
  current_stock: number;
  unit: string;
  category: string;
  lead_time_days?: number;
  low_stock: boolean;
  consumption_tracking: ConsumptionTrackingSummary | null;
}

export interface ConsumptionTracking {
  id: string;
  inventory_item_id: string;
  avg_daily_consumption: number;
  calculation_period_days: number;
  last_calculated_at: string;
  calculation_method: 'historical_orders' | 'manual' | 'predicted';
  custom_reorder_threshold: number | null;
  custom_lead_time_days: number | null;
  sample_size: number;
  days_of_supply_remaining: number;
  predicted_stockout_date: string | null;
}

export interface SetThresholdRequest {
  custom_reorder_threshold: number;
  custom_lead_time_days?: number;
}

// Inventory API
export const inventoryApi = {
  /**
   * Get inventory list with optional filters
   */
  async getInventory(
    lowStockOnly = false,
    category?: string,
  ): Promise<InventoryItemWithTracking[]> {
    const params = new URLSearchParams();
    if (lowStockOnly) params.append('low_stock_only', 'true');
    if (category) params.append('category', category);

    const queryString = params.toString();
    const url = `/inventory${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<InventoryItemWithTracking[]>(url);
  },

  /**
   * Get consumption tracking data for an item
   */
  async getConsumption(itemId: string): Promise<ConsumptionTracking> {
    return apiClient.get<ConsumptionTracking>(`/inventory/${itemId}/consumption`);
  },

  /**
   * Set custom reorder threshold for an item
   */
  async setCustomThreshold(itemId: string, data: SetThresholdRequest): Promise<ConsumptionTracking> {
    return apiClient.put<ConsumptionTracking>(`/inventory/${itemId}/consumption/threshold`, data);
  },

  /**
   * Delete custom threshold (revert to predictive)
   */
  async deleteCustomThreshold(itemId: string): Promise<void> {
    await apiClient.delete(`/inventory/${itemId}/consumption/threshold`);
  },

  /**
   * Trigger on-demand recalculation of consumption
   */
  async recalculate(itemId: string): Promise<ConsumptionTracking> {
    return apiClient.post<ConsumptionTracking>(`/inventory/${itemId}/consumption/recalculate`, {});
  },
};
