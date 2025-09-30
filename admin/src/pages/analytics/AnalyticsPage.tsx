import { Component, createSignal, createResource, For, Show } from "solid-js";
import { analyticsApi } from "../../api/client";

interface DashboardStats {
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  orders: {
    today: number;
    thisWeek: number;
    pending: number;
    completed: number;
    avgOrderValue: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    retention: number;
  };
  products: {
    totalSold: number;
    topProduct: string;
    lowStock: number;
  };
}

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

const AnalyticsPage: Component = () => {
  const [dashboardStats] = createResource<DashboardStats>(() => analyticsApi.getDashboardStats());
  const [selectedPeriod, setSelectedPeriod] = createSignal('7days');

  // Mock sales data for demonstration
  const [salesData] = createSignal<SalesData[]>([
    { date: '2024-11-25', revenue: 1250, orders: 18 },
    { date: '2024-11-26', revenue: 1890, orders: 24 },
    { date: '2024-11-27', revenue: 2340, orders: 31 },
    { date: '2024-11-28', revenue: 3120, orders: 42 },
    { date: '2024-11-29', revenue: 2850, orders: 38 },
    { date: '2024-11-30', revenue: 2180, orders: 29 },
    { date: '2024-12-01', revenue: 1950, orders: 26 }
  ]);

  const getRevenueGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
        <p class="text-gray-600">Track performance and business insights</p>
      </div>

      {/* Period Selection */}
      <div class="mb-6 bg-white rounded-lg shadow p-4">
        <div class="flex space-x-4">
          <button
            class={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedPeriod() === '7days'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedPeriod('7days')}
          >
            Last 7 Days
          </button>
          <button
            class={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedPeriod() === '30days'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedPeriod('30days')}
          >
            Last 30 Days
          </button>
          <button
            class={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedPeriod() === '90days'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedPeriod('90days')}
          >
            Last 90 Days
          </button>
        </div>
      </div>

      <Show
        when={!dashboardStats.loading}
        fallback={
          <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        }
      >
        {/* Key Metrics */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Revenue</p>
                <p class="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardStats()?.revenue.thisMonth || 0)}
                </p>
                <p class={`text-sm ${getRevenueGrowthColor(dashboardStats()?.revenue.growth || 0)}`}>
                  {formatPercent(dashboardStats()?.revenue.growth || 0)} from last month
                </p>
              </div>
              <div class="p-3 bg-green-100 rounded-full">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Orders</p>
                <p class="text-2xl font-bold text-gray-900">
                  {dashboardStats()?.orders.thisWeek || 0}
                </p>
                <p class="text-sm text-gray-500">
                  Avg: {formatCurrency(dashboardStats()?.orders.avgOrderValue || 0)}
                </p>
              </div>
              <div class="p-3 bg-blue-100 rounded-full">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Customers</p>
                <p class="text-2xl font-bold text-gray-900">
                  {dashboardStats()?.customers.total || 0}
                </p>
                <p class="text-sm text-green-600">
                  +{dashboardStats()?.customers.new || 0} new this month
                </p>
              </div>
              <div class="p-3 bg-purple-100 rounded-full">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Customer Retention</p>
                <p class="text-2xl font-bold text-gray-900">
                  {(dashboardStats()?.customers.retention || 0).toFixed(1)}%
                </p>
                <p class="text-sm text-gray-500">
                  {dashboardStats()?.customers.returning || 0} returning customers
                </p>
              </div>
              <div class="p-3 bg-yellow-100 rounded-full">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sales Chart */}
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
            <div class="h-64 flex items-end justify-between space-x-2">
              <For each={salesData()}>
                {(data) => {
                  const maxRevenue = Math.max(...salesData().map(d => d.revenue));
                  const height = (data.revenue / maxRevenue) * 100;
                  return (
                    <div class="flex flex-col items-center flex-1">
                      <div
                        class="bg-primary-600 rounded-t w-full transition-all duration-300 hover:bg-primary-700"
                        style={`height: ${height}%`}
                        title={`${new Date(data.date).toLocaleDateString()}: ${formatCurrency(data.revenue)}`}
                      ></div>
                      <span class="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                        {new Date(data.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>

          {/* Order Status */}
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-yellow-400 rounded-full mr-3"></div>
                  <span class="text-sm font-medium">Pending</span>
                </div>
                <span class="text-lg font-bold">{dashboardStats()?.orders.pending || 0}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                  <span class="text-sm font-medium">In Progress</span>
                </div>
                <span class="text-lg font-bold">12</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                  <span class="text-sm font-medium">Completed</span>
                </div>
                <span class="text-lg font-bold">{dashboardStats()?.orders.completed || 0}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-red-400 rounded-full mr-3"></div>
                  <span class="text-sm font-medium">Cancelled</span>
                </div>
                <span class="text-lg font-bold">2</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Products */}
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900">Chocolate Croissants</p>
                  <p class="text-xs text-gray-500">89 sold this week</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-green-600">$1,780</p>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900">Sourdough Bread</p>
                  <p class="text-xs text-gray-500">67 sold this week</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-green-600">$536</p>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900">Vanilla Cupcakes</p>
                  <p class="text-xs text-gray-500">54 sold this week</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-green-600">$162</p>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900">Blueberry Muffins</p>
                  <p class="text-xs text-gray-500">43 sold this week</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-green-600">$129</p>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Alerts */}
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Inventory Alerts</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p class="text-sm font-medium text-red-900">All-Purpose Flour</p>
                  <p class="text-xs text-red-600">Out of stock</p>
                </div>
                <span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Urgent</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p class="text-sm font-medium text-yellow-900">Chocolate Chips</p>
                  <p class="text-xs text-yellow-600">2.5 lbs remaining</p>
                </div>
                <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Low</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p class="text-sm font-medium text-yellow-900">Vanilla Extract</p>
                  <p class="text-xs text-yellow-600">150ml remaining</p>
                </div>
                <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Low</span>
              </div>
            </div>
            <button class="w-full mt-4 px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700">
              View Full Inventory
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default AnalyticsPage;