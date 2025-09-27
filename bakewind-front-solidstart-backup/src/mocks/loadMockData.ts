import { isServer } from 'solid-js/web'
import type { BakeryState } from '~/types/bakery'
import {
  mockOrders,
  mockInventory,
  mockProducts,
  mockRecipes,
  mockCustomers,
  mockInternalOrders,
  mockProductionSchedules,
  mockMetrics,
  mockAlerts
} from './data'

export const getMockData = (): Partial<BakeryState> => {
  return {
    orders: { list: mockOrders, loading: false, filter: {} },
    inventory: { items: mockInventory, loading: false, lastUpdated: new Date() },
    products: {
      list: mockProducts,
      loading: false,
      categories: ['bread', 'pastry', 'cake', 'cookie', 'sandwich', 'beverage', 'seasonal', 'custom']
    },
    recipes: {
      list: mockRecipes,
      loading: false,
      categories: ['Breads', 'Pastries', 'Cakes', 'Cookies', 'Seasonal']
    },
    production: {
      schedules: mockProductionSchedules,
      currentSchedule: mockProductionSchedules[0],
      loading: false
    },
    customers: { list: mockCustomers, loading: false },
    suppliers: { list: [], loading: false },
    internalOrders: { list: mockInternalOrders, loading: false, filter: {} },
    metrics: mockMetrics,
    alerts: mockAlerts,
    posIntegration: null
  }
}

export const shouldUseMockData = () => {
  // Only use mock data in development
  if (isServer) return false

  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development'

  // Check for explicit mock data flag
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true'

  return isDevelopment && useMockData !== false
}