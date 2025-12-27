import { onMount, For, Show, ErrorBoundary } from 'solid-js'
import { useAppStore } from '~/stores/appStore'
import { useWidgetStore } from '~/stores/widgetStore'
import BaseWidget from '../BaseWidget/BaseWidget'
import Button from '../common/Button'
import AddWidgetModal from '../AddWidgetModal/AddWidgetModal'
import styles from './DashboardContent.module.css'
import { WidgetConfig } from '~/types/widget'
import { WIDGET_COMPONENTS } from '~/constants/widgets'

interface DashboardContentProps {
  layout: string
}

export default function DashboardContent(props: DashboardContentProps) {
  const { state, actions } = useAppStore()
  const { widgets, actions: widgetActions } = useWidgetStore()

  onMount(() => {
    widgetActions.initialize()
  })

  const handleAddWidget = (type: string) => {
    widgetActions.addWidget(type)
    actions.setShowWidgetModal(false)
  }

  const renderWidget = (config: WidgetConfig) => {
    const commonProps = {
      widgetId: config.id,
      title: config.title,
      size: config.size,
      onClose: () => widgetActions.removeWidget(config.id)
    }

    const WidgetComponent = WIDGET_COMPONENTS[config.type as keyof typeof WIDGET_COMPONENTS]

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
        <For each={Object.values(widgets).filter((w): w is WidgetConfig => Boolean(w))}>
          {(config) => (
            <div class={`${styles.widgetContainer} ${props.layout === 'list' ? styles.widgetContainerList : ''}`}>
              <ErrorBoundary
                fallback={(err, reset) => (
                  <BaseWidget
                    widgetId={config.id}
                    title={config.title}
                    size={config.size}
                    onClose={() => widgetActions.removeWidget(config.id)}
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

      <Show when={state.showWidgetModal}>
        <AddWidgetModal
          onClose={() => actions.setShowWidgetModal(false)}
          onAddWidget={handleAddWidget}
        />
      </Show>
    </>
  )
}
