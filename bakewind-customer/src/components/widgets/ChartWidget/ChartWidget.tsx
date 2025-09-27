import { createSignal, For } from 'solid-js'
import BaseWidget from '../../BaseWidget/BaseWidget'
import styles from './ChartWidget.module.css'

interface ChartWidgetProps {
  widgetId: string
  title: string
  size: 'small' | 'medium' | 'large'
  onClose: () => void
}

export default function ChartWidget(props: ChartWidgetProps) {
  const [data] = createSignal([
    { month: 'Jan', value: 400 },
    { month: 'Feb', value: 300 },
    { month: 'Mar', value: 500 },
    { month: 'Apr', value: 350 },
    { month: 'May', value: 600 },
    { month: 'Jun', value: 450 }
  ])

  const maxValue = () => Math.max(...data().map(d => d.value))

  return (
    <BaseWidget {...props}>
      <div class={styles.container}>
        <div class={styles.header}>
          <h4 class={styles.title}>Monthly Analytics</h4>
          <span class={styles.subtitle}>Last 6 months</span>
        </div>
        
        <div class={styles.chartContainer}>
          <For each={data()}>
            {(item) => (
              <div class={styles.chartItem}>
                <div class={styles.barContainer}>
                  <div
                    class={styles.bar}
                    style={{
                      height: `${(item.value / maxValue()) * 100}px`
                    }}
                  />
                </div>
                <span class={styles.barLabel}>{item.month}</span>
              </div>
            )}
          </For>
        </div>
        
        <div class={styles.footer}>
          <span class={styles.footerLabel}>Average: </span>
          <span class={styles.footerValue}>
            {Math.round(data().reduce((sum, d) => sum + d.value, 0) / data().length)}
          </span>
        </div>
      </div>
    </BaseWidget>
  )
}