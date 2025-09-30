import { Show } from 'solid-js'
import styles from './Logo.module.css'

interface LogoProps {
  variant?: 'full' | 'compact'
  size?: 'small' | 'medium' | 'large'
  showSubtitle?: boolean
  className?: string
  theme?: 'light' | 'dark'
}

export default function Logo(props: LogoProps) {
  const variant = () => props.variant || 'full'
  const size = () => props.size || 'medium'
  const showSubtitle = () => props.showSubtitle ?? true

  return (
    <div
      class={`${styles.logo} ${styles[size()]} ${props.className || ''}`}
      classList={{
        [styles.compact]: variant() === 'compact',
        [styles.darkTheme]: props.theme === 'dark'
      }}
    >
      <div class={styles.logoText}>
        <h1 class={styles.logoTitle}>BakeWind</h1>
        <Show when={variant() === 'full' && showSubtitle()}>
          <p class={styles.logoSubtitle}>Bakery Manager</p>
        </Show>
      </div>
    </div>
  )
}

// Alternative minimal version for compact spaces
export function LogoMinimal(props: { className?: string }) {
  return (
    <div class={`${styles.logoMinimal} ${props.className || ''}`}>
      <span class={styles.logoMinimalText}>BW</span>
    </div>
  )
}