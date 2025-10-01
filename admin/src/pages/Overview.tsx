/**
 * Overview/Dashboard Page
 * Displays customizable widgets with bakery metrics
 */

import { Component, createEffect, Show, For } from 'solid-js';
import { widgetsStore } from '../stores/widgets';

const Overview: Component = () => {
  // Load widget configuration on mount
  createEffect(() => {
    widgetsStore.fetchConfig();
  });

  const handleLayoutChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    const layout = target.value as 'grid' | 'list' | 'masonry';
    widgetsStore.setLayoutType(layout);
  };

  const handleAddWidget = () => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: 'metrics' as const,
      position: {
        x: 0,
        y: widgetsStore.widgets.length,
        w: 2,
        h: 1,
      },
      config: {},
    };
    widgetsStore.addWidget(newWidget);
  };

  const handleRemoveWidget = (widgetId: string) => {
    widgetsStore.removeWidget(widgetId);
  };

  return (
    <div class="p-6">
      {/* Header */}
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard Overview
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Welcome to your bakery management dashboard
        </p>
      </div>

      {/* Controls */}
      <div class="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Layout:
          </label>
          <select
            value={widgetsStore.layoutType}
            onChange={handleLayoutChange}
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="grid">Grid</option>
            <option value="list">List</option>
            <option value="masonry">Masonry</option>
          </select>

          <span class="text-sm text-gray-500 dark:text-gray-400">
            {widgetsStore.widgets.length} / 20 widgets
          </span>
        </div>

        <button
          onClick={handleAddWidget}
          disabled={widgetsStore.widgets.length >= 20 || widgetsStore.loading}
          class="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors"
        >
          Add Widget
        </button>
      </div>

      {/* Error Display */}
      <Show when={widgetsStore.error}>
        <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div class="flex items-center justify-between">
            <p class="text-red-800 dark:text-red-200">
              {widgetsStore.error}
            </p>
            <button
              onClick={() => widgetsStore.clearError()}
              class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      </Show>

      {/* Loading State */}
      <Show when={widgetsStore.loading}>
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </Show>

      {/* Widgets Grid */}
      <Show when={!widgetsStore.loading}>
        <div
          class={
            widgetsStore.layoutType === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
              : widgetsStore.layoutType === 'list'
              ? 'flex flex-col gap-4'
              : 'columns-1 md:columns-2 lg:columns-3 gap-4'
          }
        >
          <Show
            when={widgetsStore.widgets.length > 0}
            fallback={
              <div class="col-span-full text-center py-12">
                <div class="text-gray-400 mb-4">
                  <svg
                    class="mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width={2}
                      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                    />
                  </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No widgets yet
                </h3>
                <p class="text-gray-500 dark:text-gray-400 mb-4">
                  Click "Add Widget" to start customizing your dashboard
                </p>
              </div>
            }
          >
            <For each={widgetsStore.widgets}>
              {(widget) => (
                <div
                  class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow relative"
                  style={{
                    'grid-column': widgetsStore.layoutType === 'grid' ? `span ${widget.position.w}` : 'auto',
                    'grid-row': widgetsStore.layoutType === 'grid' ? `span ${widget.position.h}` : 'auto',
                  }}
                >
                  {/* Widget Header */}
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                      {widget.type} Widget
                    </h3>
                    <button
                      onClick={() => handleRemoveWidget(widget.id)}
                      class="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Remove widget"
                    >
                      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Widget Content (Placeholder) */}
                  <div class="text-gray-600 dark:text-gray-400">
                    <p class="text-sm">Widget ID: {widget.id}</p>
                    <p class="text-sm">Type: {widget.type}</p>
                    <p class="text-sm">Position: ({widget.position.x}, {widget.position.y})</p>
                    <p class="text-sm">Size: {widget.position.w}x{widget.position.h}</p>

                    <div class="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded text-center">
                      <p class="text-2xl font-bold text-amber-600">0</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Sample Metric
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </Show>
        </div>
      </Show>

      {/* Info Card */}
      <div class="mt-8 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <h3 class="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
          🎉 Widgets Module - Proof of Concept Complete!
        </h3>
        <div class="text-sm text-amber-800 dark:text-amber-200 space-y-2">
          <p>
            ✅ <strong>Backend API:</strong> GET /api/v1/widgets/config, PUT /api/v1/widgets/config
          </p>
          <p>
            ✅ <strong>Database:</strong> widget_configurations table with JSONB storage
          </p>
          <p>
            ✅ <strong>Frontend Store:</strong> Reactive state management with Solid.js
          </p>
          <p>
            ✅ <strong>Validation:</strong> Max 20 widgets enforced client & server-side
          </p>
          <p>
            ✅ <strong>Persistence:</strong> Changes saved to database & localStorage cache
          </p>
          <p class="mt-4 text-amber-700 dark:text-amber-300">
            <strong>Try it:</strong> Add widgets, change layout, reload the page - your configuration persists!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Overview;