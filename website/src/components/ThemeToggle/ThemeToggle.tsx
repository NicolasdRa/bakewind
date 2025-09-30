import { Show } from 'solid-js'
import styles from './ThemeToggle.module.css'

interface ThemeToggleProps {
  theme: 'light' | 'dark'
  onToggle: () => void
  className?: string
}

export default function ThemeToggle(props: ThemeToggleProps) {
  return (
    <button
      onClick={props.onToggle}
      class={`${styles.themeToggle} ${props.className || ''}`}
      title={props.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label="Toggle theme"
    >
      <div class={styles.iconContainer}>
        <Show
          when={props.theme === 'light'}
          fallback={
            // Sun icon for dark mode
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class={styles.icon}
            >
              <circle
                cx="12"
                cy="12"
                r="4"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M12 2V4M12 20V22M22 12H20M4 12H2"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M19.778 4.222L18.364 5.636M5.636 18.364L4.222 19.778M19.778 19.778L18.364 18.364M5.636 5.636L4.222 4.222"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          }
        >
          {/* Moon icon for light mode */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class={styles.icon}
          >
            <path
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </Show>
      </div>
    </button>
  )
}