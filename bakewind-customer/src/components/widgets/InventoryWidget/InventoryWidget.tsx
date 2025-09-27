import { For, Show } from 'solid-js'
import BaseWidget from '../../BaseWidget/BaseWidget'
import styles from './InventoryWidget.module.css'
import { useBakeryStore } from '~/stores/bakeryStore'

interface InventoryWidgetProps {
  widgetId: string
  title: string
  size: 'small' | 'medium' | 'large'
  onClose: () => void
}

export default function InventoryWidget(props: InventoryWidgetProps) {
  const { state } = useBakeryStore()
  
  const lowStockItems = () => 
    state.inventory.items
      .filter(item => item.currentStock <= item.reorderPoint)
      .slice(0, props.size === 'large' ? 10 : props.size === 'medium' ? 6 : 4)

  const getStockLevel = (current: number, minimum: number) => {
    const percentage = (current / minimum) * 100
    if (percentage <= 50) return { class: styles.levelCritical, label: 'Critical' }
    if (percentage <= 100) return { class: styles.levelLow, label: 'Low' }
    return { class: styles.levelGood, label: 'Good' }
  }

  const formatUnit = (quantity: number, unit: string) => {
    return `${quantity}${unit}`
  }

  return (
    <BaseWidget {...props}>
      <div class={styles.container}>
        <div class={styles.header}>
          <h3 class={styles.title}>Inventory Status</h3>
          <div class={styles.summary}>
            <span class={styles.alertCount}>{lowStockItems().length} items low</span>
          </div>
        </div>

        <Show
          when={!state.inventory.loading && lowStockItems().length > 0}
          fallback={
            <div class={styles.allGood}>
              <span class={styles.checkIcon}>✓</span>
              <p>All inventory levels are good</p>
            </div>
          }
        >
          <div class={styles.itemsList}>
            <For each={lowStockItems()}>
              {(item) => {
                const level = getStockLevel(item.currentStock, item.minimumStock)
                return (
                  <div class={styles.itemCard}>
                    <div class={styles.itemHeader}>
                      <div class={styles.itemInfo}>
                        <span class={styles.itemName}>{item.name}</span>
                        <span class={styles.itemCategory}>{item.supplier || item.category}</span>
                      </div>
                      <span class={`${styles.levelBadge} ${level.class}`}>
                        {level.label}
                      </span>
                    </div>
                    
                    <div class={styles.stockInfo}>
                      <div class={styles.stockBar}>
                        <div 
                          class={styles.stockFill}
                          style={{ 
                            width: `${Math.min((item.currentStock / item.reorderPoint) * 100, 100)}%`,
                            background: item.currentStock <= item.minimumStock ? '#ef4444' : '#f59e0b'
                          }}
                        />
                      </div>
                      <div class={styles.stockDetails}>
                        <span class={styles.currentStock}>
                          {formatUnit(item.currentStock, item.unit)}
                        </span>
                        <span class={styles.reorderPoint}>
                          Reorder at: {formatUnit(item.reorderPoint, item.unit)}
                        </span>
                      </div>
                    </div>

                    <Show when={item.expirationDate}>
                      <div class={styles.expiration}>
                        ⏰ Expires: {new Date(item.expirationDate!).toLocaleDateString()}
                      </div>
                    </Show>
                  </div>
                )
              }}
            </For>
          </div>
        </Show>

        <div class={styles.actions}>
          <a href="/inventory" class={styles.viewAllLink}>Manage Inventory →</a>
        </div>
      </div>
    </BaseWidget>
  )
}