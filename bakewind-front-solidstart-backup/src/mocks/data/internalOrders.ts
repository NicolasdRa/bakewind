import type { InternalOrder } from '~/types/bakery'

export const mockInternalOrders: InternalOrder[] = [
  {
    id: 'int-1',
    orderNumber: 'INT-2024-001',
    source: 'cafe',
    status: 'requested',
    priority: 'high',
    requestedBy: 'Maria Santos',
    requestedByEmail: 'maria@bakewind.com',
    department: 'Front House - Café',
    items: [
      {
        id: 'item-1',
        productId: 'recipe-1',
        productName: 'Artisan Sourdough Loaves',
        quantity: 12,
        unitCost: 4.50,
        specialInstructions: 'Need by 6 AM for breakfast rush'
      },
      {
        id: 'item-2',
        productId: 'recipe-3',
        productName: 'Blueberry Muffins',
        quantity: 24,
        unitCost: 2.75
      }
    ],
    totalCost: 120,
    requestedDate: new Date(),
    neededByDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    specialInstructions: 'Morning delivery essential for café opening',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'int-2',
    orderNumber: 'INT-2024-002',
    source: 'restaurant',
    status: 'approved',
    priority: 'normal',
    requestedBy: 'Chef Antonio',
    requestedByEmail: 'antonio@bakewind.com',
    department: 'Restaurant Kitchen',
    items: [
      {
        id: 'item-3',
        productId: 'recipe-2',
        productName: 'Dinner Rolls',
        quantity: 50,
        unitCost: 1.25
      }
    ],
    totalCost: 62.50,
    requestedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    neededByDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
    approvedBy: 'Head Baker Lisa',
    approvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    notes: 'Weekly standing order for restaurant service',
    recurring: {
      frequency: 'weekly',
      nextOrderDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: undefined
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    id: 'int-3',
    orderNumber: 'INT-2024-003',
    source: 'catering',
    status: 'in_preparation',
    priority: 'urgent',
    requestedBy: 'Events Team Sarah',
    requestedByEmail: 'sarah@bakewind.com',
    department: 'Catering & Events',
    items: [
      {
        id: 'item-4',
        productId: 'recipe-4',
        productName: 'Wedding Cake Base',
        quantity: 2,
        unitCost: 85.00,
        specialInstructions: 'Three-tier foundation, vanilla and chocolate'
      },
      {
        id: 'item-5',
        productId: 'recipe-5',
        productName: 'Petit Fours',
        quantity: 100,
        unitCost: 3.50
      }
    ],
    totalCost: 520,
    requestedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    neededByDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    approvedBy: 'Head Baker Lisa',
    approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    specialInstructions: 'Johnson-Smith wedding order. Critical deadline!',
    notes: 'Large event order - coordinate with main production schedule',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
  },
  {
    id: 'int-4',
    orderNumber: 'INT-2024-004',
    source: 'retail',
    status: 'ready',
    priority: 'low',
    requestedBy: 'Store Manager Mike',
    requestedByEmail: 'mike@bakewind.com',
    department: 'Retail Shop',
    items: [
      {
        id: 'item-6',
        productId: 'recipe-6',
        productName: 'Seasonal Cookies',
        quantity: 36,
        unitCost: 2.25
      }
    ],
    totalCost: 81,
    requestedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    neededByDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    approvedBy: 'Head Baker Lisa',
    approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    notes: 'Holiday display cookies for retail section',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 'int-5',
    orderNumber: 'INT-2024-005',
    source: 'front_house',
    status: 'delivered',
    priority: 'normal',
    requestedBy: 'Floor Manager Jenny',
    requestedByEmail: 'jenny@bakewind.com',
    department: 'Front House Service',
    items: [
      {
        id: 'item-7',
        productId: 'recipe-7',
        productName: 'Daily Sandwich Bread',
        quantity: 8,
        unitCost: 3.75
      }
    ],
    totalCost: 30,
    requestedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    neededByDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    approvedBy: 'Head Baker Lisa',
    approvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    notes: 'Daily bread supply for sandwiches - completed',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  }
]