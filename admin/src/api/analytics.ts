import { get } from './client';

export interface AnalyticsData {
  // Define your analytics data structure here
  revenue: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
  };
  // Add more analytics fields as needed
}

export const analyticsApi = {
  async getOverview(): Promise<AnalyticsData> {
    return get<AnalyticsData>('/analytics/overview');
  },

  async getDashboardStats(): Promise<any> {
    return this.getOverview();
  },

  async getRevenue(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return get(`/analytics/revenue?${params.toString()}`);
  },

  async getOrderStats(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return get(`/analytics/orders?${params.toString()}`);
  },
};
