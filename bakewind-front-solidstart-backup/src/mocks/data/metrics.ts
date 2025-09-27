import type { DashboardMetrics, Alert } from '~/types/bakery'
import { mockInventory } from './inventory'

export const mockMetrics: DashboardMetrics = {
  todayOrders: {
    total: 24,
    pending: 5,
    inProduction: 8,
    ready: 7,
    delivered: 4,
    value: 1245.80
  },
  revenue: {
    today: 1245.80,
    week: 8932.45,
    month: 38456.20,
    trend: 12.5
  },
  inventory: {
    lowStock: mockInventory.filter(item => item.currentStock <= item.reorderPoint),
    expiringSoon: mockInventory.filter(item => item.expirationDate && item.expirationDate < new Date(Date.now() + 259200000)),
    totalValue: 4532.00
  },
  production: {
    scheduled: 45,
    completed: 32,
    efficiency: 71
  },
  topProducts: [
    { name: 'Sourdough Bread', quantity: 28, revenue: 238.00 },
    { name: 'Chocolate Croissant', quantity: 45, revenue: 202.50 },
    { name: 'Blueberry Muffin', quantity: 36, revenue: 144.00 }
  ]
}

export const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'low_inventory',
    severity: 'medium',
    title: 'Low Stock Alert',
    message: 'Unsalted Butter is running low (12 kg remaining)',
    actionUrl: '/inventory',
    read: false,
    createdAt: new Date()
  },
  {
    id: '2',
    type: 'order_pending',
    severity: 'high',
    title: 'Orders Awaiting Confirmation',
    message: '5 orders need confirmation',
    actionUrl: '/orders',
    read: false,
    createdAt: new Date()
  }
]