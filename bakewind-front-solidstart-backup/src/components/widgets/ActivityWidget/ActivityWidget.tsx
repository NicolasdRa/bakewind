import BaseWidget from '../../BaseWidget/BaseWidget'
import styles from './ActivityWidget.module.css'

interface ActivityWidgetProps {
  widgetId: string
  title: string
  size: 'small' | 'medium' | 'large'
  onClose: () => void
}

export default function ActivityWidget(props: ActivityWidgetProps) {
  const activities = [
    { action: 'User registered', user: 'John Doe', time: '2 minutes ago', icon: '👤' },
    { action: 'New order placed', user: 'Jane Smith', time: '5 minutes ago', icon: '🛒' },
    { action: 'Payment received', user: 'Bob Johnson', time: '10 minutes ago', icon: '💳' },
    { action: 'Widget added', user: 'Alice Brown', time: '15 minutes ago', icon: '📊' },
    { action: 'Profile updated', user: 'Mike Wilson', time: '22 minutes ago', icon: '✏️' }
  ]

  return (
    <BaseWidget {...props}>
      <div class={styles.container}>
        {activities.map((activity) => (
          <div class={styles.activityItem}>
            <div class={styles.activityIcon}>
              {activity.icon}
            </div>
            <div class={styles.activityContent}>
              <div class={styles.activityAction}>
                {activity.action}
              </div>
              <div class={styles.activityUser}>
                by {activity.user}
              </div>
              <div class={styles.activityTime}>
                {activity.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </BaseWidget>
  )
}