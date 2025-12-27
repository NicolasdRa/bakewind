import { Index } from 'solid-js'
import { Portal } from 'solid-js/web'
import Button from '../common/Button'
import { WIDGET_TYPES } from '~/constants/widgets'
import styles from './AddWidgetModal.module.css'

interface AddWidgetModalProps {
  onClose: () => void
  onAddWidget: (type: string) => void
}

export default function AddWidgetModal(props: AddWidgetModalProps) {
  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose()
    }
  }

  return (
    <Portal>
      <div class={styles.overlay} onClick={handleOverlayClick}>
        <div class={styles.container}>
          <div class={styles.header}>
            <h2 class={styles.title}>Add Widget</h2>
            <Button
              variant="ghost"
              onClick={props.onClose}
              class={styles.closeButton}
            >
              ×
            </Button>
          </div>
          <div class={styles.content}>
            <div class={styles.widgetGrid}>
              <Index each={WIDGET_TYPES}>
                {(widget) => (
                  <Button
                    variant="secondary"
                    onClick={() => props.onAddWidget(widget().type)}
                    class={styles.widgetButton}
                  >
                    <div class={styles.widgetIcon}>
                      {widget().icon}
                    </div>
                    <span class={styles.widgetName}>{widget().name}</span>
                  </Button>
                )}
              </Index>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
