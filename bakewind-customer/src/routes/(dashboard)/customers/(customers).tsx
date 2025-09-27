import { createSignal, For, Show, onMount } from 'solid-js'
import { useBakeryStore } from '~/stores/bakeryStore'
import { bakeryActions } from '~/stores/bakeryStore'
import SEO from '~/components/SEO/SEO'
import ViewToggle from '~/components/ViewToggle/ViewToggle'
import ActionButton from '~/components/ActionButton/ActionButton'
import styles from './customers.module.css'
import type { Customer } from '~/types/bakery'

export default function Customers() {
  const { state, actions } = useBakeryStore()
  const [searchTerm, setSearchTerm] = createSignal('')
  const [selectedTier, setSelectedTier] = createSignal<'all' | 'vip' | 'regular' | 'new'>('all')
  const [sortBy, setSortBy] = createSignal<'name' | 'points' | 'recent' | 'spending'>('name')
  const [selectedCustomer, setSelectedCustomer] = createSignal<Customer | null>(null)
  const [showAddModal, setShowAddModal] = createSignal(false)
  const [viewMode, setViewMode] = createSignal<'cards' | 'list'>('cards')

  const viewModeOptions = [
    { 
      value: 'cards', 
      label: 'Cards', 
      mobileIcon: '📱', 
      desktopLabel: 'Cards',
      title: 'Card View' 
    },
    { 
      value: 'list', 
      label: 'List', 
      mobileIcon: '📋', 
      desktopLabel: 'List',
      title: 'List View' 
    }
  ]

  onMount(() => {
    bakeryActions.loadMockData()
  })

  const getCustomerTier = (points: number = 0) => {
    if (points >= 300) return { tier: 'vip', label: 'VIP', color: '#dc2626' }
    if (points >= 100) return { tier: 'regular', label: 'Regular', color: '#f59e0b' }
    return { tier: 'new', label: 'New', color: '#10b981' }
  }

  const getCustomerOrders = (customerId: string) => {
    return state.orders.list.filter(order => 
      order.customerId === customerId || 
      order.customerName === state.customers.list.find(c => c.id === customerId)?.name
    )
  }

  const getCustomerSpending = (customerId: string) => {
    const orders = getCustomerOrders(customerId)
    return orders.reduce((total, order) => total + order.total, 0)
  }

  const getLastOrderDate = (customerId: string) => {
    const orders = getCustomerOrders(customerId)
    if (orders.length === 0) return null
    return orders.reduce((latest, order) => 
      new Date(order.createdAt) > new Date(latest.createdAt) ? order : latest
    ).createdAt
  }

  const filteredCustomers = () => {
    let customers = state.customers.list

    // Filter by tier
    if (selectedTier() !== 'all') {
      customers = customers.filter(customer => 
        getCustomerTier(customer.loyaltyPoints).tier === selectedTier()
      )
    }

    // Filter by search term
    if (searchTerm()) {
      const search = searchTerm().toLowerCase()
      customers = customers.filter(customer =>
        customer.name.toLowerCase().includes(search) ||
        customer.phone.includes(search) ||
        customer.email?.toLowerCase().includes(search) ||
        customer.address?.toLowerCase().includes(search)
      )
    }

    // Sort customers
    return customers.sort((a, b) => {
      switch (sortBy()) {
        case 'points':
          return (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0)
        case 'recent':
          const aLastOrder = getLastOrderDate(a.id)
          const bLastOrder = getLastOrderDate(b.id)
          if (!aLastOrder && !bLastOrder) return 0
          if (!aLastOrder) return 1
          if (!bLastOrder) return -1
          return new Date(bLastOrder).getTime() - new Date(aLastOrder).getTime()
        case 'spending':
          return getCustomerSpending(b.id) - getCustomerSpending(a.id)
        default:
          return a.name.localeCompare(b.name)
      }
    })
  }

  const customerStats = () => {
    const customers = state.customers.list
    const totalCustomers = customers.length
    const vipCustomers = customers.filter(c => getCustomerTier(c.loyaltyPoints).tier === 'vip').length
    const newCustomers = customers.filter(c => {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return new Date(c.createdAt) > monthAgo
    }).length
    const totalPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0)

    return { totalCustomers, vipCustomers, newCustomers, totalPoints }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <>
      <SEO
        title="Customers - BakeWind"
        description="Manage customer relationships, track loyalty points, and analyze customer behavior"
        path="/customers"
      />

      <div class={styles.container}>
        <div class={styles.header}>
          <div class={styles.headerContent}>
            <h1 class={styles.title}>Customer Management</h1>
            <p class={styles.subtitle}>Build relationships and track customer loyalty</p>
          </div>
          
          <div class={styles.headerActions}>
            <ViewToggle 
              options={viewModeOptions}
              currentValue={viewMode()}
              onChange={(mode) => setViewMode(mode as 'cards' | 'list')}
            />
            <ActionButton
              onClick={() => setShowAddModal(true)}
              icon="+"
            >
              New Customer
            </ActionButton>
          </div>
        </div>

        <div class={styles.statsRow}>
          <div class={styles.statCard}>
            <div class={styles.statValue}>{customerStats().totalCustomers}</div>
            <div class={styles.statLabel}>Total Customers</div>
          </div>
          <div class={styles.statCard}>
            <div class={styles.statValue} style={{ color: '#dc2626' }}>
              {customerStats().vipCustomers}
            </div>
            <div class={styles.statLabel}>VIP Customers</div>
          </div>
          <div class={styles.statCard}>
            <div class={styles.statValue} style={{ color: '#10b981' }}>
              {customerStats().newCustomers}
            </div>
            <div class={styles.statLabel}>New This Month</div>
          </div>
          <div class={styles.statCard}>
            <div class={styles.statValue}>
              {Math.round(customerStats().totalPoints / customerStats().totalCustomers)}
            </div>
            <div class={styles.statLabel}>Avg Points</div>
          </div>
        </div>

        <div class={styles.controls}>
          <div class={styles.searchBar}>
            <input
              type="text"
              placeholder="Search customers by name, phone, email..."
              value={searchTerm()}
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
              class={styles.searchInput}
            />
          </div>

          <div class={styles.filters}>
            <select
              value={selectedTier()}
              onChange={(e) => setSelectedTier(e.currentTarget.value as any)}
              class={styles.select}
            >
              <option value="all">All Tiers</option>
              <option value="vip">VIP (300+ points)</option>
              <option value="regular">Regular (100+ points)</option>
              <option value="new">New (&lt; 100 points)</option>
            </select>

            <select
              value={sortBy()}
              onChange={(e) => setSortBy(e.currentTarget.value as any)}
              class={styles.select}
            >
              <option value="name">Sort by Name</option>
              <option value="points">Sort by Points</option>
              <option value="recent">Sort by Recent Orders</option>
              <option value="spending">Sort by Spending</option>
            </select>
          </div>
        </div>

        <Show
          when={!state.customers.loading && filteredCustomers().length > 0}
          fallback={
            <div class={styles.emptyState}>
              {state.customers.loading ? 'Loading customers...' : 'No customers found'}
            </div>
          }
        >
          <div class={viewMode() === 'cards' ? styles.customersGrid : styles.customersList}>
            <For each={filteredCustomers()}>
              {(customer) => {
                const tier = getCustomerTier(customer.loyaltyPoints)
                const spending = getCustomerSpending(customer.id)
                const orderCount = getCustomerOrders(customer.id).length
                const lastOrder = getLastOrderDate(customer.id)

                return (
                  <div 
                    class={viewMode() === 'cards' ? styles.customerCard : styles.customerRow}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div class={styles.customerHeader}>
                      <div class={styles.customerAvatar}>
                        {getInitials(customer.name)}
                      </div>
                      
                      <div class={styles.customerInfo}>
                        <h3 class={styles.customerName}>{customer.name}</h3>
                        <div class={styles.customerContact}>
                          <span>📞 {customer.phone}</span>
                          {customer.email && <span>✉️ {customer.email}</span>}
                        </div>
                      </div>

                      <div class={styles.customerTier}>
                        <span 
                          class={styles.tierBadge}
                          style={{ 'background-color': `${tier.color}20`, color: tier.color }}
                        >
                          {tier.label}
                        </span>
                      </div>
                    </div>

                    <div class={styles.customerDetails}>
                      <div class={styles.detailItem}>
                        <span class={styles.detailIcon}>🏆</span>
                        <span class={styles.detailText}>{customer.loyaltyPoints || 0} points</span>
                      </div>
                      
                      <div class={styles.detailItem}>
                        <span class={styles.detailIcon}>📦</span>
                        <span class={styles.detailText}>{orderCount} orders</span>
                      </div>

                      <div class={styles.detailItem}>
                        <span class={styles.detailIcon}>💰</span>
                        <span class={styles.detailText}>{formatCurrency(spending)} spent</span>
                      </div>

                      {lastOrder && (
                        <div class={styles.detailItem}>
                          <span class={styles.detailIcon}>🕐</span>
                          <span class={styles.detailText}>Last order: {formatDate(lastOrder)}</span>
                        </div>
                      )}
                    </div>

                    {customer.address && viewMode() === 'cards' && (
                      <div class={styles.customerAddress}>
                        📍 {customer.address}
                      </div>
                    )}

                    {customer.notes && viewMode() === 'cards' && (
                      <div class={styles.customerNotes}>
                        📝 {customer.notes}
                      </div>
                    )}

                    <Show when={viewMode() === 'list'}>
                      <div class={styles.listActions}>
                        <div class={styles.listPoints}>{customer.loyaltyPoints || 0}pts</div>
                        <div class={styles.listSpending}>{formatCurrency(spending)}</div>
                        <div class={styles.listOrders}>{orderCount} orders</div>
                      </div>
                    </Show>
                  </div>
                )
              }}
            </For>
          </div>
        </Show>

        {/* Customer Detail Modal */}
        <Show when={selectedCustomer()}>
          <div class={styles.modal} onClick={() => setSelectedCustomer(null)}>
            <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div class={styles.modalHeader}>
                <div class={styles.modalTitle}>
                  <div class={styles.modalAvatar}>
                    {getInitials(selectedCustomer()!.name)}
                  </div>
                  <div>
                    <h2>{selectedCustomer()!.name}</h2>
                    <span 
                      class={styles.tierBadge}
                      style={{ 
                        'background-color': `${getCustomerTier(selectedCustomer()!.loyaltyPoints).color}20`, 
                        color: getCustomerTier(selectedCustomer()!.loyaltyPoints).color 
                      }}
                    >
                      {getCustomerTier(selectedCustomer()!.loyaltyPoints).label} Customer
                    </span>
                  </div>
                </div>
                <button class={styles.modalClose} onClick={() => setSelectedCustomer(null)}>×</button>
              </div>
              
              <div class={styles.modalBody}>
                <div class={styles.modalSections}>
                  <div class={styles.contactSection}>
                    <h3>Contact Information</h3>
                    <div class={styles.contactDetails}>
                      <p><strong>Phone:</strong> {selectedCustomer()!.phone}</p>
                      {selectedCustomer()!.email && (
                        <p><strong>Email:</strong> {selectedCustomer()!.email}</p>
                      )}
                      {selectedCustomer()!.address && (
                        <p><strong>Address:</strong> {selectedCustomer()!.address}</p>
                      )}
                      <p><strong>Customer Since:</strong> {formatDate(selectedCustomer()!.createdAt)}</p>
                    </div>
                  </div>

                  <div class={styles.loyaltySection}>
                    <h3>Loyalty Program</h3>
                    <div class={styles.loyaltyStats}>
                      <div class={styles.loyaltyItem}>
                        <div class={styles.loyaltyValue}>{selectedCustomer()!.loyaltyPoints || 0}</div>
                        <div class={styles.loyaltyLabel}>Current Points</div>
                      </div>
                      <div class={styles.loyaltyItem}>
                        <div class={styles.loyaltyValue}>{getCustomerOrders(selectedCustomer()!.id).length}</div>
                        <div class={styles.loyaltyLabel}>Total Orders</div>
                      </div>
                      <div class={styles.loyaltyItem}>
                        <div class={styles.loyaltyValue}>
                          {formatCurrency(getCustomerSpending(selectedCustomer()!.id))}
                        </div>
                        <div class={styles.loyaltyLabel}>Total Spent</div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedCustomer()!.notes && (
                  <div class={styles.notesSection}>
                    <h3>Customer Notes</h3>
                    <p class={styles.customerNotesText}>{selectedCustomer()!.notes}</p>
                  </div>
                )}

                <div class={styles.modalActions}>
                  <button class={styles.modalActionBtn}>Create Order</button>
                  <button class={styles.modalActionBtn}>Edit Customer</button>
                  <button class={styles.modalActionBtn}>Add Points</button>
                  <button class={styles.modalActionBtn}>View Orders</button>
                </div>
              </div>
            </div>
          </div>
        </Show>

        {/* Add Customer Modal Placeholder */}
        <Show when={showAddModal()}>
          <div class={styles.modal} onClick={() => setShowAddModal(false)}>
            <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div class={styles.modalHeader}>
                <h2>Add New Customer</h2>
                <button class={styles.modalClose} onClick={() => setShowAddModal(false)}>×</button>
              </div>
              
              <div class={styles.modalBody}>
                <p>Customer creation form would go here...</p>
                <p>This would include fields for name, contact information, address, and initial notes.</p>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </>
  )
}