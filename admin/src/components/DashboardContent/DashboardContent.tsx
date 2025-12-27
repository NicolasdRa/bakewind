import { createSignal, onMount, For, Show, Index, ErrorBoundary } from 'solid-js'
import { Portal } from 'solid-js/web'
import { useAppStore } from '~/stores/appStore'
import BaseWidget from '../BaseWidget/BaseWidget'
import Button from '../common/Button'
import styles from './DashboardContent.module.css'
import StatsWidget from '../widgets/StatsWidget/StatsWidget'
import ActivityWidget from '../widgets/ActivityWidget/ActivityWidget'
import CalendarWidget from '../widgets/CalendarWidget/CalendarWidget'
import ChartWidget from '../widgets/ChartWidget/ChartWidget'
import ClockWidget from '../widgets/ClockWidget/ClockWidget'
import NotesWidget from '../widgets/NotesWidget/NotesWidget'
import TodoWidget from '../widgets/TodoWidget/TodoWidget'
import BakeryMetricsWidget from '../widgets/BakeryMetricsWidget/BakeryMetricsWidget'
import OrdersWidget from '../widgets/OrdersWidget/OrdersWidget'
import InventoryWidget from '../widgets/InventoryWidget/InventoryWidget'
import ProductionWidget from '../widgets/ProductionWidget/ProductionWidget'
import { WidgetConfig, WidgetType } from '~/types/widget'
import { logger } from '~/utils/logger'

interface DashboardContentProps {
  layout: string
}

