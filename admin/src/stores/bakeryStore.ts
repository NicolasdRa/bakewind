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
  Customer
} from '~/types/bakery'
import { mockOrders, mockProducts, mockInventoryItems, mockCustomers, mockInternalOrders, mockRecipes, mockMetrics } from '~/mocks/mockData'
import { logger } from '~/utils/logger'

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
  internalOrders: {
    list: [],
    loading: false,
    filter: {}
  },
  metrics: null,
  alerts: []
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

  setInternalOrderFilter: (filter: any) => {
    setBakeryState('internalOrders', 'filter', filter)
  },

  setInternalOrdersLoading: (loading: boolean) => {
    setBakeryState('internalOrders', 'loading', loading)
  },

  // Mock data loader for development
  loadMockData: () => {
    setBakeryState('orders', 'list', mockOrders)
    setBakeryState('products', 'list', mockProducts)
    setBakeryState('inventory', 'items', mockInventoryItems)
    setBakeryState('customers', 'list', mockCustomers)
    setBakeryState('internalOrders', 'list', mockInternalOrders)
    setBakeryState('recipes', 'list', mockRecipes)
    setBakeryState('metrics', mockMetrics)
    logger.info('Mock bakery data loaded successfully')
  },
}

export { bakeryState }

export const useBakeryStore = () => ({
  state: bakeryState,
  actions: bakeryActions
})
