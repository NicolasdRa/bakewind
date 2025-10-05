import { createSignal, onMount, onCleanup, For } from 'solid-js'
import BaseWidget from '../../BaseWidget/BaseWidget'
import styles from './ProductionWidget.module.css'
import { useBakeryStore } from '~/stores/bakeryStore'

interface ProductionWidgetProps {
  widgetId: string
  title: string
  size: 'small' | 'medium' | 'large'
  onClose: () => void
}

export default function ProductionWidget(props: ProductionWidgetProps) {
  const { state } = useBakeryStore()
  const [currentTime, setCurrentTime] = createSignal(new Date())
  
  let interval: number
  
  onMount(() => {
    interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute
  })
  
  onCleanup(() => {
    clearInterval(interval)
  })

  const todaySchedule = () => {
    const today = new Date().toDateString()
    return state.production.schedules.find(
      s => new Date(s.date).toDateString() === today
    ) || {
      totalItems: 0,
      completedItems: 0,
      items: []
    }
  }

  const upcomingItems = () => {
    const schedule = todaySchedule()
    return schedule.items
      ?.filter(item => item.status !== 'completed')
      .slice(0, props.size === 'large' ? 6 : props.size === 'medium' ? 4 : 2) || []
  }

  const progressPercentage = () => {
    const schedule = todaySchedule()
    if (schedule.totalItems === 0) return 0
    return Math.round((schedule.completedItems / schedule.totalItems) * 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return styles.statusScheduled
      case 'in_progress': return styles.statusInProgress
      case 'completed': return styles.statusCompleted
      default: return styles.statusDefault
    }
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    })
  }

  return (
    <BaseWidget {...props}>
      <div class={styles.container}>
        <div class={styles.header}>
          <h3 class={styles.title}>Today's Production</h3>
          <span class={styles.time}>{currentTime().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
        </div>

        <div class={styles.progressSection}>
          <div class={styles.progressHeader}>
            <span class={styles.progressLabel}>Daily Progress</span>
            <span class={styles.progressValue}>{progressPercentage()}%</span>
          </div>
          <div class={styles.progressBar}>
            <div 
              class={styles.progressFill}
              style={{ width: `${progressPercentage()}%` }}
            />
          </div>
          <div class={styles.progressStats}>
            <span>{todaySchedule().completedItems} completed</span>
            <span>{todaySchedule().totalItems - todaySchedule().completedItems} remaining</span>
          </div>
        </div>

        <div class={styles.upcomingSection}>
          <h4 class={styles.sectionTitle}>Upcoming Items</h4>
          {upcomingItems().length > 0 ? (
            <div class={styles.itemsList}>
              <For each={upcomingItems()}>
                {(item) => (
                  <div class={styles.productionItem}>
                    <div class={styles.itemHeader}>
                      <span class={styles.itemName}>{item.recipeName}</span>
                      <span class={`${styles.status} ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div class={styles.itemDetails}>
                      <span class={styles.quantity}>Qty: {item.quantity}</span>
                      <span class={styles.scheduledTime}>
                        🕐 {formatTime(item.scheduledTime)}
                      </span>
                    </div>
                    {item.assignedTo && (
                      <div class={styles.assignee}>
                        Assigned to: {item.assignedTo}
                      </div>
                    )}
                  </div>
                )}
              </For>
            </div>
          ) : (
            <div class={styles.noItems}>
              No items scheduled for production
            </div>
          )}
        </div>

        <div class={styles.actions}>
          <a href="/production" class={styles.viewAllLink}>Production Schedule →</a>
        </div>
      </div>
    </BaseWidget>
  )
}