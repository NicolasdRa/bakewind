import styles from './LoadingSpinner.module.css'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  message?: string
  fullHeight?: boolean
}

export default function LoadingSpinner(props: LoadingSpinnerProps) {
  const size = props.size || 'medium'
  const message = props.message || 'Loading...'

  const sizeClasses = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large
  }

  return (
    <div class={`${styles.container} ${props.fullHeight ? styles.fullHeight : ''}`}>
      <div class={styles.spinnerWrapper}>
        <div class={`${styles.spinner} ${sizeClasses[size]}`}></div>
        <span class={styles.message}>{message}</span>
      </div>
    </div>
  )
}