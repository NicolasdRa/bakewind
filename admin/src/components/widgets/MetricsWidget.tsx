import { Component, Show } from 'solid-js';
import { realtimeStore } from '../../stores/realtime';

interface MetricsWidgetProps {
  config?: Record<string, unknown>;
}

/**
 * MetricsWidget - Displays real-time dashboard metrics
 * Updates automatically via WebSocket connection
 */
const MetricsWidget: Component<MetricsWidgetProps> = () => {
  const metrics = realtimeStore.metrics;

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined) return '—';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (num: number | undefined): string => {
    if (num === undefined) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const metricCards = [
    {
      label: 'Total Orders',
      value: () => formatNumber(metrics().total_orders),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      icon: (
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      ),
    },
    {
      label: 'Pending Orders',
      value: () => formatNumber(metrics().pending_orders),
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      icon: (
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: 'Revenue Today',
      value: () => formatCurrency(metrics().revenue_today),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      icon: (
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: 'Low Stock Items',
      value: () => formatNumber(metrics().low_stock_items),
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      icon: (
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
    {
      label: 'Active Batches',
      value: () => formatNumber(metrics().active_production_batches),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      icon: (
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div class="space-y-3">
      {/* Connection Status */}
      <Show when={!realtimeStore.isConnected()}>
        <div class="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
          Real-time updates disconnected. Reconnecting...
        </div>
      </Show>

      {/* Metric Cards */}
      {metricCards.map((metric) => (
        <div class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <div class={`p-2 rounded-lg ${metric.bgColor} ${metric.color}`}>
            {metric.icon}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {metric.label}
            </p>
            <p class={`text-xl font-bold ${metric.color}`}>
              {metric.value()}
            </p>
          </div>
        </div>
      ))}

      {/* Last Updated */}
      <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
        <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
          <Show
            when={realtimeStore.isConnected()}
            fallback="Waiting for connection..."
          >
            Live updates active
          </Show>
        </p>
      </div>
    </div>
  );
};

export default MetricsWidget;
