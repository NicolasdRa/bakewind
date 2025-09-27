import { createSignal, For, Show, onMount } from 'solid-js'
import { useBakeryStore } from '~/stores/bakeryStore'
import { bakeryActions } from '~/stores/bakeryStore'
import SEO from '~/components/SEO/SEO'
import ViewToggle from '~/components/ViewToggle/ViewToggle'
import ActionButton from '~/components/ActionButton/ActionButton'
import styles from './internal-orders.module.css'
import type { InternalOrder, InternalOrderStatus, InternalOrderSource, InternalOrderPriority } from '~/types/bakery'

export default function InternalOrders() {
  const { state, actions } = useBakeryStore()
  const [selectedStatus, setSelectedStatus] = createSignal<InternalOrderStatus | 'all'>('all')
  const [selectedSource, setSelectedSource] = createSignal<InternalOrderSource | 'all'>('all')
  const [selectedPriority, setSelectedPriority] = createSignal<InternalOrderPriority | 'all'>('all')
  const [searchTerm, setSearchTerm] = createSignal('')
  const [selectedOrder, setSelectedOrder] = createSignal<InternalOrder | null>(null)
  const [showAddModal, setShowAddModal] = createSignal(false)
  const [viewMode, setViewMode] = createSignal<'kanban' | 'list'>('kanban')

  const viewModeOptions = [
    { 
      value: 'kanban', 
      label: 'Kanban', 
      mobileIcon: '📋', 
      desktopLabel: 'Kanban',
      title: 'Kanban View' 
    },
    { 
      value: 'list', 
      label: 'List', 
      mobileIcon: '📄', 
      desktopLabel: 'List',
      title: 'List View' 
    }
  ]

  onMount(() => {
    bakeryActions.loadMockData()
  })

  const statusFilters: { value: InternalOrderStatus | 'all'; label: string; color: string }[] = [
    { value: 'all', label: 'All Status', color: 'var(--text-primary)' },
    { value: 'requested', label: 'Requested', color: '#f59e0b' },
    { value: 'approved', label: 'Approved', color: '#3b82f6' },
    { value: 'in_preparation', label: 'In Preparation', color: '#f59e0b' },
    { value: 'ready', label: 'Ready', color: '#10b981' },
    { value: 'delivered', label: 'Delivered', color: '#6366f1' },
    { value: 'rejected', label: 'Rejected', color: '#ef4444' }
  ]

  const sourceFilters: { value: InternalOrderSource | 'all'; label: string; icon: string }[] = [
    { value: 'all', label: 'All Departments', icon: '🏢' },
    { value: 'cafe', label: 'Café', icon: '☕' },
    { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
    { value: 'front_house', label: 'Front House', icon: '🏨' },
    { value: 'catering', label: 'Catering', icon: '🥘' },
    { value: 'retail', label: 'Retail', icon: '🛍️' },
    { value: 'events', label: 'Events', icon: '🎉' }
  ]

  const priorityFilters: { value: InternalOrderPriority | 'all'; label: string; color: string }[] = [
    { value: 'all', label: 'All Priorities', color: 'var(--text-primary)' },
    { value: 'low', label: 'Low', color: '#6b7280' },
    { value: 'normal', label: 'Normal', color: '#3b82f6' },
    { value: 'high', label: 'High', color: '#f59e0b' },
    { value: 'urgent', label: 'Urgent', color: '#ef4444' }
  ]

  const filteredOrders = () => {
    let orders = state.internalOrders.list

    // Filter by status
    if (selectedStatus() !== 'all') {
      orders = orders.filter(order => order.status === selectedStatus())
    }

    // Filter by source
    if (selectedSource() !== 'all') {
      orders = orders.filter(order => order.source === selectedSource())
    }

    // Filter by priority
    if (selectedPriority() !== 'all') {
      orders = orders.filter(order => order.priority === selectedPriority())
    }

    // Filter by search term
    if (searchTerm()) {
      const search = searchTerm().toLowerCase()
      orders = orders.filter(order =>
        order.orderNumber.toLowerCase().includes(search) ||
        order.requestedBy.toLowerCase().includes(search) ||
        order.department.toLowerCase().includes(search) ||
        order.items.some(item => item.productName.toLowerCase().includes(search))
      )
    }

    // Sort by priority (urgent first) then by needed date
    return orders.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      return new Date(a.neededByDate).getTime() - new Date(b.neededByDate).getTime()
    })
  }

  const getOrdersByStatus = (status: InternalOrderStatus) => {
    return filteredOrders().filter(order => order.status === status)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getPriorityColor = (priority: InternalOrderPriority) => {
    const colors = {
      low: '#6b7280',
      normal: '#3b82f6', 
      high: '#f59e0b',
      urgent: '#ef4444'
    }
    return colors[priority]
  }

  const getSourceIcon = (source: InternalOrderSource) => {
    const icons = {
      cafe: '☕',
      restaurant: '🍽️',
      front_house: '🏨',
      catering: '🥘',
      retail: '🛍️',
      events: '🎉'
    }
    return icons[source]
  }

  const isOverdue = (order: InternalOrder) => {
    return new Date(order.neededByDate) < new Date() && !['ready', 'delivered'].includes(order.status)
  }

  const handleStatusChange = (orderId: string, newStatus: InternalOrderStatus) => {
    bakeryActions.updateInternalOrderStatus(orderId, newStatus)
  }

  const orderStats = () => {
    const orders = state.internalOrders.list
    const totalOrders = orders.length
    const pendingOrders = orders.filter(o => ['requested', 'approved', 'in_preparation'].includes(o.status)).length
    const overdueOrders = orders.filter(o => isOverdue(o)).length
    const totalValue = orders.reduce((sum, o) => sum + (o.totalCost || 0), 0)
    
    return { totalOrders, pendingOrders, overdueOrders, totalValue }
  }

  return (
    <>
      <SEO
        title="Internal Orders - BakeWind"
        description="Manage internal orders from different departments and track fulfillment"
        path="/internal-orders"
      />

      <div class={styles.container}>
        <div class={styles.header}>
          <div class={styles.headerContent}>
            <h1 class={styles.title}>Internal Orders</h1>
            <p class={styles.subtitle}>Manage orders from different departments and divisions</p>
          </div>
          
          <div class={styles.headerActions}>
            <ViewToggle 
              options={viewModeOptions}
              currentValue={viewMode()}
              onChange={(mode) => setViewMode(mode as 'kanban' | 'list')}
            />
            <ActionButton
              onClick={() => setShowAddModal(true)}
              icon="+"
            >
              New Internal Order
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => console.log('Export clicked')}
              icon="📊"
            >
              Export
            </ActionButton>
          </div>
        </div>

        <div class={styles.statsRow}>
          <div class={styles.statCard}>
            <div class={styles.statValue}>{orderStats().totalOrders}</div>
            <div class={styles.statLabel}>Total Orders</div>
          </div>
          <div class={styles.statCard}>
            <div class={styles.statValue} style={{ color: '#f59e0b' }}>
              {orderStats().pendingOrders}
            </div>
            <div class={styles.statLabel}>Pending</div>
          </div>
          <div class={styles.statCard}>
            <div class={styles.statValue} style={{ color: '#ef4444' }}>
              {orderStats().overdueOrders}
            </div>
            <div class={styles.statLabel}>Overdue</div>
          </div>
          <div class={styles.statCard}>
            <div class={styles.statValue}>
              {formatCurrency(orderStats().totalValue)}
            </div>
            <div class={styles.statLabel}>Total Value</div>
          </div>
        </div>

        <div class={styles.controls}>
          <div class={styles.searchBar}>
            <input
              type="text"
              placeholder="Search orders by number, requester, department, or products..."
              value={searchTerm()}
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
              class={styles.searchInput}
            />
          </div>

          <div class={styles.filters}>
            <select
              value={selectedStatus()}
              onChange={(e) => setSelectedStatus(e.currentTarget.value as any)}
              class={styles.select}
            >
              <For each={statusFilters}>
                {(filter) => (
                  <option value={filter.value}>{filter.label}</option>
                )}
              </For>
            </select>

            <select
              value={selectedSource()}
              onChange={(e) => setSelectedSource(e.currentTarget.value as any)}
              class={styles.select}
            >
              <For each={sourceFilters}>
                {(filter) => (
                  <option value={filter.value}>{filter.icon} {filter.label}</option>
                )}
              </For>
            </select>

            <select
              value={selectedPriority()}
              onChange={(e) => setSelectedPriority(e.currentTarget.value as any)}
              class={styles.select}
            >
              <For each={priorityFilters}>
                {(filter) => (
                  <option value={filter.value}>{filter.label}</option>
                )}
              </For>
            </select>
          </div>
        </div>

        <Show
          when={!state.internalOrders.loading && viewMode() === 'kanban'}
          fallback={
            <div class={styles.emptyState}>
              {state.internalOrders.loading ? 'Loading internal orders...' : ''}
            </div>
          }
        >
          <div class={styles.kanbanBoard}>
            <For each={statusFilters.slice(1)}>
              {(statusFilter) => (
                <div class={styles.statusColumn}>
                <div class={styles.columnHeader}>
                  <h3 class={styles.columnTitle}>{statusFilter.label}</h3>
                  <span class={styles.columnCount}>
                    {getOrdersByStatus(statusFilter.value as InternalOrderStatus).length}
                  </span>
                </div>
                
                <div class={styles.ordersList}>
                  <For each={getOrdersByStatus(statusFilter.value as InternalOrderStatus)}>
                    {(order) => (
                      <div 
                        class={`${styles.orderCard} ${isOverdue(order) ? styles.overdue : ''}`}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <div class={styles.cardHeader}>
                          <div class={styles.orderNumber}>{order.orderNumber}</div>
                          <div 
                            class={styles.priorityBadge}
                            style={{ 'background-color': `${getPriorityColor(order.priority)}20`, color: getPriorityColor(order.priority) }}
                          >
                            {order.priority.toUpperCase()}
                          </div>
                        </div>

                        <div class={styles.cardContent}>
                          <div class={styles.department}>
                            <span class={styles.sourceIcon}>{getSourceIcon(order.source)}</span>
                            <span>{order.department}</span>
                          </div>
                          <div class={styles.requester}>By: {order.requestedBy}</div>
                          <div class={styles.itemCount}>{order.items.length} items</div>
                          {order.totalCost && (
                            <div class={styles.totalCost}>{formatCurrency(order.totalCost)}</div>
                          )}
                        </div>

                        <div class={styles.cardFooter}>
                          <div class={styles.neededBy}>
                            Need by: {formatDate(order.neededByDate)}
                          </div>
                          {isOverdue(order) && (
                            <span class={styles.overdueTag}>OVERDUE</span>
                          )}
                        </div>

                        {order.specialInstructions && (
                          <div class={styles.specialInstructions}>
                            📝 {order.specialInstructions}
                          </div>
                        )}
                      </div>
                    )}
                  </For>
                </div>
                </div>
              )}
            </For>
          </div>
        </Show>

        <Show when={!state.internalOrders.loading && viewMode() === 'list'}>
          <div class={styles.ordersTable}>
            <div class={styles.tableHeader}>
              <div class={styles.tableHeaderCell}>Order</div>
              <div class={styles.tableHeaderCell}>Department</div>
              <div class={styles.tableHeaderCell}>Requester</div>
              <div class={styles.tableHeaderCell}>Status</div>
              <div class={styles.tableHeaderCell}>Priority</div>
              <div class={styles.tableHeaderCell}>Items</div>
              <div class={styles.tableHeaderCell}>Total</div>
              <div class={styles.tableHeaderCell}>Needed By</div>
            </div>
            
            <For each={filteredOrders()}>
              {(order) => (
                <div 
                  class={`${styles.tableRow} ${isOverdue(order) ? styles.overdueRow : ''}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div class={styles.tableCell}>
                    <div class={styles.orderInfo}>
                      <div class={styles.orderNumber}>{order.orderNumber}</div>
                      <div class={styles.orderDate}>{formatDate(order.requestedDate)}</div>
                    </div>
                  </div>
                  <div class={styles.tableCell}>
                    <span class={styles.sourceIcon}>{getSourceIcon(order.source)}</span>
                    {order.department}
                  </div>
                  <div class={styles.tableCell}>{order.requestedBy}</div>
                  <div class={styles.tableCell}>
                    <span 
                      class={styles.statusBadge}
                      style={{ 'background-color': `${statusFilters.find(f => f.value === order.status)?.color}20`, color: statusFilters.find(f => f.value === order.status)?.color }}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div class={styles.tableCell}>
                    <span 
                      class={styles.priorityBadge}
                      style={{ 'background-color': `${getPriorityColor(order.priority)}20`, color: getPriorityColor(order.priority) }}
                    >
                      {order.priority}
                    </span>
                  </div>
                  <div class={styles.tableCell}>{order.items.length}</div>
                  <div class={styles.tableCell}>
                    {order.totalCost ? formatCurrency(order.totalCost) : '-'}
                  </div>
                  <div class={styles.tableCell}>
                    <div class={styles.neededByInfo}>
                      <div>{formatDate(order.neededByDate)}</div>
                      {isOverdue(order) && (
                        <span class={styles.overdueTag}>OVERDUE</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* Order Detail Modal */}
        <Show when={selectedOrder()}>
          <div class={styles.modal} onClick={() => setSelectedOrder(null)}>
            <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div class={styles.modalHeader}>
                <div class={styles.modalTitle}>
                  <h2>{selectedOrder()!.orderNumber}</h2>
                  <div class={styles.modalBadges}>
                    <span 
                      class={styles.statusBadge}
                      style={{ 
                        'background-color': `${statusFilters.find(f => f.value === selectedOrder()!.status)?.color}20`, 
                        color: statusFilters.find(f => f.value === selectedOrder()!.status)?.color 
                      }}
                    >
                      {selectedOrder()!.status.replace('_', ' ')}
                    </span>
                    <span 
                      class={styles.priorityBadge}
                      style={{ 
                        'background-color': `${getPriorityColor(selectedOrder()!.priority)}20`, 
                        color: getPriorityColor(selectedOrder()!.priority) 
                      }}
                    >
                      {selectedOrder()!.priority}
                    </span>
                  </div>
                </div>
                <button class={styles.modalClose} onClick={() => setSelectedOrder(null)}>×</button>
              </div>
              
              <div class={styles.modalBody}>
                <div class={styles.orderDetails}>
                  <div class={styles.detailSection}>
                    <h3>Order Information</h3>
                    <div class={styles.detailGrid}>
                      <div class={styles.detailItem}>
                        <strong>Department:</strong> 
                        <span>{getSourceIcon(selectedOrder()!.source)} {selectedOrder()!.department}</span>
                      </div>
                      <div class={styles.detailItem}>
                        <strong>Requested By:</strong> {selectedOrder()!.requestedBy}
                      </div>
                      <div class={styles.detailItem}>
                        <strong>Requested Date:</strong> {formatDate(selectedOrder()!.requestedDate)}
                      </div>
                      <div class={styles.detailItem}>
                        <strong>Needed By:</strong> {formatDate(selectedOrder()!.neededByDate)}
                      </div>
                      {selectedOrder()!.totalCost && (
                        <div class={styles.detailItem}>
                          <strong>Total Cost:</strong> {formatCurrency(selectedOrder()!.totalCost)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div class={styles.detailSection}>
                    <h3>Items Ordered</h3>
                    <div class={styles.itemsList}>
                      <For each={selectedOrder()!.items}>
                        {(item) => (
                          <div class={styles.itemDetail}>
                            <div class={styles.itemHeader}>
                              <span class={styles.itemName}>{item.productName}</span>
                              <span class={styles.itemQuantity}>×{item.quantity}</span>
                            </div>
                            {item.unitCost && (
                              <div class={styles.itemCost}>
                                {formatCurrency(item.unitCost)} each = {formatCurrency(item.unitCost * item.quantity)}
                              </div>
                            )}
                            {item.specialInstructions && (
                              <div class={styles.itemInstructions}>
                                📝 {item.specialInstructions}
                              </div>
                            )}
                          </div>
                        )}
                      </For>
                    </div>
                  </div>

                  {(selectedOrder()!.specialInstructions || selectedOrder()!.notes) && (
                    <div class={styles.detailSection}>
                      <h3>Additional Information</h3>
                      {selectedOrder()!.specialInstructions && (
                        <div class={styles.detailItem}>
                          <strong>Special Instructions:</strong> {selectedOrder()!.specialInstructions}
                        </div>
                      )}
                      {selectedOrder()!.notes && (
                        <div class={styles.detailItem}>
                          <strong>Notes:</strong> {selectedOrder()!.notes}
                        </div>
                      )}
                    </div>
                  )}

                  <div class={styles.modalActions}>
                    {selectedOrder()!.status === 'requested' && (
                      <>
                        <button 
                          class={styles.actionBtn}
                          onClick={() => handleStatusChange(selectedOrder()!.id, 'approved')}
                        >
                          ✅ Approve Order
                        </button>
                        <button 
                          class={styles.actionBtn}
                          onClick={() => handleStatusChange(selectedOrder()!.id, 'rejected')}
                        >
                          ❌ Reject Order
                        </button>
                      </>
                    )}
                    {selectedOrder()!.status === 'approved' && (
                      <button 
                        class={styles.actionBtn}
                        onClick={() => handleStatusChange(selectedOrder()!.id, 'in_preparation')}
                      >
                        🥖 Start Preparation
                      </button>
                    )}
                    {selectedOrder()!.status === 'in_preparation' && (
                      <button 
                        class={styles.actionBtn}
                        onClick={() => handleStatusChange(selectedOrder()!.id, 'ready')}
                      >
                        ✅ Mark Ready
                      </button>
                    )}
                    {selectedOrder()!.status === 'ready' && (
                      <button 
                        class={styles.actionBtn}
                        onClick={() => handleStatusChange(selectedOrder()!.id, 'delivered')}
                      >
                        🚚 Mark Delivered
                      </button>
                    )}
                    <button class={styles.actionBtn}>📝 Edit Order</button>
                    <button class={styles.actionBtn}>💬 Add Note</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Show>

        {/* Add Order Modal Placeholder */}
        <Show when={showAddModal()}>
          <div class={styles.modal} onClick={() => setShowAddModal(false)}>
            <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div class={styles.modalHeader}>
                <h2>New Internal Order</h2>
                <button class={styles.modalClose} onClick={() => setShowAddModal(false)}>×</button>
              </div>
              
              <div class={styles.modalBody}>
                <p>Internal order creation form would go here...</p>
                <p>This would include fields for department, requester, items, priority, and delivery requirements.</p>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </>
  )
}