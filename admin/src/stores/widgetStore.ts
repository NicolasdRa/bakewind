import { createSignal } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
import { WidgetConfig } from '~/types/widget'
import { WIDGET_REGISTRY, WidgetTypeKey } from '~/constants/widgets'
import { logger } from '~/utils/logger'

// Widget state
const [widgets, setWidgets] = createStore<Record<string, WidgetConfig>>({})
const [widgetIdCounter, setWidgetIdCounter] = createSignal(1)
const [isInitialized, setIsInitialized] = createSignal(false)

// Helper functions
const generateWidgetId = () => {
  const id = `widget-${Date.now()}-${widgetIdCounter()}`
  setWidgetIdCounter(prev => prev + 1)
  return id
}

const getDefaultTitle = (type: string): string => {
  const config = WIDGET_REGISTRY[type as WidgetTypeKey]
  return config?.name || 'Widget'
}

const getDefaultSize = (type: string): 'small' | 'medium' | 'large' => {
  const config = WIDGET_REGISTRY[type as WidgetTypeKey]
  return config?.defaultSize || 'medium'
}

const saveWidgets = () => {
  if (typeof window !== 'undefined') {
    const widgetData = Object.values(widgets).filter(Boolean)
    localStorage.setItem('dashboardWidgets', JSON.stringify(widgetData))
  }
}

// Widget actions
export const widgetActions = {
  initialize: () => {
    if (isInitialized()) {
      logger.info('[WidgetStore] Already initialized')
      return
    }

    logger.info('[WidgetStore] Initializing widget system...')

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardWidgets')
      if (saved) {
        try {
          const widgetData = JSON.parse(saved) as WidgetConfig[]
          const widgetRecord: Record<string, WidgetConfig> = {}
          widgetData.forEach(config => {
            widgetRecord[config.id] = config
          })
          setWidgets(reconcile(widgetRecord))
          setIsInitialized(true)
          logger.info('[WidgetStore] Loaded saved widgets')
          return
        } catch (e) {
          console.error('[WidgetStore] Failed to load saved widgets:', e)
        }
      }
    }

    // Fall back to default widgets
    widgetActions.loadDefaultWidgets()
    setIsInitialized(true)
    logger.info('[WidgetStore] Initialization complete')
  },

  addWidget: (type: string, config: Partial<WidgetConfig> = {}) => {
    logger.info('[WidgetStore] Adding widget of type:', type)
    const widgetId = config.id || generateWidgetId()
    const widgetConfig: WidgetConfig = {
      id: widgetId,
      type: type,
      title: config.title || getDefaultTitle(type),
      position: config.position || { x: 0, y: 0 },
      size: config.size || getDefaultSize(type),
      ...config
    }

    setWidgets(widgetId, widgetConfig)
    saveWidgets()
  },

  removeWidget: (widgetId: string) => {
    logger.info(`[WidgetStore] Removing widget ${widgetId}`)
    setWidgets(widgetId, undefined!)
    saveWidgets()
  },

  clearLayout: () => {
    logger.info('[WidgetStore] Clearing layout')
    setWidgets(reconcile({}))
    saveWidgets()
  },

  resetLayout: () => {
    logger.info('[WidgetStore] Resetting layout')
    widgetActions.clearLayout()
    setTimeout(() => {
      widgetActions.loadDefaultWidgets()
    }, 100)
  },

  loadDefaultWidgets: () => {
    const defaultWidgets = [
      { type: 'bakery-metrics-widget', title: 'Bakery Metrics' },
      { type: 'orders-widget', title: 'Recent Orders' },
      { type: 'inventory-widget', title: 'Inventory Status' },
      { type: 'production-widget', title: 'Today\'s Production' },
      { type: 'clock-widget', title: 'Current Time' }
    ]

    const widgetRecord: Record<string, WidgetConfig> = {}
    defaultWidgets.forEach(widget => {
      const widgetId = generateWidgetId()
      widgetRecord[widgetId] = {
        id: widgetId,
        type: widget.type,
        position: { x: 0, y: 0 },
        size: getDefaultSize(widget.type),
        title: widget.title || getDefaultTitle(widget.type)
      }
    })
    setWidgets(reconcile(widgetRecord))
    saveWidgets()
  }
}

// Export store for reactive access
export const widgetStore = {
  widgets,
  isInitialized,
  actions: widgetActions
}

// Hook for component usage
export const useWidgetStore = () => widgetStore
