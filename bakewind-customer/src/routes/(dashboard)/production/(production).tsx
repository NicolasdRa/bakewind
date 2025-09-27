import { createSignal, For, Show, onMount, createEffect } from 'solid-js'
import { useBakeryStore } from '~/stores/bakeryStore'
import { bakeryActions } from '~/stores/bakeryStore'
import SEO from '~/components/SEO/SEO'
import ActionButton from '~/components/ActionButton/ActionButton'
import ViewToggle from '~/components/ViewToggle/ViewToggle'
import styles from './production.module.css'
import type { ProductionItem, ProductionStatus, Recipe } from '~/types/bakery'

export default function Production() {
  const { state, actions } = useBakeryStore()
  const [selectedDate, setSelectedDate] = createSignal(new Date())
  const [selectedItem, setSelectedItem] = createSignal<ProductionItem | null>(null)
  const [showAddModal, setShowAddModal] = createSignal(false)
  const [currentTime, setCurrentTime] = createSignal(new Date())
  const [draggedItem, setDraggedItem] = createSignal<ProductionItem | null>(null)
  const [dragOverColumn, setDragOverColumn] = createSignal<ProductionStatus | null>(null)
  const [viewMode, setViewMode] = createSignal<'kanban' | 'planning'>('kanban')
  const [showRecipeModal, setShowRecipeModal] = createSignal(false)
  const [selectedRecipe, setSelectedRecipe] = createSignal<Recipe | null>(null)
  const [selectedDemand, setSelectedDemand] = createSignal<{productName: string, totalQuantity: number, recipeId: string} | null>(null)

  const viewModeOptions = [
    { 
      value: 'kanban', 
      label: 'Kanban', 
      mobileIcon: '📋', 
      desktopLabel: 'Production Board',
      title: 'Kanban Board View' 
    },
    { 
      value: 'planning', 
      label: 'Planning', 
      mobileIcon: '📅', 
      desktopLabel: 'Demand Planning',
      title: 'Production Planning View' 
    }
  ]

  onMount(() => {
    bakeryActions.loadMockData()
    
    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    
    return () => clearInterval(interval)
  })

  // Calculate demand when date changes
  createEffect(() => {
    actions.calculateProductionDemand(selectedDate())
  })

  const currentSchedule = () => {
    const dateStr = selectedDate().toDateString()
    return state.production.schedules.find(
      schedule => new Date(schedule.date).toDateString() === dateStr
    ) || {
      id: 'temp',
      date: selectedDate(),
      items: [],
      totalItems: 0,
      completedItems: 0,
      notes: '',
      createdBy: 'System',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  const getStatusGroups = () => {
    const schedule = currentSchedule()
    const groups = {
      scheduled: schedule.items.filter(item => item.status === 'scheduled'),
      in_progress: schedule.items.filter(item => item.status === 'in_progress'),
      completed: schedule.items.filter(item => item.status === 'completed'),
      cancelled: schedule.items.filter(item => item.status === 'cancelled')
    }
    return groups
  }

  const getStatusColor = (status: ProductionStatus) => {
    const colors = {
      scheduled: '#fbbf24',
      in_progress: '#f97316',
      completed: '#10b981',
      cancelled: '#ef4444'
    }
    return colors[status] || '#6b7280'
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    })
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isOverdue = (item: ProductionItem) => {
    if (item.status === 'completed' || item.status === 'cancelled') return false
    return new Date(item.scheduledTime) < currentTime()
  }

  const updateItemStatus = (itemId: string, newStatus: ProductionStatus) => {
    const currentScheduleData = currentSchedule()
    if (currentScheduleData.id === 'temp') return
    
    const updates: Partial<ProductionItem> = { status: newStatus }
    if (newStatus === 'completed') {
      updates.completedTime = new Date()
    }
    
    actions.updateProductionItem(currentScheduleData.id, itemId, updates)
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return '#10b981'
    if (efficiency >= 60) return '#f59e0b'
    return '#ef4444'
  }

  const todayEfficiency = () => {
    const schedule = currentSchedule()
    if (schedule.totalItems === 0) return 0
    return Math.round((schedule.completedItems / schedule.totalItems) * 100)
  }

  // Drag and Drop handlers
  const handleDragStart = (e: DragEvent, item: ProductionItem) => {
    setDraggedItem(item)
    e.dataTransfer!.effectAllowed = 'move'
    e.dataTransfer!.setData('text/html', '')
  }

  const handleDragOver = (e: DragEvent, targetStatus: ProductionStatus) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'
    setDragOverColumn(targetStatus)
  }

  const handleDragLeave = (e: DragEvent) => {
    // Only clear drag over if we're actually leaving the column container
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverColumn(null)
    }
  }

  const handleDrop = (e: DragEvent, targetStatus: ProductionStatus) => {
    e.preventDefault()
    const item = draggedItem()
    
    if (item && item.status !== targetStatus) {
      // Validate status transitions
      const validTransitions: Record<ProductionStatus, ProductionStatus[]> = {
        'scheduled': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'cancelled', 'scheduled'],
        'completed': ['in_progress'], // Allow moving back for corrections
        'cancelled': ['scheduled', 'in_progress']
      }
      
      if (validTransitions[item.status]?.includes(targetStatus)) {
        const updates: Partial<ProductionItem> = { 
          status: targetStatus 
        }
        
        // Add completion time when moving to completed
        if (targetStatus === 'completed') {
          updates.completedTime = new Date()
        }
        
        // Clear completion time when moving away from completed
        if (item.status === 'completed' && targetStatus !== 'completed') {
          updates.completedTime = undefined
        }
        
        updateItemStatus(item.id, targetStatus)
        console.log(`Moved ${item.recipeName} from ${item.status} to ${targetStatus}`)
      }
    }
    
    setDraggedItem(null)
    setDragOverColumn(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverColumn(null)
  }

  // Production planning helpers
  const getPriorityColor = (priority: 'low' | 'normal' | 'high' | 'urgent') => {
    switch (priority) {
      case 'urgent': return '#dc2626'
      case 'high': return '#ea580c'
      case 'normal': return '#059669'
      case 'low': return '#6b7280'
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${minutes}m`
  }

  const findRecipeById = (recipeId: string): Recipe | null => {
    return state.recipes.list.find(recipe => recipe.id === recipeId) || null
  }

  const openProductionRecipeModal = (demand: any) => {
    const recipe = findRecipeById(demand.recipeId)
    if (recipe) {
      // Calculate scaling factor based on demand quantity vs recipe yield
      const scalingFactor = demand.totalQuantity / recipe.yield
      
      // Create a scaled recipe
      const scaledRecipe = {
        ...recipe,
        name: `${recipe.name} (Production Scale)`,
        description: `Scaled recipe for ${demand.totalQuantity} ${recipe.yieldUnit} (${scalingFactor.toFixed(1)}x original recipe) - Production demand for ${demand.productName}`,
        yield: demand.totalQuantity,
        ingredients: recipe.ingredients.map(ingredient => ({
          ...ingredient,
          quantity: ingredient.quantity * scalingFactor,
          cost: ingredient.cost ? ingredient.cost * scalingFactor : undefined
        })),
        prepTime: Math.ceil(recipe.prepTime * Math.sqrt(scalingFactor)), // Prep time doesn't scale linearly
        cookTime: Math.ceil(recipe.cookTime * Math.sqrt(scalingFactor)), // Cook time doesn't scale linearly
        costPerUnit: recipe.costPerUnit ? recipe.costPerUnit * scalingFactor : undefined
      }
      
      setSelectedRecipe(scaledRecipe)
      setSelectedDemand({
        productName: demand.productName,
        totalQuantity: demand.totalQuantity,
        recipeId: demand.recipeId
      })
      setShowRecipeModal(true)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getTotalPlanningStats = () => {
    const demand = state.production.demand || []
    const totalProducts = demand.length
    const totalQuantity = demand.reduce((sum, item) => sum + item.totalQuantity, 0)
    const totalPrepTime = demand.reduce((sum, item) => sum + (item.estimatedPrepTime * item.totalQuantity), 0)
    const urgentItems = demand.filter(item => item.priority === 'urgent' || item.priority === 'high').length

    return { totalProducts, totalQuantity, totalPrepTime, urgentItems }
  }

  return (
    <>
      <SEO
        title="Production - BakeWind"
        description="Manage daily production schedules, track progress, and coordinate kitchen operations"
        path="/production"
      />

      <div class={styles.container}>
        <div class={styles.header}>
          <div class={styles.headerContent}>
            <h1 class={styles.title}>Production Management</h1>
            <p class={styles.subtitle}>Coordinate kitchen operations and track daily production</p>
          </div>
          
          <div class={styles.headerActions}>
            <ViewToggle 
              options={viewModeOptions}
              currentValue={viewMode()}
              onChange={(mode) => setViewMode(mode as 'kanban' | 'planning')}
            />
            <input
              type="date"
              value={selectedDate().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.currentTarget.value))}
              class={styles.dateInput}
            />
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
            <div class={styles.statValue}>{getStatusGroups().scheduled.length}</div>
            <div class={styles.statLabel}>Scheduled</div>
          </div>
          <div class={styles.statCard}>
            <div class={styles.statValue}>{getStatusGroups().in_progress.length}</div>
            <div class={styles.statLabel}>In Progress</div>
          </div>
          <div class={styles.statCard}>
            <div class={styles.statValue}>{getStatusGroups().completed.length}</div>
            <div class={styles.statLabel}>Completed</div>
          </div>
          <div class={styles.statCard}>
            <div 
              class={styles.statValue}
              style={{ color: getEfficiencyColor(todayEfficiency()) }}
            >
              {todayEfficiency()}%
            </div>
            <div class={styles.statLabel}>Efficiency</div>
          </div>
        </div>

        <div class={styles.scheduleHeader}>
          <div class={styles.scheduleInfo}>
            <h2 class={styles.scheduleTitle}>{formatDate(selectedDate())}</h2>
            <p class={styles.scheduleSubtitle}>
              {currentSchedule().totalItems} items scheduled • {currentSchedule().completedItems} completed
            </p>
          </div>
          <div class={styles.currentTime}>
            Current time: {formatTime(currentTime())}
          </div>
        </div>

        <Show when={viewMode() === 'planning'}>
          <div class={styles.planningView}>
            <div class={styles.planningHeader}>
              <h2 class={styles.planningTitle}>Production Demand for {formatDate(selectedDate())}</h2>
              <div class={styles.planningStats}>
                <div class={styles.planningStat}>
                  <span class={styles.planningStatValue}>{getTotalPlanningStats().totalProducts}</span>
                  <span class={styles.planningStatLabel}>Products</span>
                </div>
                <div class={styles.planningStat}>
                  <span class={styles.planningStatValue}>{getTotalPlanningStats().totalQuantity}</span>
                  <span class={styles.planningStatLabel}>Total Units</span>
                </div>
                <div class={styles.planningStat}>
                  <span class={styles.planningStatValue}>{formatDuration(getTotalPlanningStats().totalPrepTime)}</span>
                  <span class={styles.planningStatLabel}>Est. Time</span>
                </div>
                <div class={styles.planningStat}>
                  <span class={styles.planningStatValue} style={{ color: '#dc2626' }}>{getTotalPlanningStats().urgentItems}</span>
                  <span class={styles.planningStatLabel}>High Priority</span>
                </div>
              </div>
            </div>

            <Show when={state.production.demand && state.production.demand.length > 0} fallback={
              <div class={styles.emptyPlanning}>
                <h3>No production demand found</h3>
                <p>There are no orders scheduled for {formatDate(selectedDate())}.</p>
                <p>Orders with pickup/delivery dates or internal orders with due dates will appear here.</p>
              </div>
            }>
              <div class={styles.demandTable}>
                <div class={styles.demandTableHeader}>
                  <div class={styles.demandHeaderCell}>Product</div>
                  <div class={styles.demandHeaderCell}>Priority</div>
                  <div class={styles.demandHeaderCell}>Total Qty</div>
                  <div class={styles.demandHeaderCell}>External</div>
                  <div class={styles.demandHeaderCell}>Internal</div>
                  <div class={styles.demandHeaderCell}>Prep Time</div>
                  <div class={styles.demandHeaderCell}>Actions</div>
                </div>
                
                <For each={state.production.demand}>
                  {(demand) => (
                    <div class={styles.demandTableRow}>
                      <div class={styles.demandTableCell}>
                        <div class={styles.demandProductInfo}>
                          <div class={styles.demandProductName}>{demand.productName}</div>
                        </div>
                      </div>
                      
                      <div class={styles.demandTableCell}>
                        <span 
                          class={styles.demandPriorityBadge}
                          style={{ 'background-color': `${getPriorityColor(demand.priority)}20`, color: getPriorityColor(demand.priority) }}
                        >
                          {demand.priority.toUpperCase()}
                        </span>
                      </div>
                      
                      <div class={styles.demandTableCell}>
                        <div class={styles.demandQuantity}>{demand.totalQuantity}</div>
                        <div class={styles.demandQuantityLabel}>units</div>
                      </div>
                      
                      <div class={styles.demandTableCell}>
                        <div class={styles.demandSourceValue}>
                          <span class={styles.demandSourceIcon}>🛒</span>
                          <span class={styles.demandSourceCount}>{demand.sources.externalOrders}</span>
                        </div>
                      </div>
                      
                      <div class={styles.demandTableCell}>
                        <div class={styles.demandSourceValue}>
                          <span class={styles.demandSourceIcon}>🏢</span>
                          <span class={styles.demandSourceCount}>{demand.sources.internalOrders}</span>
                        </div>
                      </div>
                      
                      <div class={styles.demandTableCell}>
                        <div class={styles.demandPrepTime}>
                          {demand.estimatedPrepTime > 0 ? formatDuration(demand.estimatedPrepTime * demand.totalQuantity) : '-'}
                        </div>
                      </div>
                      
                      <div class={styles.demandTableCell}>
                        <div class={styles.demandTableActions}>
                          <button 
                            class={styles.demandTableActionBtn}
                            title="Add to Production"
                          >
                            ➕
                          </button>
                          {demand.recipeId && (
                            <button 
                              class={styles.demandTableActionBtn}
                              title="View Production Recipe"
                              onClick={() => openProductionRecipeModal(demand)}
                            >
                              📖
                            </button>
                          )}
                          <button 
                            class={styles.demandTableActionBtn}
                            title="View Details"
                          >
                            📊
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </Show>

        <Show when={viewMode() === 'kanban'}>
          <div class={styles.productionBoard}>
          <div 
            class={`${styles.statusColumn} ${dragOverColumn() === 'scheduled' ? styles.dragOver : ''}`}
            onDragOver={(e) => handleDragOver(e, 'scheduled')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'scheduled')}
          >
            <div class={styles.columnHeader}>
              <h3 class={styles.columnTitle}>Scheduled</h3>
              <span class={styles.columnCount}>{getStatusGroups().scheduled.length}</span>
            </div>
            <div class={styles.itemsList}>
              <For each={getStatusGroups().scheduled}>
                {(item) => (
                  <div 
                    class={`${styles.productionCard} ${isOverdue(item) ? styles.overdue : ''} ${draggedItem()?.id === item.id ? styles.dragging : ''}`}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div class={styles.cardHeader}>
                      <h4 class={styles.itemName}>{item.recipeName}</h4>
                      <span class={styles.quantity}>×{item.quantity}</span>
                    </div>
                    
                    <div class={styles.cardDetails}>
                      <div class={styles.detailRow}>
                        <span class={styles.detailIcon}>🕐</span>
                        <span class={styles.detailText}>{formatTime(item.scheduledTime)}</span>
                        {isOverdue(item) && <span class={styles.overdueTag}>OVERDUE</span>}
                      </div>
                      
                      {item.assignedTo && (
                        <div class={styles.detailRow}>
                          <span class={styles.detailIcon}>👨‍🍳</span>
                          <span class={styles.detailText}>{item.assignedTo}</span>
                        </div>
                      )}
                      
                      <div class={styles.detailRow}>
                        <span class={styles.detailIcon}>#</span>
                        <span class={styles.detailText}>{item.batchNumber}</span>
                      </div>
                    </div>

                    <div class={styles.dragHint}>
                      Drag to move →
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>

          <div 
            class={`${styles.statusColumn} ${dragOverColumn() === 'in_progress' ? styles.dragOver : ''}`}
            onDragOver={(e) => handleDragOver(e, 'in_progress')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'in_progress')}
          >
            <div class={styles.columnHeader}>
              <h3 class={styles.columnTitle}>In Progress</h3>
              <span class={styles.columnCount}>{getStatusGroups().in_progress.length}</span>
            </div>
            <div class={styles.itemsList}>
              <For each={getStatusGroups().in_progress}>
                {(item) => (
                  <div 
                    class={`${styles.productionCard} ${styles.inProgress} ${draggedItem()?.id === item.id ? styles.dragging : ''}`}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div class={styles.cardHeader}>
                      <h4 class={styles.itemName}>{item.recipeName}</h4>
                      <span class={styles.quantity}>×{item.quantity}</span>
                    </div>
                    
                    <div class={styles.cardDetails}>
                      <div class={styles.detailRow}>
                        <span class={styles.detailIcon}>🕐</span>
                        <span class={styles.detailText}>{formatTime(item.scheduledTime)}</span>
                      </div>
                      
                      {item.assignedTo && (
                        <div class={styles.detailRow}>
                          <span class={styles.detailIcon}>👨‍🍳</span>
                          <span class={styles.detailText}>{item.assignedTo}</span>
                        </div>
                      )}
                      
                      <div class={styles.detailRow}>
                        <span class={styles.detailIcon}>#</span>
                        <span class={styles.detailText}>{item.batchNumber}</span>
                      </div>
                    </div>

                    {item.notes && (
                      <div class={styles.itemNotes}>
                        📝 {item.notes}
                      </div>
                    )}

                    <div class={styles.dragHint}>
                      Drag to move →
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>

          <div 
            class={`${styles.statusColumn} ${dragOverColumn() === 'completed' ? styles.dragOver : ''}`}
            onDragOver={(e) => handleDragOver(e, 'completed')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'completed')}
          >
            <div class={styles.columnHeader}>
              <h3 class={styles.columnTitle}>Completed</h3>
              <span class={styles.columnCount}>{getStatusGroups().completed.length}</span>
            </div>
            <div class={styles.itemsList}>
              <For each={getStatusGroups().completed}>
                {(item) => (
                  <div 
                    class={`${styles.productionCard} ${styles.completed} ${draggedItem()?.id === item.id ? styles.dragging : ''}`}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div class={styles.cardHeader}>
                      <h4 class={styles.itemName}>{item.recipeName}</h4>
                      <span class={styles.quantity}>×{item.quantity}</span>
                    </div>
                    
                    <div class={styles.cardDetails}>
                      <div class={styles.detailRow}>
                        <span class={styles.detailIcon}>✅</span>
                        <span class={styles.detailText}>
                          {item.completedTime ? formatTime(item.completedTime) : 'Completed'}
                        </span>
                      </div>
                      
                      {item.assignedTo && (
                        <div class={styles.detailRow}>
                          <span class={styles.detailIcon}>👨‍🍳</span>
                          <span class={styles.detailText}>{item.assignedTo}</span>
                        </div>
                      )}
                      
                      <div class={styles.detailRow}>
                        <span class={styles.detailIcon}>#</span>
                        <span class={styles.detailText}>{item.batchNumber}</span>
                      </div>
                    </div>

                    {item.qualityCheck && (
                      <div class={styles.qualityCheck}>
                        ✅ Quality checked
                      </div>
                    )}
                    
                    <div class={styles.dragHint} style={{ opacity: '0.7' }}>
                      Drag to re-open
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
          </div>
        </Show>

        {/* Production Item Detail Modal */}
        <Show when={selectedItem()}>
          <div class={styles.modal} onClick={() => setSelectedItem(null)}>
            <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div class={styles.modalHeader}>
                <div class={styles.modalTitle}>
                  <h2>{selectedItem()!.recipeName}</h2>
                  <span 
                    class={styles.statusBadge}
                    style={{ 'background-color': `${getStatusColor(selectedItem()!.status)}20`, color: getStatusColor(selectedItem()!.status) }}
                  >
                    {selectedItem()!.status.replace('_', ' ')}
                  </span>
                </div>
                <button class={styles.modalClose} onClick={() => setSelectedItem(null)}>×</button>
              </div>
              
              <div class={styles.modalBody}>
                <div class={styles.itemDetails}>
                  <div class={styles.detailGroup}>
                    <h3>Production Details</h3>
                    <p>Quantity: {selectedItem()!.quantity} units</p>
                    <p>Batch Number: {selectedItem()!.batchNumber}</p>
                    <p>Scheduled: {formatTime(selectedItem()!.scheduledTime)}</p>
                    {selectedItem()!.completedTime && (
                      <p>Completed: {formatTime(selectedItem()!.completedTime)}</p>
                    )}
                    {selectedItem()!.assignedTo && (
                      <p>Assigned to: {selectedItem()!.assignedTo}</p>
                    )}
                  </div>

                  {selectedItem()!.notes && (
                    <div class={styles.detailGroup}>
                      <h3>Notes</h3>
                      <p>{selectedItem()!.notes}</p>
                    </div>
                  )}

                  <div class={styles.detailGroup}>
                    <h3>Actions</h3>
                    <div class={styles.modalActions}>
                      <Show when={selectedItem()!.status === 'scheduled'}>
                        <button 
                          class={styles.modalActionBtn}
                          onClick={() => {
                            updateItemStatus(selectedItem()!.id, 'in_progress')
                            setSelectedItem(null)
                          }}
                        >
                          Start Production
                        </button>
                      </Show>
                      <Show when={selectedItem()!.status === 'in_progress'}>
                        <button 
                          class={styles.modalActionBtn}
                          onClick={() => {
                            updateItemStatus(selectedItem()!.id, 'completed')
                            setSelectedItem(null)
                          }}
                        >
                          Mark Complete
                        </button>
                      </Show>
                      <button class={styles.modalActionBtn}>View Recipe</button>
                      <button class={styles.modalActionBtn}>Edit Item</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Show>

        {/* Recipe Modal */}
        <Show when={showRecipeModal() && selectedRecipe()}>
          <div class={styles.modal} onClick={() => setShowRecipeModal(false)}>
            <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div class={styles.modalHeader}>
                <div class={styles.modalTitle}>
                  <div class={styles.modalIcon}>👨‍🍳</div>
                  <div>
                    <h2>{selectedRecipe()!.name}</h2>
                    <span class={styles.recipeCategory}>{selectedRecipe()!.category}</span>
                    <Show when={selectedDemand()}>
                      <div class={styles.productionBadge}>
                        Production Recipe for {formatDate(selectedDate())}
                      </div>
                    </Show>
                  </div>
                </div>
                <button class={styles.modalClose} onClick={() => setShowRecipeModal(false)}>×</button>
              </div>
              
              <div class={styles.modalBody}>
                <div class={styles.recipeContent}>
                  <Show when={selectedRecipe()!.description}>
                    <div class={styles.recipeDescription}>
                      <p>{selectedRecipe()!.description}</p>
                    </div>
                  </Show>

                  <div class={styles.recipeDetails}>
                    <div class={styles.timeInfo}>
                      <div class={styles.timeItem}>
                        <span class={styles.timeLabel}>Prep Time:</span>
                        <span class={styles.timeValue}>{formatDuration(selectedRecipe()!.prepTime)}</span>
                      </div>
                      <div class={styles.timeItem}>
                        <span class={styles.timeLabel}>Cook Time:</span>
                        <span class={styles.timeValue}>{formatDuration(selectedRecipe()!.cookTime)}</span>
                      </div>
                      <div class={styles.timeItem}>
                        <span class={styles.timeLabel}>Total:</span>
                        <span class={styles.timeValue}>{formatDuration(selectedRecipe()!.prepTime + selectedRecipe()!.cookTime)}</span>
                      </div>
                    </div>
                    
                    <div class={styles.yieldInfo}>
                      <span class={styles.yieldLabel}>Yield:</span>
                      <span class={styles.yieldValue}>{selectedRecipe()!.yield} {selectedRecipe()!.yieldUnit}</span>
                    </div>
                  </div>

                  <div class={styles.recipeSection}>
                    <h3>Ingredients</h3>
                    <div class={styles.ingredientsList}>
                      <For each={selectedRecipe()?.ingredients || []}>
                        {(ingredient) => (
                          <div class={styles.ingredientItem}>
                            <span class={styles.ingredientQuantity}>
                              {ingredient.quantity} {ingredient.unit}
                            </span>
                            <span class={styles.ingredientName}>{ingredient.ingredientName}</span>
                            <Show when={ingredient.cost}>
                              <span class={styles.ingredientCost}>
                                {formatCurrency(ingredient.cost!)}
                              </span>
                            </Show>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>

                  <div class={styles.recipeSection}>
                    <h3>Instructions</h3>
                    <div class={styles.instructionsList}>
                      <For each={selectedRecipe()!.instructions}>
                        {(instruction, index) => (
                          <div class={styles.instructionStep}>
                            <span class={styles.stepNumber}>{index() + 1}</span>
                            <span class={styles.stepText}>{instruction}</span>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>

                  <Show when={selectedRecipe()!.allergens && selectedRecipe()!.allergens!.length > 0}>
                    <div class={styles.recipeSection}>
                      <h3>Allergens</h3>
                      <div class={styles.allergensList}>
                        <For each={selectedRecipe()!.allergens}>
                          {(allergen) => (
                            <span class={styles.allergenBadge}>⚠️ {allergen}</span>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>

                  <Show when={selectedRecipe()!.tags && selectedRecipe()!.tags.length > 0}>
                    <div class={styles.recipeSection}>
                      <h3>Tags</h3>
                      <div class={styles.recipeTagsList}>
                        <For each={selectedRecipe()!.tags}>
                          {(tag) => (
                            <span class={styles.recipeTag}>#{tag}</span>
                          )}
                        </For>
                      </div>
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
                <h2>Add Production Item</h2>
                <button class={styles.modalClose} onClick={() => setShowAddModal(false)}>×</button>
              </div>
              
              <div class={styles.modalBody}>
                <p>Production item creation form would go here...</p>
                <p>This would integrate with the recipe management system to select recipes, set quantities, assign staff, and schedule production times.</p>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </>
  )
}