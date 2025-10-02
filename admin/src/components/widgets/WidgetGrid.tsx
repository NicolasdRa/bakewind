import { Component, For, Show, createSignal } from 'solid-js';
import { widgetsStore, type Widget } from '../../stores/widgets';
import { TrashIcon } from '../icons';
import MetricsWidget from './MetricsWidget';

interface WidgetGridProps {
  layoutType: 'grid' | 'list' | 'masonry';
}

/**
 * WidgetGrid - Displays widgets in different layouts with drag & drop support
 * Supports grid, list, and masonry layouts
 * Max 20 widgets per user
 */
const WidgetGrid: Component<WidgetGridProps> = (props) => {
  const [draggedWidget, setDraggedWidget] = createSignal<Widget | null>(null);
  const [dropTarget, setDropTarget] = createSignal<number | null>(null);

  const handleDragStart = (widget: Widget, event: DragEvent) => {
    setDraggedWidget(widget);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', '');
    }
  };

  const handleDragOver = (index: number, event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    setDropTarget(index);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (targetIndex: number, event: DragEvent) => {
    event.preventDefault();
    const dragged = draggedWidget();

    if (!dragged) return;

    const widgets = widgetsStore.widgets;
    const draggedIndex = widgets.findIndex((w) => w.id === dragged.id);

    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedWidget(null);
      setDropTarget(null);
      return;
    }

    // Reorder widgets
    const reordered = [...widgets];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Update positions
    const updated = reordered.map((widget, index) => ({
      ...widget,
      position: {
        ...widget.position,
        y: index,
      },
    }));

    widgetsStore.reorderWidgets(updated);
    setDraggedWidget(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
    setDropTarget(null);
  };

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'metrics':
        return <MetricsWidget config={widget.config} />;
      case 'orders':
        return <div class="text-gray-600 dark:text-gray-400">Orders Widget (Coming Soon)</div>;
      case 'inventory':
        return <div class="text-gray-600 dark:text-gray-400">Inventory Widget (Coming Soon)</div>;
      case 'production':
        return <div class="text-gray-600 dark:text-gray-400">Production Widget (Coming Soon)</div>;
      case 'chart':
        return <div class="text-gray-600 dark:text-gray-400">Chart Widget (Coming Soon)</div>;
      default:
        return <div class="text-gray-600 dark:text-gray-400">Unknown Widget Type</div>;
    }
  };

  const getGridClass = () => {
    switch (props.layoutType) {
      case 'grid':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4';
      case 'list':
        return 'flex flex-col gap-4';
      case 'masonry':
        return 'columns-1 md:columns-2 lg:columns-3 gap-4';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4';
    }
  };

  const getWidgetStyle = (widget: Widget) => {
    if (props.layoutType === 'grid') {
      return {
        'grid-column': `span ${Math.min(widget.position.w, 4)}`,
        'grid-row': `span ${widget.position.h}`,
      };
    }
    return {};
  };

  return (
    <Show
      when={widgetsStore.widgets.length > 0}
      fallback={
        <div class="text-center py-12">
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
      <div class={getGridClass()}>
        <For each={widgetsStore.widgets}>
          {(widget, index) => (
            <div
              draggable={true}
              onDragStart={(e) => handleDragStart(widget, e)}
              onDragOver={(e) => handleDragOver(index(), e)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(index(), e)}
              onDragEnd={handleDragEnd}
              class="relative bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all cursor-move"
              classList={{
                'ring-2 ring-amber-500': dropTarget() === index(),
                'opacity-50': draggedWidget()?.id === widget.id,
                'break-inside-avoid mb-4': props.layoutType === 'masonry',
              }}
              style={getWidgetStyle(widget)}
            >
              {/* Widget Header */}
              <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {widget.type} Widget
                </h3>
                <button
                  onClick={() => widgetsStore.removeWidget(widget.id)}
                  class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                  aria-label="Remove widget"
                  title="Remove widget"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>

              {/* Widget Content */}
              <div class="p-4">
                {renderWidget(widget)}
              </div>

              {/* Drag Handle Indicator */}
              <div class="absolute top-2 left-2 text-gray-400 pointer-events-none">
                <svg
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </div>
            </div>
          )}
        </For>
      </div>

      {/* Max Widgets Message */}
      <Show when={widgetsStore.widgets.length >= 20}>
        <div class="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p class="text-sm text-amber-800 dark:text-amber-200">
            Maximum of 20 widgets reached. Remove a widget to add a new one.
          </p>
        </div>
      </Show>
    </Show>
  );
};

export default WidgetGrid;
