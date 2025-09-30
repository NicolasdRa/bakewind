import { createStore } from 'solid-js/store'
import type {
  Order,
  InternalOrder,
  InventoryItem,
  Recipe,
  Product,
  ProductionSchedule,
  ProductionDemand,
  DashboardMetrics,
  Alert,
  Customer,
  Supplier,
  POSIntegration
} from '~/types/bakery'
import { getMockData, shouldUseMockData } from '~/mocks/loadMockData'

interface BakeryState {
  orders: {
    list: Order[]
    loading: boolean
    filter: {
      status?: string
      date?: Date
      source?: string
    }
  }
  inventory: {
    items: InventoryItem[]
    loading: boolean
    lastUpdated?: Date
  }
  products: {
    list: Product[]
    loading: boolean
    categories: string[]
  }
  recipes: {
    list: Recipe[]
    loading: boolean
    categories: string[]
  }
  production: {
    schedules: ProductionSchedule[]
    currentSchedule?: ProductionSchedule
    loading: boolean
    demand?: ProductionDemand[]
  }
  customers: {
    list: Customer[]
    loading: boolean
  }
  suppliers: {
    list: Supplier[]
    loading: boolean
  }
  internalOrders: {
    list: InternalOrder[]
    loading: boolean
    filter: {
      status?: string
      source?: string
      priority?: string
      date?: Date
    }
  }
  metrics: DashboardMetrics | null
  alerts: Alert[]
  posIntegration: POSIntegration | null
}

const [bakeryState, setBakeryState] = createStore<BakeryState>({
  orders: {
    list: [],
    loading: false,
    filter: {}
  },
  inventory: {
    items: [],
    loading: false
  },
  products: {
    list: [],
    loading: false,
    categories: ['bread', 'pastry', 'cake', 'cookie', 'sandwich', 'beverage', 'seasonal', 'custom']
  },
  recipes: {
    list: [],
    loading: false,
    categories: ['Breads', 'Pastries', 'Cakes', 'Cookies', 'Seasonal']
  },
  production: {
    schedules: [],
    loading: false
  },
  customers: {
    list: [],
    loading: false
  },
  suppliers: {
    list: [],
    loading: false
  },
  internalOrders: {
    list: [],
    loading: false,
    filter: {}
  },
  metrics: null,
  alerts: [],
  posIntegration: null
})

