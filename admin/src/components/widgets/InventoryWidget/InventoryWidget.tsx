import { For, Show, createResource } from 'solid-js'
import BaseWidget from '../../BaseWidget/BaseWidget'
import styles from './InventoryWidget.module.css'
import { inventoryApi } from '~/api/inventory'

interface InventoryWidgetProps {
  widgetId: string
  title: string
  size: 'small' | 'medium' | 'large'
  onClose: () => void
}

export default function InventoryWidget(props: InventoryWidgetProps) {
  // Fetch low stock items from API
  const [inventory] = createResource(() => inventoryApi.getInventory(true))

  const lowStockItems = () => {
    const items = inventory() || []
    const limit = props.size === 'large' ? 10 : props.size === 'medium' ? 6 : 4
    return items.slice(0, limit)
  }

  const getStockLevel = (daysRemaining: number) => {
    if (daysRemaining <= 2) return { class: styles.levelCritical, label: 'Critical' }
    if (daysRemaining <= 7) return { class: styles.levelLow, label: 'Low' }
    return { class: styles.levelGood, label: 'Good' }
  }

  const formatUnit = (quantity: number, unit: string) => {
    return `${quantity.toFixed(2)} ${unit}`
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
          when={!inventory.loading && lowStockItems().length > 0}
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
                const daysRemaining = item.consumption_tracking?.days_of_supply_remaining || 999
                const level = getStockLevel(daysRemaining)
                return (
                  <div class={styles.itemCard}>
                    <div class={styles.itemHeader}>
                      <div class={styles.itemInfo}>
                        <span class={styles.itemName}>{item.name}</span>
                        <span class={styles.itemCategory}>{item.category}</span>
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
                            width: `${Math.min((daysRemaining / 14) * 100, 100)}%`,
                            background: daysRemaining <= 2 ? '#ef4444' : daysRemaining <= 7 ? '#f59e0b' : '#10b981'
                          }}
                        />
                      </div>
                      <div class={styles.stockDetails}>
                        <span class={styles.currentStock}>
                          {formatUnit(item.current_stock, item.unit)}
                        </span>
                        <Show when={item.consumption_tracking} fallback={
                          <span class={styles.reorderPoint}>Low stock alert</span>
                        }>
                          <span class={styles.reorderPoint}>
                            {daysRemaining.toFixed(1)} days remaining
                          </span>
                        </Show>
                      </div>
                    </div>

                    <Show when={item.consumption_tracking}>
                      <div class={styles.expiration}>
                        📊 {item.consumption_tracking!.avg_daily_consumption.toFixed(2)} {item.unit}/day
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