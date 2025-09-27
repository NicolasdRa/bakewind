import { For, Show } from 'solid-js'
import BaseWidget from '../../BaseWidget/BaseWidget'
import styles from './OrdersWidget.module.css'
import { useBakeryStore } from '~/stores/bakeryStore'
import type { Order } from '~/types/bakery'

interface OrdersWidgetProps {
  widgetId: string
  title: string
  size: 'small' | 'medium' | 'large'
  onClose: () => void
}

export default function OrdersWidget(props: OrdersWidgetProps) {
  const { state } = useBakeryStore()
  
  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: styles.statusPending,
      confirmed: styles.statusConfirmed,
      in_production: styles.statusInProduction,
      ready: styles.statusReady,
      delivered: styles.statusDelivered,
      cancelled: styles.statusCancelled
    }
    return colors[status] || styles.statusDefault
  }

  const getStatusLabel = (status: Order['status']) => {
    const labels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      in_production: 'In Production',
      ready: 'Ready',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    }
    return labels[status] || status
  }

  const formatTime = (date: Date | undefined) => {
    if (!date) return 'ASAP'
    const d = new Date(date)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const recentOrders = () => state.orders.list.slice(0, props.size === 'large' ? 8 : props.size === 'medium' ? 5 : 3)

  return (
    <BaseWidget {...props}>
      <div class={styles.container}>
        <div class={styles.header}>
          <h3 class={styles.title}>Recent Orders</h3>
          <span class={styles.count}>{state.orders.list.length} total</span>
        </div>
        
        <Show
          when={!state.orders.loading && recentOrders().length > 0}
          fallback={
            <div class={styles.empty}>
              {state.orders.loading ? 'Loading orders...' : 'No orders yet today'}
            </div>
          }
        >
          <div class={styles.ordersList}>
            <For each={recentOrders()}>
              {(order) => (
                <div class={styles.orderCard}>
                  <div class={styles.orderHeader}>
                    <div class={styles.orderInfo}>
                      <span class={styles.orderNumber}>#{order.orderNumber}</span>
                      <span class={styles.customerName}>{order.customerName}</span>
                    </div>
                    <span class={`${styles.status} ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  
                  <div class={styles.orderDetails}>
                    <div class={styles.items}>
                      <For each={order.items.slice(0, 2)}>
                        {(item) => (
                          <div class={styles.item}>
                            <span class={styles.itemQty}>{item.quantity}x</span>
                            <span class={styles.itemName}>{item.productName}</span>
                          </div>
                        )}
                      </For>
                      <Show when={order.items.length > 2}>
                        <div class={styles.moreItems}>+{order.items.length - 2} more items</div>
                      </Show>
                    </div>
                    
                    <div class={styles.orderFooter}>
                      <span class={styles.time}>
                        {order.pickupTime ? '🕐' : '🚚'} {formatTime(order.pickupTime || order.deliveryTime)}
                      </span>
                      <span class={styles.total}>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
        
        <div class={styles.actions}>
          <a href="/orders" class={styles.viewAllLink}>View All Orders →</a>
        </div>
      </div>
    </BaseWidget>
  )
}