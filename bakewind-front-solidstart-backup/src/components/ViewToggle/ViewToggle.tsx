import { For } from 'solid-js'
import styles from './ViewToggle.module.css'

export interface ViewToggleOption {
  value: string
  label: string
  icon?: string
  title?: string
  mobileIcon?: string  // Icon to show on mobile/tablet
  desktopLabel?: string // Label to show on desktop
}

interface ViewToggleProps {
  options: ViewToggleOption[]
  currentValue: string
  onChange: (value: string) => void
  class?: string
}

export default function ViewToggle(props: ViewToggleProps) {
  return (
    <div class={`${styles.viewToggle} ${props.class || ''}`}>
      <For each={props.options}>
        {(option) => (
          <button
            onClick={() => props.onChange(option.value)}
            class={`${styles.toggleButton} ${
              props.currentValue === option.value
                ? styles.toggleButtonActive
                : styles.toggleButtonInactive
            }`}
            title={option.title || option.label}
          >
            {/* Mobile/Tablet Icon */}
            {(option.icon || option.mobileIcon) && (
              <span class={styles.toggleButtonIcon}>
                {option.mobileIcon || option.icon}
              </span>
            )}
            
            {/* Desktop Label */}
            {(option.desktopLabel || option.label) && (
              <span class={styles.toggleButtonLabel}>
                {option.desktopLabel || option.label}
              </span>
            )}
          </button>
        )}
      </For>
    </div>
  )
}