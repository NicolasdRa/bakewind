import { createStore, SetStoreFunction } from 'solid-js/store'
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

// Factory for creating standard CRUD actions
function createEntityActions<T extends { id: string }>(
  setState: SetStoreFunction<BakeryState>,
  entityKey: keyof BakeryState,
  listKey: 'list' | 'items' = 'list'
) {
  return {
    setAll: (items: T[]) => {
      setState(entityKey as any, listKey, items)
    },
    add: (item: T) => {
      setState(entityKey as any, listKey, (prev: T[]) => [...prev, item])
    },
    update: (id: string, updates: Partial<T>) => {
      setState(entityKey as any, listKey, (item: T) => item.id === id, updates as any)
    },
    setLoading: (loading: boolean) => {
      setState(entityKey as any, 'loading', loading)
    }
  }
}

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

// Create entity-specific actions using factory
const orderActions = createEntityActions<Order>(setBakeryState, 'orders')
const productActions = createEntityActions<Product>(setBakeryState, 'products')
const recipeActions = createEntityActions<Recipe>(setBakeryState, 'recipes')
const customerActions = createEntityActions<Customer>(setBakeryState, 'customers')
const inventoryActions = createEntityActions<InventoryItem>(setBakeryState, 'inventory', 'items')
const internalOrderActions = createEntityActions<InternalOrder>(setBakeryState, 'internalOrders')

export const bakeryActions = {
  // Order Management (factory + custom)
  setOrders: orderActions.setAll,
  addOrder: orderActions.add,
  updateOrder: orderActions.update,
  setOrdersLoading: orderActions.setLoading,
  setOrderFilter: (filter: { status?: string; date?: Date; source?: string }) => {
    setBakeryState('orders', 'filter', filter)
  },

  // Inventory Management (factory + custom)
  setInventory: (items: InventoryItem[]) => {
    setBakeryState('inventory', { items, lastUpdated: new Date() })
  },
  addInventoryItem: inventoryActions.add,
  updateInventoryItem: inventoryActions.update,
  setInventoryLoading: inventoryActions.setLoading,

  // Product Management (factory)
  setProducts: productActions.setAll,
  addProduct: productActions.add,
  updateProduct: productActions.update,
  setProductsLoading: productActions.setLoading,

  // Recipe Management (factory)
  setRecipes: recipeActions.setAll,
  addRecipe: recipeActions.add,
  updateRecipe: recipeActions.update,
  setRecipesLoading: recipeActions.setLoading,

  // Customer Management (factory)
  setCustomers: customerActions.setAll,
  addCustomer: customerActions.add,
  updateCustomer: customerActions.update,

  // Internal Order Management (factory + custom)
  setInternalOrders: internalOrderActions.setAll,
  addInternalOrder: internalOrderActions.add,
  updateInternalOrder: internalOrderActions.update,
  setInternalOrdersLoading: internalOrderActions.setLoading,
  setInternalOrderFilter: (filter: { status?: string; source?: string; priority?: string; date?: Date }) => {
    setBakeryState('internalOrders', 'filter', filter)
  },

  // Production Management (unique - no factory pattern fits)
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

  // Dashboard Metrics
  setMetrics: (metrics: DashboardMetrics) => {
    setBakeryState('metrics', metrics)
  },

  // Alerts (unique pattern)
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

  // Mock data loader for development
  loadMockData: () => {
    setBakeryState({
      orders: { ...bakeryState.orders, list: mockOrders },
      products: { ...bakeryState.products, list: mockProducts },
      inventory: { ...bakeryState.inventory, items: mockInventoryItems },
      customers: { ...bakeryState.customers, list: mockCustomers },
      internalOrders: { ...bakeryState.internalOrders, list: mockInternalOrders },
      recipes: { ...bakeryState.recipes, list: mockRecipes },
      metrics: mockMetrics
    })
    logger.info('Mock bakery data loaded successfully')
  },

  // Clear all data (used when tenant is deselected)
  clearData: () => {
    setBakeryState({
      orders: { ...bakeryState.orders, list: [] },
      products: { ...bakeryState.products, list: [] },
      inventory: { ...bakeryState.inventory, items: [] },
      customers: { ...bakeryState.customers, list: [] },
      internalOrders: { ...bakeryState.internalOrders, list: [] },
      recipes: { ...bakeryState.recipes, list: [] },
      metrics: { todayOrders: 0, revenue: 0, newCustomers: 0, productionTasks: 0 }
    })
    logger.info('Bakery data cleared')
  },
}

export { bakeryState }

export const useBakeryStore = () => ({
  state: bakeryState,
  actions: bakeryActions
})
