import { createSignal, For, Show } from 'solid-js'
import { useBakeryStore } from '~/stores/bakeryStore'
import SEO from '~/components/SEO/SEO'
import ActionButton from '~/components/ActionButton/ActionButton'
import styles from './inventory.module.css'
import type { InventoryItem } from '~/types/bakery'

export default function Inventory() {
  const { state, actions } = useBakeryStore()
  const [searchTerm, setSearchTerm] = createSignal('')
  const [selectedCategory, setSelectedCategory] = createSignal<'all' | 'ingredient' | 'packaging' | 'supplies'>('all')
  const [sortBy, setSortBy] = createSignal<'name' | 'stock' | 'expiration'>('name')
  const [selectedItem, setSelectedItem] = createSignal<InventoryItem | null>(null)
  const [showAddModal, setShowAddModal] = createSignal(false)

  const categories = [
    { value: 'all', label: 'All Items' },
    { value: 'ingredient', label: 'Ingredients' },
    { value: 'packaging', label: 'Packaging' },
    { value: 'supplies', label: 'Supplies' }
  ]

  const filteredItems = () => {
    let items = state.inventory.items

    if (selectedCategory() !== 'all') {
      items = items.filter(item => item.category === selectedCategory())
    }

    if (searchTerm()) {
      const search = searchTerm().toLowerCase()
      items = items.filter(item =>
        item.name.toLowerCase().includes(search) ||
        item.supplier?.toLowerCase().includes(search)
      )
    }

    // Sort items
    return items.sort((a, b) => {
      switch (sortBy()) {
        case 'stock':
          return (a.currentStock / a.minimumStock) - (b.currentStock / b.minimumStock)
        case 'expiration':
          if (!a.expirationDate && !b.expirationDate) return 0
          if (!a.expirationDate) return 1
          if (!b.expirationDate) return -1
          return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
        default:
          return a.name.localeCompare(b.name)
      }
    })
  }

  const getStockStatus = (item: InventoryItem) => {
    const percentage = (item.currentStock / item.minimumStock) * 100
    if (percentage <= 50) return { status: 'critical', color: '#ef4444' }
    if (percentage <= 100) return { status: 'low', color: '#f59e0b' }
    return { status: 'good', color: '#10b981' }
  }

  const isExpiringSoon = (date: Date | undefined) => {
    if (!date) return false
    const now = new Date()
    const daysDiff = (new Date(date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff <= 7 && daysDiff >= 0
  }

  const formatUnit = (quantity: number, unit: string) => {
    return `${quantity}${unit}`
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString()
  }

  const updateStock = (itemId: string, newStock: number) => {
    actions.updateInventoryItem(itemId, { 
      currentStock: newStock,
      lastRestocked: new Date()
    })
  }

  return (
    <>
      <SEO
        title="Inventory - BakeWind"
        description="Manage bakery inventory, track stock levels, and monitor expiration dates"
        path="/inventory"
      />

      <div class={styles.container}>
        <div class={styles.header}>
          <div class={styles.headerContent}>
            <h1 class={styles.title}>Inventory Management</h1>
            <p class={styles.subtitle}>Monitor stock levels and manage ingredients</p>
          </div>
          
          <div class={styles.headerActions}>
            <ActionButton
              onClick={() => setShowAddModal(true)}
              icon="+"
            >
              Add Item
            </ActionButton>
          </div>
        </div>

        <div class={styles.statsRow}>
          <div class={styles.statCard}>
            <div class={styles.statValue}>{state.inventory.items.length}</div>
            <div class={styles.statLabel}>Total Items</div>
          </div>
          <div class={styles.statCard}>
            <div class={styles.statValue} style={{ color: '#ef4444' }}>
              {state.inventory.items.filter(item => item.currentStock <= item.minimumStock).length}
            </div>
            <div class={styles.statLabel}>Low Stock</div>
          </div>
          <div class={styles.statCard}>
            <div class={styles.statValue} style={{ color: '#f59e0b' }}>
              {state.inventory.items.filter(item => isExpiringSoon(item.expirationDate)).length}
            </div>
            <div class={styles.statLabel}>Expiring Soon</div>
          </div>
          <div class={styles.statCard}>
            <div class={styles.statValue}>
              ${state.inventory.items.reduce((total, item) => total + (item.currentStock * item.costPerUnit), 0).toFixed(0)}
            </div>
            <div class={styles.statLabel}>Total Value</div>
          </div>
        </div>

        <div class={styles.controls}>
          <div class={styles.searchBar}>
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm()}
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
              class={styles.searchInput}
            />
          </div>

          <div class={styles.filters}>
            <select
              value={selectedCategory()}
              onChange={(e) => setSelectedCategory(e.currentTarget.value as any)}
              class={styles.select}
            >
              <For each={categories}>
                {(category) => (
                  <option value={category.value}>{category.label}</option>
                )}
              </For>
            </select>

            <select
              value={sortBy()}
              onChange={(e) => setSortBy(e.currentTarget.value as any)}
              class={styles.select}
            >
              <option value="name">Sort by Name</option>
              <option value="stock">Sort by Stock Level</option>
              <option value="expiration">Sort by Expiration</option>
            </select>
          </div>
        </div>

        <div class={styles.inventoryTable}>
          <div class={styles.tableHeader}>
            <div>Item</div>
            <div>Category</div>
            <div>Current Stock</div>
            <div>Status</div>
            <div>Unit Cost</div>
            <div>Supplier</div>
            <div>Expiration</div>
            <div>Actions</div>
          </div>

          <Show
            when={!state.inventory.loading && filteredItems().length > 0}
            fallback={
              <div class={styles.emptyState}>
                {state.inventory.loading ? 'Loading inventory...' : 'No items found'}
              </div>
            }
          >
            <For each={filteredItems()}>
              {(item) => {
                const stockStatus = getStockStatus(item)
                return (
                  <div 
                    class={styles.tableRow}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div class={styles.itemInfo}>
                      <div class={styles.itemName}>{item.name}</div>
                      <Show when={item.location}>
                        <div class={styles.itemLocation}>📍 {item.location}</div>
                      </Show>
                    </div>

                    <div class={styles.category}>
                      <span class={styles.categoryBadge}>{item.category}</span>
                    </div>

                    <div class={styles.stockInfo}>
                      <div class={styles.stockAmount}>
                        {formatUnit(item.currentStock, item.unit)}
                      </div>
                      <div class={styles.stockBar}>
                        <div 
                          class={styles.stockFill}
                          style={{ 
                            width: `${Math.min((item.currentStock / item.reorderPoint) * 100, 100)}%`,
                            background: stockStatus.color
                          }}
                        />
                      </div>
                      <div class={styles.stockTarget}>
                        Min: {formatUnit(item.minimumStock, item.unit)}
                      </div>
                    </div>

                    <div class={styles.status}>
                      <span 
                        class={`${styles.statusBadge} ${styles[stockStatus.status]}`}
                        style={{ 'background-color': `${stockStatus.color}20`, color: stockStatus.color }}
                      >
                        {stockStatus.status}
                      </span>
                    </div>

                    <div class={styles.unitCost}>
                      ${item.costPerUnit.toFixed(2)}/{item.unit}
                    </div>

                    <div class={styles.supplier}>
                      {item.supplier || 'N/A'}
                    </div>

                    <div class={styles.expiration}>
                      <Show 
                        when={item.expirationDate}
                        fallback={<span class={styles.noExpiration}>No expiry</span>}
                      >
                        <span class={isExpiringSoon(item.expirationDate) ? styles.expiringSoon : ''}>
                          {formatDate(item.expirationDate)}
                        </span>
                      </Show>
                    </div>

                    <div class={styles.actions} onClick={(e) => e.stopPropagation()}>
                      <button 
                        class={styles.actionBtn}
                        onClick={() => {
                          const newStock = prompt('Enter new stock amount:', item.currentStock.toString())
                          if (newStock && !isNaN(Number(newStock))) {
                            updateStock(item.id, Number(newStock))
                          }
                        }}
                      >
                        Update
                      </button>
                    </div>
                  </div>
                )
              }}
            </For>
          </Show>
        </div>

        {/* Item Detail Modal */}
        <Show when={selectedItem()}>
          <div class={styles.modal} onClick={() => setSelectedItem(null)}>
            <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div class={styles.modalHeader}>
                <h2>{selectedItem()!.name}</h2>
                <button class={styles.modalClose} onClick={() => setSelectedItem(null)}>×</button>
              </div>
              
              <div class={styles.modalBody}>
                <div class={styles.detailGrid}>
                  <div class={styles.detailSection}>
                    <h3>Stock Information</h3>
                    <p>Current Stock: {formatUnit(selectedItem()!.currentStock, selectedItem()!.unit)}</p>
                    <p>Minimum Stock: {formatUnit(selectedItem()!.minimumStock, selectedItem()!.unit)}</p>
                    <p>Reorder Point: {formatUnit(selectedItem()!.reorderPoint, selectedItem()!.unit)}</p>
                    <p>Reorder Quantity: {formatUnit(selectedItem()!.reorderQuantity, selectedItem()!.unit)}</p>
                  </div>

                  <div class={styles.detailSection}>
                    <h3>Cost & Supplier</h3>
                    <p>Unit Cost: ${selectedItem()!.costPerUnit.toFixed(2)}</p>
                    <p>Supplier: {selectedItem()!.supplier || 'N/A'}</p>
                    <p>Total Value: ${(selectedItem()!.currentStock * selectedItem()!.costPerUnit).toFixed(2)}</p>
                  </div>

                  <div class={styles.detailSection}>
                    <h3>Storage & Dates</h3>
                    <p>Location: {selectedItem()!.location || 'N/A'}</p>
                    <p>Expiration: {formatDate(selectedItem()!.expirationDate)}</p>
                    <p>Last Restocked: {formatDate(selectedItem()!.lastRestocked)}</p>
                  </div>

                  <Show when={selectedItem()!.notes}>
                    <div class={styles.detailSection}>
                      <h3>Notes</h3>
                      <p>{selectedItem()!.notes}</p>
                    </div>
                  </Show>
                </div>
              </div>
            </div>
          </div>
        </Show>

        {/* Add Item Modal Placeholder */}
        <Show when={showAddModal()}>
          <div class={styles.modal} onClick={() => setShowAddModal(false)}>
            <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div class={styles.modalHeader}>
                <h2>Add New Item</h2>
                <button class={styles.modalClose} onClick={() => setShowAddModal(false)}>×</button>
              </div>
              
              <div class={styles.modalBody}>
                <p>Add item form would go here...</p>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </>
  )
}