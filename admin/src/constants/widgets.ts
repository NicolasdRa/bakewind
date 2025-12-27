import { WidgetType } from '~/types/widget'
import StatsWidget from '~/components/widgets/StatsWidget/StatsWidget'
import ActivityWidget from '~/components/widgets/ActivityWidget/ActivityWidget'
import CalendarWidget from '~/components/widgets/CalendarWidget/CalendarWidget'
import ChartWidget from '~/components/widgets/ChartWidget/ChartWidget'
import ClockWidget from '~/components/widgets/ClockWidget/ClockWidget'
import NotesWidget from '~/components/widgets/NotesWidget/NotesWidget'
import TodoWidget from '~/components/widgets/TodoWidget/TodoWidget'
import BakeryMetricsWidget from '~/components/widgets/BakeryMetricsWidget/BakeryMetricsWidget'
import OrdersWidget from '~/components/widgets/OrdersWidget/OrdersWidget'
import InventoryWidget from '~/components/widgets/InventoryWidget/InventoryWidget'
import ProductionWidget from '~/components/widgets/ProductionWidget/ProductionWidget'

// Single source of truth for widget metadata
export const WIDGET_REGISTRY = {
  'bakery-metrics-widget': { icon: '📊', name: 'Bakery Metrics', defaultSize: 'large' as const },
  'orders-widget': { icon: '📋', name: 'Recent Orders', defaultSize: 'medium' as const },
  'inventory-widget': { icon: '📦', name: 'Inventory Status', defaultSize: 'medium' as const },
  'production-widget': { icon: '🥖', name: 'Production', defaultSize: 'medium' as const },
  'stats-widget': { icon: '📈', name: 'Statistics', defaultSize: 'large' as const },
  'chart-widget': { icon: '💹', name: 'Chart', defaultSize: 'large' as const },
  'activity-widget': { icon: '🔔', name: 'Activity', defaultSize: 'medium' as const },
  'calendar-widget': { icon: '📅', name: 'Calendar', defaultSize: 'medium' as const },
  'clock-widget': { icon: '🕒', name: 'Clock', defaultSize: 'small' as const },
  'notes-widget': { icon: '📝', name: 'Notes', defaultSize: 'medium' as const },
  'todo-widget': { icon: '✅', name: 'Todo List', defaultSize: 'medium' as const },
} as const

export type WidgetTypeKey = keyof typeof WIDGET_REGISTRY

// Widget component map for dynamic rendering
export const WIDGET_COMPONENTS = {
  'bakery-metrics-widget': BakeryMetricsWidget,
  'orders-widget': OrdersWidget,
  'inventory-widget': InventoryWidget,
  'production-widget': ProductionWidget,
  'stats-widget': StatsWidget,
  'notes-widget': NotesWidget,
  'clock-widget': ClockWidget,
  'chart-widget': ChartWidget,
  'activity-widget': ActivityWidget,
  'calendar-widget': CalendarWidget,
  'todo-widget': TodoWidget,
}

// Derived widget types for UI selection
export const WIDGET_TYPES: WidgetType[] = Object.entries(WIDGET_REGISTRY).map(([type, config]) => ({
  type,
  icon: config.icon,
  name: config.name,
}))