export default function DashboardContent(props: DashboardContentProps) {
  const { state, actions } = useAppStore()
  const [widgets, setWidgets] = createSignal<Map<string, WidgetConfig>>(new Map())
  const [widgetIdCounter, setWidgetIdCounter] = createSignal(1)

  // Widget component map for Dynamic rendering
  const widgetComponents = {
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

  const widgetTypes: WidgetType[] = [
    { type: 'bakery-metrics-widget', icon: '📊', name: 'Bakery Metrics' },
    { type: 'orders-widget', icon: '📋', name: 'Recent Orders' },
    { type: 'inventory-widget', icon: '📦', name: 'Inventory Status' },
    { type: 'production-widget', icon: '🥖', name: 'Production' },
    { type: 'stats-widget', icon: '📈', name: 'Statistics' },
    { type: 'chart-widget', icon: '💹', name: 'Chart' },
    { type: 'activity-widget', icon: '🔔', name: 'Activity' },
    { type: 'calendar-widget', icon: '📅', name: 'Calendar' },
    { type: 'weather-widget', icon: '🌤️', name: 'Weather' },
    { type: 'clock-widget', icon: '🕒', name: 'Clock' },
    { type: 'notes-widget', icon: '📝', name: 'Notes' },
    { type: 'todo-widget', icon: '✅', name: 'Todo List' },
    { type: 'model-viewer-widget', icon: '🚀', name: 'Model Viewer' },
    { type: 'graphql-data-widget', icon: '🔗', name: 'GraphQL Data' }
  ]

  onMount(() => {
    logger.info('Dashboard Content: Initializing widget system...')
    loadSavedWidgets()
    
    // Register layout action callbacks with store
    actions.onClearLayout(() => clearLayout())
    actions.onResetLayout(() => resetLayout())
    
    logger.info('Dashboard Content: Initialization complete')
  })

  const generateWidgetId = () => {
    const id = `widget-${Date.now()}-${widgetIdCounter()}`
    setWidgetIdCounter(prev => prev + 1)
    return id
  }

  const addWidget = (type: string, config: Partial<WidgetConfig> = {}) => {
    logger.info('Dashboard Content: Adding widget of type:', type)
    const widgetId = config.id || generateWidgetId()
    const widgetConfig: WidgetConfig = {
      id: widgetId,
      type: type,
      title: config.title || getDefaultTitle(type),
      position: config.position || { x: 0, y: 0 },
      size: config.size || getDefaultSize(type),
      ...config
    }
    
    logger.info('Dashboard Content: Widget config:', widgetConfig)
    setWidgets(prev => {
      const newMap = new Map(prev)
      newMap.set(widgetId, widgetConfig)
      return newMap
    })
    saveWidgets()
    actions.setShowWidgetModal(false)
  }

  const removeWidget = (widgetId: string) => {
    logger.info(`Dashboard Content: Removing widget ${widgetId}`)
    setWidgets(prev => {
      const newMap = new Map(prev)
      const deleted = newMap.delete(widgetId)
      logger.info(`Dashboard Content: Widget deleted: ${deleted}, Widgets count: ${newMap.size}`)
      return newMap
    })
    saveWidgets()
  }

  const getDefaultTitle = (type: string): string => {
    const titles: Record<string, string> = {
      'bakery-metrics-widget': 'Bakery Metrics',
      'orders-widget': 'Recent Orders',
      'inventory-widget': 'Inventory Status',
      'production-widget': 'Today\'s Production',
      'stats-widget': 'Statistics',
      'notes-widget': 'Notes',
      'clock-widget': 'Clock',
      'chart-widget': 'Analytics Chart',
      'weather-widget': 'Weather',
      'calendar-widget': 'Calendar',
      'todo-widget': 'Todo List',
      'activity-widget': 'Recent Activity',
      'model-viewer-widget': '3D Model Viewer'
    }
    return titles[type] || 'Widget'
  }

  const getDefaultSize = (type: string): 'small' | 'medium' | 'large' => {
    const sizes: Record<string, 'small' | 'medium' | 'large'> = {
      'bakery-metrics-widget': 'large',
      'orders-widget': 'medium',
      'inventory-widget': 'medium',
      'production-widget': 'medium',
      'stats-widget': 'large',
      'notes-widget': 'medium',
      'clock-widget': 'small',
      'chart-widget': 'large',
      'weather-widget': 'small',
      'calendar-widget': 'medium',
      'todo-widget': 'medium',
      'activity-widget': 'medium',
      'model-viewer-widget': 'large'
    }
    return sizes[type] || 'medium'
  }

  const saveWidgets = () => {
    if (typeof window !== 'undefined') {
      const widgetData = Array.from(widgets().values())
      localStorage.setItem('dashboardWidgets', JSON.stringify(widgetData))
    }
  }

  const loadSavedWidgets = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardWidgets')
      if (saved) {
        try {
          const widgetData = JSON.parse(saved) as WidgetConfig[]
          const newMap = new Map<string, WidgetConfig>()
          widgetData.forEach(config => {
            newMap.set(config.id, config)
          })
          setWidgets(newMap)
          return
        } catch (e) {
          console.error('Failed to load saved widgets:', e)
        }
      }
    }
    // Fall back to default widgets
    loadDefaultWidgets()
  }

  const loadDefaultWidgets = () => {
    const defaultWidgets = [
      { type: 'bakery-metrics-widget', title: 'Bakery Metrics' },
      { type: 'orders-widget', title: 'Recent Orders' },
      { type: 'inventory-widget', title: 'Inventory Status' },
      { type: 'production-widget', title: 'Today\'s Production' },
      { type: 'clock-widget', title: 'Current Time' }
    ]
    
    defaultWidgets.forEach(widget => {
      const widgetId = generateWidgetId()
      const widgetConfig: WidgetConfig = {
        id: widgetId,
        position: { x: 0, y: 0 },
        size: getDefaultSize(widget.type),
        ...widget,
        title: widget.title || getDefaultTitle(widget.type)
      }
      setWidgets(prev => {
        const newMap = new Map(prev)
        newMap.set(widgetId, widgetConfig)
        return newMap
      })
    })
    saveWidgets()
  }

  const clearLayout = () => {
    setWidgets(new Map())
    saveWidgets()
  }

  const resetLayout = () => {
    clearLayout()
    setTimeout(() => {
      loadDefaultWidgets()
    }, 100)
  }

  const renderWidget = (config: WidgetConfig) => {
    const commonProps = {
      widgetId: config.id,
      title: config.title,
      size: config.size,
      onClose: () => removeWidget(config.id)
    }

    const WidgetComponent = widgetComponents[config.type as keyof typeof widgetComponents]

    if (!WidgetComponent) {
      return <BaseWidget {...commonProps}>Unknown widget type</BaseWidget>
    }

    return <WidgetComponent {...commonProps} />
  }

  const getLayoutClasses = () => {
    switch (props.layout) {
      case 'list':
        return `${styles.mainContainer} ${styles.layoutList}`
      case 'masonry':
        return `${styles.mainContainer} ${styles.layoutMasonry}`
      default:
        return `${styles.mainContainer} ${styles.layoutGrid}`
    }
  }

  return (
    <>
      <main class={getLayoutClasses()}>
        <For each={Array.from(widgets().values())}>
          {(config) => (
            <div class={`${styles.widgetContainer} ${props.layout === 'list' ? styles.widgetContainerList : ''}`}>
              <ErrorBoundary 
                fallback={(err, reset) => (
                  <BaseWidget 
                    widgetId={config.id}
                    title={config.title}
                    size={config.size}
                    onClose={() => removeWidget(config.id)}
                  >
                    <div class={styles.errorContainer}>
                      <div class={styles.errorIcon}>⚠️</div>
                      <h3 class={styles.errorTitle}>Widget Error</h3>
                      <p class={styles.errorMessage}>{err.message}</p>
                      <Button
                        variant="secondary"
                        onClick={reset}
                        class={styles.errorButton}
                      >
                        Try Again
                      </Button>
                    </div>
                  </BaseWidget>
                )}
              >
                {renderWidget(config)}
              </ErrorBoundary>
            </div>
          )}
        </For>
      </main>

      {/* Widget Addition Modal */}
      <Show when={state.showWidgetModal}>
        <Portal>
          <div 
            class={styles.modalOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                actions.setShowWidgetModal(false)
              }
            }}
          >
            <div class={styles.modalContainer}>
              <div class={styles.modalHeader}>
                <h2 class={styles.modalTitle}>Add Widget</h2>
                <Button
                  variant="ghost"
                  onClick={() => actions.setShowWidgetModal(false)}
                  class={styles.modalCloseButton}
                >
                  ×
                </Button>
              </div>
              <div class={styles.modalContent}>
                <div class={styles.widgetGrid}>
                  <Index each={widgetTypes}>
                    {(widget) => (
                      <Button
                        variant="secondary"
                        onClick={() => addWidget(widget().type)}
                        class={styles.widgetTypeButton}
                      >
                        <div class={styles.widgetTypeIcon}>
                          {widget().icon}
                        </div>
                        <span class={styles.widgetTypeName}>{widget().name}</span>
                      </Button>
                    )}
                  </Index>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      </Show>
    </>
  )
}