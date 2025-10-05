import BaseWidget from '../../BaseWidget/BaseWidget'
import styles from './StatsWidget.module.css'

interface StatsWidgetProps {
  widgetId: string
  title: string
  size: 'small' | 'medium' | 'large'
  onClose: () => void
}

export default function StatsWidget(props: StatsWidgetProps) {
  const stats = [
    { label: 'Total Users', value: '24,532', change: '+12%', changeType: 'positive' },
    { label: 'Revenue', value: '$127,430', change: '+8.2%', changeType: 'positive' },
    { label: 'Conversion Rate', value: '3.24%', change: '-2.1%', changeType: 'negative' },
    { label: 'Avg. Session', value: '4m 32s', change: '+5.3%', changeType: 'positive' }
  ]

  return (
    <BaseWidget {...props}>
      <div class={styles.container}>
        {stats.map((stat) => (
          <div class={styles.statItem}>
            <div class={styles.statContent}>
              <p class={styles.statLabel}>{stat.label}</p>
              <p class={styles.statValue}>{stat.value}</p>
            </div>
            <div class={stat.changeType === 'positive' ? styles.changePositive : styles.changeNegative}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>
    </BaseWidget>
  )
}