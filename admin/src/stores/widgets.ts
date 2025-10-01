/**
 * Widgets Store
 * Manages dashboard widget configuration state
 */

import { createSignal, createEffect } from 'solid-js';
import { widgetsApi, Widget, WidgetConfiguration, UpdateWidgetConfigDto } from '../api/client';

// Store state
const [widgetConfig, setWidgetConfig] = createSignal<WidgetConfiguration | null>(null);
const [loading, setLoading] = createSignal(false);
const [error, setError] = createSignal<string | null>(null);

// Actions
export const widgetsStore = {
  // State getters
  get config() {
    return widgetConfig();
  },
  get loading() {
    return loading();
  },
  get error() {
    return error();
  },
  get widgets() {
    return widgetConfig()?.widgets || [];
  },
  get layoutType() {
    return widgetConfig()?.layout_type || 'grid';
  },

  // Fetch widget configuration
  async fetchConfig() {
    setLoading(true);
    setError(null);
    try {
      const config = await widgetsApi.getConfig();
      setWidgetConfig(config);

      // Cache in localStorage
      localStorage.setItem('widget_config', JSON.stringify(config));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch widget configuration';

      // If 404, user hasn't created config yet - use default
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        setWidgetConfig({
          id: 'temp',
          user_id: 'temp',
          layout_type: 'grid',
          widgets: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        setError(errorMessage);
      }

      // Try to load from cache on error
      const cached = localStorage.getItem('widget_config');
      if (cached) {
        setWidgetConfig(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  },

  // Update widget configuration
  async updateConfig(dto: UpdateWidgetConfigDto) {
    setLoading(true);
    setError(null);
    try {
      const updated = await widgetsApi.updateConfig(dto);
      setWidgetConfig(updated);

      // Update cache
      localStorage.setItem('widget_config', JSON.stringify(updated));

      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update widget configuration';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  },

  // Add a widget (enforces max 20)
  addWidget(widget: Widget) {
    const current = widgetConfig();
    if (!current) return;

    if (current.widgets.length >= 20) {
      setError('Maximum 20 widgets allowed');
      return;
    }

    const newWidgets = [...current.widgets, widget];
    return this.updateConfig({
      layout_type: current.layout_type,
      widgets: newWidgets,
    });
  },

  // Remove a widget
  removeWidget(widgetId: string) {
    const current = widgetConfig();
    if (!current) return;

    const newWidgets = current.widgets.filter(w => w.id !== widgetId);
    return this.updateConfig({
      layout_type: current.layout_type,
      widgets: newWidgets,
    });
  },

  // Reorder widgets
  reorderWidgets(newOrder: Widget[]) {
    const current = widgetConfig();
    if (!current) return;

    return this.updateConfig({
      layout_type: current.layout_type,
      widgets: newOrder,
    });
  },

  // Change layout type
  setLayoutType(layoutType: 'grid' | 'list' | 'masonry') {
    const current = widgetConfig();
    if (!current) return;

    return this.updateConfig({
      layout_type: layoutType,
      widgets: current.widgets,
    });
  },

  // Clear error
  clearError() {
    setError(null);
  },
};

export default widgetsStore;