export const bakeryActions = {
  // Order Management
  setOrders: (orders: Order[]) => {
    setBakeryState('orders', 'list', orders)
  },
  
  addOrder: (order: Order) => {
    setBakeryState('orders', 'list', (prev) => [...prev, order])
  },
  
  updateOrder: (orderId: string, updates: Partial<Order>) => {
    setBakeryState('orders', 'list', (order) => order.id === orderId, updates)
  },
  
  setOrderFilter: (filter: { status?: string; date?: Date; source?: string }) => {
    setBakeryState('orders', 'filter', filter)
  },
  
  setOrdersLoading: (loading: boolean) => {
    setBakeryState('orders', 'loading', loading)
  },

  // Inventory Management
  setInventory: (items: InventoryItem[]) => {
    setBakeryState('inventory', {
      items,
      lastUpdated: new Date()
    })
  },
  
  updateInventoryItem: (itemId: string, updates: Partial<InventoryItem>) => {
    setBakeryState('inventory', 'items', (item) => item.id === itemId, updates)
  },
  
  addInventoryItem: (item: InventoryItem) => {
    setBakeryState('inventory', 'items', (prev) => [...prev, item])
  },
  
  setInventoryLoading: (loading: boolean) => {
    setBakeryState('inventory', 'loading', loading)
  },

  // Product Management
  setProducts: (products: Product[]) => {
    setBakeryState('products', 'list', products)
  },
  
  addProduct: (product: Product) => {
    setBakeryState('products', 'list', (prev) => [...prev, product])
  },
  
  updateProduct: (productId: string, updates: Partial<Product>) => {
    setBakeryState('products', 'list', (product) => product.id === productId, updates)
  },
  
  setProductsLoading: (loading: boolean) => {
    setBakeryState('products', 'loading', loading)
  },

  // Recipe Management
  setRecipes: (recipes: Recipe[]) => {
    setBakeryState('recipes', 'list', recipes)
  },
  
  addRecipe: (recipe: Recipe) => {
    setBakeryState('recipes', 'list', (prev) => [...prev, recipe])
  },
  
  updateRecipe: (recipeId: string, updates: Partial<Recipe>) => {
    setBakeryState('recipes', 'list', (recipe) => recipe.id === recipeId, updates)
  },
  
  setRecipesLoading: (loading: boolean) => {
    setBakeryState('recipes', 'loading', loading)
  },

  // Production Management
  setProductionSchedules: (schedules: ProductionSchedule[]) => {
    setBakeryState('production', 'schedules', schedules)
  },
  
  setCurrentSchedule: (schedule: ProductionSchedule) => {
    setBakeryState('production', 'currentSchedule', schedule)
  },
  
  updateProductionItem: (scheduleId: string, itemId: string, updates: any) => {
    setBakeryState('production', 'schedules', 
      (schedule) => schedule.id === scheduleId,
      'items',
      (item) => item.id === itemId,
      updates
    )
  },
  
  setProductionDemand: (demand: ProductionDemand[]) => {
    setBakeryState('production', 'demand', demand)
  },
  
  setProductionLoading: (loading: boolean) => {
    setBakeryState('production', 'loading', loading)
  },

  // Customer Management
  setCustomers: (customers: Customer[]) => {
    setBakeryState('customers', 'list', customers)
  },
  
  addCustomer: (customer: Customer) => {
    setBakeryState('customers', 'list', (prev) => [...prev, customer])
  },
  
  updateCustomer: (customerId: string, updates: Partial<Customer>) => {
    setBakeryState('customers', 'list', (customer) => customer.id === customerId, updates)
  },

  // Supplier Management
  setSuppliers: (suppliers: Supplier[]) => {
    setBakeryState('suppliers', 'list', suppliers)
  },
  
  addSupplier: (supplier: Supplier) => {
    setBakeryState('suppliers', 'list', (prev) => [...prev, supplier])
  },

  // Dashboard Metrics
  setMetrics: (metrics: DashboardMetrics) => {
    setBakeryState('metrics', metrics)
  },

  // Alerts
  setAlerts: (alerts: Alert[]) => {
    setBakeryState('alerts', alerts)
  },
  
  addAlert: (alert: Alert) => {
    setBakeryState('alerts', (prev) => [...prev, alert])
  },
  
  markAlertRead: (alertId: string) => {
    setBakeryState('alerts', (alert) => alert.id === alertId, 'read', true)
  },
  
  removeAlert: (alertId: string) => {
    setBakeryState('alerts', (prev) => prev.filter(a => a.id !== alertId))
  },

  // Internal Order Management
  setInternalOrders: (orders: InternalOrder[]) => {
    setBakeryState('internalOrders', 'list', orders)
  },
  
  addInternalOrder: (order: InternalOrder) => {
    setBakeryState('internalOrders', 'list', (prev) => [...prev, order])
  },
  
  updateInternalOrder: (orderId: string, updates: Partial<InternalOrder>) => {
    setBakeryState('internalOrders', 'list', (order) => order.id === orderId, updates)
  },
  
  updateInternalOrderStatus: (orderId: string, status: any) => {
    const updateData: any = { status, updatedAt: new Date() }
    
    if (status === 'approved') {
      updateData.approvedAt = new Date()
    } else if (status === 'ready') {
      updateData.completedAt = new Date()
    } else if (status === 'delivered') {
      updateData.deliveredAt = new Date()
    }
    
    setBakeryState('internalOrders', 'list', (order) => order.id === orderId, updateData)
  },
  
  setInternalOrderFilter: (filter: any) => {
    setBakeryState('internalOrders', 'filter', filter)
  },
  
  setInternalOrdersLoading: (loading: boolean) => {
    setBakeryState('internalOrders', 'loading', loading)
  },

  // POS Integration
  setPOSIntegration: (integration: POSIntegration) => {
    setBakeryState('posIntegration', integration)
  },

  // Production Planning - Calculate daily demand from orders
  calculateProductionDemand: (targetDate?: Date) => {
    const date = targetDate || new Date()
    const targetDateStr = date.toDateString()
    
    // Get orders for the target date
    const relevantOrders = bakeryState.orders.list.filter(order => {
      const pickupDate = order.pickupTime ? new Date(order.pickupTime).toDateString() : null
      const deliveryDate = order.deliveryTime ? new Date(order.deliveryTime).toDateString() : null
      return pickupDate === targetDateStr || deliveryDate === targetDateStr
    })

    // Get internal orders for the target date  
    const relevantInternalOrders = bakeryState.internalOrders.list.filter(order => {
      const neededDate = new Date(order.neededByDate).toDateString()
      return neededDate === targetDateStr
    })

    // Aggregate demand by product
    const demandMap = new Map<string, ProductionDemand>()

    // Process external orders
    relevantOrders.forEach(order => {
      order.items.forEach(item => {
        const existing = demandMap.get(item.productId) || {
          productId: item.productId,
          productName: item.productName,
          totalQuantity: 0,
          sources: { externalOrders: 0, internalOrders: 0 },
          estimatedPrepTime: 0,
          priority: 'normal' as const
        }

        existing.totalQuantity += item.quantity
        existing.sources.externalOrders += item.quantity

        // Find product for prep time
        const product = bakeryState.products.list.find(p => p.id === item.productId)
        if (product && product.estimatedPrepTime) {
          existing.estimatedPrepTime = product.estimatedPrepTime
          existing.recipeId = product.recipeId
        }

        demandMap.set(item.productId, existing)
      })
    })

    // Process internal orders
    relevantInternalOrders.forEach(order => {
      order.items.forEach(item => {
        const existing = demandMap.get(item.productId) || {
          productId: item.productId,
          productName: item.productName,
          totalQuantity: 0,
          sources: { externalOrders: 0, internalOrders: 0 },
          estimatedPrepTime: 0,
          priority: 'normal' as const
        }

        existing.totalQuantity += item.quantity
        existing.sources.internalOrders += item.quantity

        // Set priority based on internal order priority
        if (order.priority === 'urgent' || order.priority === 'high') {
          existing.priority = order.priority
        }

        // Find product for prep time
        const product = bakeryState.products.list.find(p => p.id === item.productId)
        if (product && product.estimatedPrepTime) {
          existing.estimatedPrepTime = product.estimatedPrepTime
          existing.recipeId = product.recipeId
        }

        demandMap.set(item.productId, existing)
      })
    })

    const demand = Array.from(demandMap.values()).sort((a, b) => {
      // Sort by priority first, then by quantity
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
      const aPriority = priorityOrder[a.priority]
      const bPriority = priorityOrder[b.priority]
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }
      
      return b.totalQuantity - a.totalQuantity
    })

    setBakeryState('production', 'demand', demand)
    return demand
  },

  // Mock data loader for development
  loadMockData: () => {
    if (!shouldUseMockData()) {
      console.log('Mock data disabled in production or by configuration')
      return
    }

    const mockData = getMockData()
    setBakeryState(mockData as BakeryState)
    console.log('Mock data loaded successfully')
  },

}

export { bakeryState }

export const useBakeryStore = () => ({
  state: bakeryState,
  actions: bakeryActions
})