import type { Order } from '~/types/bakery'

export const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    customerName: 'Sarah Johnson',
    customerPhone: '555-0101',
    customerEmail: 'sarah@email.com',
    source: 'online',
    status: 'pending',
    paymentStatus: 'paid',
    items: [
      { id: '1', productId: '1', productName: 'Sourdough Bread', quantity: 2, unitPrice: 8.50 },
      { id: '2', productId: '2', productName: 'Chocolate Croissant', quantity: 4, unitPrice: 4.50 }
    ],
    subtotal: 35.00,
    tax: 3.15,
    total: 38.15,
    pickupTime: new Date(Date.now() + 3600000),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    customerName: 'Mike Chen',
    customerPhone: '555-0102',
    source: 'walk_in',
    status: 'in_production',
    paymentStatus: 'pending',
    items: [
      { id: '3', productId: '3', productName: 'Birthday Cake', quantity: 1, unitPrice: 45.00, specialInstructions: 'Write "Happy 30th Birthday!"' }
    ],
    subtotal: 45.00,
    tax: 4.05,
    total: 49.05,
    pickupTime: new Date(Date.now() + 7200000),
    createdAt: new Date(Date.now() - 1800000),
    updatedAt: new Date()
  }
]