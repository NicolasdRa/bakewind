import { Component } from 'solid-js';

interface ChartWidgetProps {
  chartType?: 'line' | 'bar' | 'pie';
  data?: unknown;
  config?: Record<string, unknown>;
}

/**
 * ChartWidget - Displays charts for analytics
 * Supports line, bar, and pie charts
 * Note: This is a placeholder - integrate with Chart.js or similar library for full functionality
 */
const ChartWidget: Component<ChartWidgetProps> = (props) => {
  const chartType = props.chartType || 'line';

  // Placeholder data for demonstration
  const sampleData = [
    { label: 'Mon', value: 120 },
    { label: 'Tue', value: 150 },
    { label: 'Wed', value: 180 },
    { label: 'Thu', value: 140 },
    { label: 'Fri', value: 200 },
    { label: 'Sat', value: 250 },
    { label: 'Sun', value: 220 },
  ];

  const maxValue = Math.max(...sampleData.map((d) => d.value));

  return (
    <div class="space-y-4">
      {/* Chart Type Indicator */}
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sales This Week
        </h4>
        <span class="text-xs text-gray-500 dark:text-gray-400 capitalize">
          {chartType} Chart
        </span>
      </div>

      {/* Simple Bar Chart Placeholder */}
      {chartType === 'bar' && (
        <div class="flex items-end justify-between gap-2 h-40">
          {sampleData.map((item) => {
            const height = (item.value / maxValue) * 100;
            return (
              <div class="flex flex-col items-center gap-1 flex-1">
                <div
                  class="w-full bg-amber-500 dark:bg-amber-600 rounded-t transition-all hover:bg-amber-600 dark:hover:bg-amber-700"
                  style={{ height: `${height}%` }}
                  title={`${item.label}: ${item.value}`}
                />
                <span class="text-xs text-gray-600 dark:text-gray-400">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Simple Line Chart Placeholder */}
      {chartType === 'line' && (
        <div class="relative h-40">
          <svg class="w-full h-full" viewBox="0 0 700 160">
            <polyline
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              class="text-amber-500 dark:text-amber-400"
              points={sampleData
                .map((item, i) => {
                  const x = (i / (sampleData.length - 1)) * 700;
                  const y = 160 - (item.value / maxValue) * 140;
                  return `${x},${y}`;
                })
                .join(' ')}
            />
            {sampleData.map((item, i) => {
              const x = (i / (sampleData.length - 1)) * 700;
              const y = 160 - (item.value / maxValue) * 140;
              return (
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  class="fill-amber-500 dark:fill-amber-400"
                >
                  <title>{`${item.label}: ${item.value}`}</title>
                </circle>
              );
            })}
          </svg>
          <div class="flex justify-between mt-2">
            {sampleData.map((item) => (
              <span class="text-xs text-gray-600 dark:text-gray-400">
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pie Chart Placeholder */}
      {chartType === 'pie' && (
        <div class="flex items-center justify-center h-40">
          <div class="relative w-32 h-32">
            {/* Simplified pie chart representation */}
            <svg class="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                stroke-width="20"
                class="text-amber-500 dark:text-amber-400"
                stroke-dasharray="75 25"
                transform="rotate(-90 50 50)"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                stroke-width="20"
                class="text-blue-500 dark:text-blue-400"
                stroke-dasharray="25 75"
                stroke-dashoffset="-75"
                transform="rotate(-90 50 50)"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div class="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div class="text-center">
          <p class="text-xs text-gray-600 dark:text-gray-400">Total</p>
          <p class="text-sm font-semibold text-gray-900 dark:text-white">
            {sampleData.reduce((sum, item) => sum + item.value, 0)}
          </p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-600 dark:text-gray-400">Average</p>
          <p class="text-sm font-semibold text-gray-900 dark:text-white">
            {Math.round(
              sampleData.reduce((sum, item) => sum + item.value, 0) / sampleData.length
            )}
          </p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-600 dark:text-gray-400">Peak</p>
          <p class="text-sm font-semibold text-gray-900 dark:text-white">
            {maxValue}
          </p>
        </div>
      </div>

      {/* Note */}
      <p class="text-xs text-gray-500 dark:text-gray-400 italic">
        Note: Integrate with Chart.js or similar library for interactive charts
      </p>
    </div>
  );
};

export default ChartWidget;
