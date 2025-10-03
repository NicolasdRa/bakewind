import { createSignal, For, Show, onMount } from 'solid-js'
import { useBakeryStore } from '~/stores/bakeryStore'
import ActionButton from '~/components/ActionButton/ActionButton'
import styles from './Orders.module.css'
import type { Order, OrderStatus } from '~/types/bakery'

export default function Orders() {
  const { state, actions } = useBakeryStore()
  const [selectedStatus, setSelectedStatus] = createSignal<OrderStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = createSignal('')
  const [selectedOrder, setSelectedOrder] = createSignal<Order | null>(null)

  onMount(() => {
    // Load mock data if orders are empty
    if (state.orders.list.length === 0) {
      actions.loadMockData()
    }
  })

  const statusFilters: { value: OrderStatus | 'all'; label: string; color: string }[] = [
    { value: 'all', label: 'All Orders', color: 'var(--text-primary)' },
    { value: 'pending', label: 'Pending', color: '#f59e0b' },
    { value: 'confirmed', label: 'Confirmed', color: '#3b82f6' },
    { value: 'in_production', label: 'In Production', color: '#f59e0b' },
    { value: 'ready', label: 'Ready', color: '#10b981' },
    { value: 'delivered', label: 'Delivered', color: '#6366f1' },
    { value: 'cancelled', label: 'Cancelled', color: '#ef4444' }
  ]

  const filteredOrders = () => {
    let orders = state.orders.list

    if (selectedStatus() !== 'all') {
      orders = orders.filter(order => order.status === selectedStatus())
    }

    if (searchTerm()) {
      const search = searchTerm().toLowerCase()
      orders = orders.filter(order =>
        order.customerName.toLowerCase().includes(search) ||
        order.orderNumber.toLowerCase().includes(search) ||
        order.customerPhone?.includes(search) ||
        order.customerEmail?.toLowerCase().includes(search)
      )
    }

    return orders
  }

  const getStatusColor = (status: OrderStatus) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      in_production: '#f59e0b',
      ready: '#10b981',
      delivered: '#6366f1',
      cancelled: '#ef4444'
    }
    return colors[status] || 'var(--text-secondary)'
  }

  const formatDateTime = (date: Date | undefined) => {
    if (!date) return 'N/A'
    const d = new Date(date)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    actions.updateOrder(orderId, { status: newStatus, updatedAt: new Date() })
  }

  return (
    <div class={styles.container}>
      <div class={styles.header}>
        <div class={styles.headerContent}>
          <h1 class={styles.title}>Orders Management</h1>
          <p class={styles.subtitle}>Track and manage all customer orders</p>
        </div>

        <div class={styles.headerActions}>
          <ActionButton icon="+">
            New Order
          </ActionButton>
        </div>
      </div>

      <div class={styles.filters}>
        <div class={styles.searchBar}>
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm()}
            onInput={(e) => setSearchTerm(e.currentTarget.value)}
            class={styles.searchInput}
          />
        </div>

        <div class={styles.statusFilters}>
          <For each={statusFilters}>
            {(filter) => (
              <button
                class={`${styles.filterBtn} ${selectedStatus() === filter.value ? styles.filterBtnActive : ''}`}
                onClick={() => setSelectedStatus(filter.value)}
                style={{ '--filter-color': filter.color }}
              >
                {filter.label}
                <Show when={filter.value !== 'all'}>
                  <span class={styles.filterCount}>
                    {state.orders.list.filter(o => filter.value === 'all' || o.status === filter.value).length}
                  </span>
                </Show>
              </button>
            )}
          </For>
        </div>
      </div>

      <div class={styles.ordersGrid}>
        <Show
          when={!state.orders.loading && filteredOrders().length > 0}
          fallback={
            <div class={styles.emptyState}>
              {state.orders.loading ? 'Loading orders...' : 'No orders found'}
            </div>
          }
        >
          <For each={filteredOrders()}>
            {(order) => (
              <div
                class={styles.orderCard}
                onClick={() => setSelectedOrder(order)}
              >
                <div class={styles.orderHeader}>
                  <div class={styles.orderNumber}>#{order.orderNumber}</div>
                  <div
                    class={styles.orderStatus}
                    style={{ 'background-color': `${getStatusColor(order.status)}20`, color: getStatusColor(order.status) }}
                  >
                    {order.status.replace('_', ' ')}
                  </div>
                </div>

                <div class={styles.customerInfo}>
                  <h3 class={styles.customerName}>{order.customerName}</h3>
                  <div class={styles.customerContact}>
                    {order.customerPhone && <span>📞 {order.customerPhone}</span>}
                    {order.customerEmail && <span>✉️ {order.customerEmail}</span>}
                  </div>
                </div>

                <div class={styles.orderItems}>
                  <For each={order.items.slice(0, 3)}>
                    {(item) => (
                      <div class={styles.orderItem}>
                        <span class={styles.itemQty}>{item.quantity}x</span>
                        <span class={styles.itemName}>{item.productName}</span>
                        <span class={styles.itemPrice}>${(item.quantity * item.unitPrice).toFixed(2)}</span>
                      </div>
                    )}
                  </For>
                  <Show when={order.items.length > 3}>
                    <div class={styles.moreItems}>+{order.items.length - 3} more items</div>
                  </Show>
                </div>

                <div class={styles.orderFooter}>
                  <div class={styles.orderTime}>
                    {order.pickupTime ? '🕐 Pickup' : '🚚 Delivery'}: {formatDateTime(order.pickupTime || order.deliveryTime)}
                  </div>
                  <div class={styles.orderTotal}>${order.total.toFixed(2)}</div>
                </div>

                <div class={styles.orderActions}>
                  <Show when={order.status === 'pending'}>
                    <button
                      class={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        updateOrderStatus(order.id, 'confirmed')
                      }}
                    >
                      Confirm
                    </button>
                  </Show>
                  <Show when={order.status === 'confirmed'}>
                    <button
                      class={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        updateOrderStatus(order.id, 'in_production')
                      }}
                    >
                      Start Production
                    </button>
                  </Show>
                  <Show when={order.status === 'in_production'}>
                    <button
                      class={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        updateOrderStatus(order.id, 'ready')
                      }}
                    >
                      Mark Ready
                    </button>
                  </Show>
                  <Show when={order.status === 'ready'}>
                    <button
                      class={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        updateOrderStatus(order.id, 'delivered')
                      }}
                    >
                      Complete
                    </button>
                  </Show>
                </div>
              </div>
            )}
          </For>
        </Show>
      </div>

      {/* Order Detail Modal */}
      <Show when={selectedOrder()}>
        <div class={styles.modal} onClick={() => setSelectedOrder(null)}>
          <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div class={styles.modalHeader}>
              <h2>Order #{selectedOrder()!.orderNumber}</h2>
              <button class={styles.modalClose} onClick={() => setSelectedOrder(null)}>×</button>
            </div>

            <div class={styles.modalBody}>
              <div class={styles.detailSection}>
                <h3>Customer Information</h3>
                <p>Name: {selectedOrder()!.customerName}</p>
                {selectedOrder()!.customerPhone && <p>Phone: {selectedOrder()!.customerPhone}</p>}
                {selectedOrder()!.customerEmail && <p>Email: {selectedOrder()!.customerEmail}</p>}
              </div>

              <div class={styles.detailSection}>
                <h3>Order Items</h3>
                <For each={selectedOrder()!.items}>
                  {(item) => (
                    <div class={styles.detailItem}>
                      <span>{item.quantity}x {item.productName}</span>
                      <span>${(item.quantity * item.unitPrice).toFixed(2)}</span>
                    </div>
                  )}
                </For>
              </div>

              <div class={styles.detailSection}>
                <h3>Order Summary</h3>
                <div class={styles.detailItem}>
                  <span>Subtotal:</span>
                  <span>${selectedOrder()!.subtotal.toFixed(2)}</span>
                </div>
                <div class={styles.detailItem}>
                  <span>Tax:</span>
                  <span>${selectedOrder()!.tax.toFixed(2)}</span>
                </div>
                <div class={styles.detailItem}>
                  <strong>Total:</strong>
                  <strong>${selectedOrder()!.total.toFixed(2)}</strong>
                </div>
              </div>

              {selectedOrder()!.specialRequests && (
                <div class={styles.detailSection}>
                  <h3>Special Requests</h3>
                  <p>{selectedOrder()!.specialRequests}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}
