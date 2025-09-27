import { createSignal, Show } from 'solid-js'
import type { JSX } from 'solid-js'
import styles from './BaseWidget.module.css'

interface BaseWidgetProps {
  widgetId: string
  title: string
  size: 'small' | 'medium' | 'large'
  onClose: () => void
  children: JSX.Element
}

export default function BaseWidget(props: BaseWidgetProps) {
  const [minimized, setMinimized] = createSignal(false)

  const getSizeClasses = () => {
    if (minimized()) return styles.sizeMinimized
    
    switch (props.size) {
      case 'small':
        return styles.sizeSmall
      case 'large':
        return styles.sizeLarge
      default:
        return styles.sizeMedium
    }
  }

  const toggleMinimize = () => {
    setMinimized(!minimized())
  }


  return (
    <div class={`${styles.widget} ${getSizeClasses()}`}>
      {/* Widget Header */}
      <div class={styles.header}>
        <h3 class={styles.title}>{props.title}</h3>
        
        <div class={styles.controls}>
          <button
            onClick={toggleMinimize}
            class={styles.controlButton}
            title={minimized() ? 'Maximize' : 'Minimize'}
          >
            <span class={styles.buttonIcon}>{minimized() ? '⬜' : '➖'}</span>
          </button>
          <button
            onClick={props.onClose}
            class={styles.closeButton}
            title="Close"
          >
            <span class={styles.buttonIcon}>✕</span>
          </button>
        </div>
      </div>

      {/* Widget Content */}
      <Show when={!minimized()}>
        <div class={styles.content}>
          {props.children}
        </div>
      </Show>
    </div>
  )
}