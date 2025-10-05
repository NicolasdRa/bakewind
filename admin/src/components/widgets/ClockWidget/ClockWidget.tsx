import { createSignal, onMount, onCleanup } from 'solid-js'
import BaseWidget from '../../BaseWidget/BaseWidget'
import styles from './ClockWidget.module.css'

interface ClockWidgetProps {
  widgetId: string
  title: string
  size: 'small' | 'medium' | 'large'
  onClose: () => void
}

export default function ClockWidget(props: ClockWidgetProps) {
  const [time, setTime] = createSignal(new Date())
  let interval: number

  onMount(() => {
    interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
  })

  onCleanup(() => {
    if (interval) {
      clearInterval(interval)
    }
  })

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <BaseWidget {...props}>
      <div class={styles.container}>
        <div class={styles.time}>
          {formatTime(time())}
        </div>
        <div class={styles.date}>
          {formatDate(time())}
        </div>
        <div class={styles.timezone}>
          Local Time
        </div>
      </div>
    </BaseWidget>
  )
}