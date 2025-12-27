import type { Order, Product, InventoryItem, Recipe, Customer, InternalOrder, DashboardMetrics } from '~/types/bakery'

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
  },
  {
    id: '3',
    orderNumber: 'ORD-003',
    customerName: 'Emma Wilson',
    customerPhone: '555-0103',
    customerEmail: 'emma.w@email.com',
    source: 'phone',
    status: 'confirmed',
    paymentStatus: 'paid',
    items: [
      { id: '4', productId: '4', productName: 'Blueberry Muffin', quantity: 12, unitPrice: 3.25 },
      { id: '5', productId: '1', productName: 'Sourdough Bread', quantity: 1, unitPrice: 8.50 }
    ],
    subtotal: 47.50,
    tax: 4.28,
    total: 51.78,
    deliveryTime: new Date(Date.now() + 14400000),
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date()
  },
  {
    id: '4',
    orderNumber: 'ORD-004',
    customerName: 'David Brown',
    customerPhone: '555-0104',
    source: 'online',
    status: 'ready',
    paymentStatus: 'paid',
    items: [
      { id: '6', productId: '5', productName: 'Artisan Sandwich', quantity: 3, unitPrice: 12.50 }
    ],
    subtotal: 37.50,
    tax: 3.38,
    total: 40.88,
    pickupTime: new Date(Date.now() + 1800000),
    createdAt: new Date(Date.now() - 7200000),
    updatedAt: new Date()
  }
]

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Classic Sourdough Bread',
    description: 'Traditional artisan sourdough with a crispy crust and tangy flavor',
    category: 'bread',
    status: 'active',
    basePrice: 8.50,
    costOfGoods: 3.50,
    margin: 58.8,
    recipeId: '1',
    recipeName: 'Classic Sourdough Bread',
    estimatedPrepTime: 480,
    allergens: ['Gluten'],
    tags: ['artisan', 'sourdough', 'traditional'],
    customizable: false,
    popularityScore: 95,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Chocolate Croissant',
    description: 'Buttery, flaky croissant filled with premium dark chocolate',
    category: 'pastry',
    status: 'active',
    basePrice: 4.50,
    costOfGoods: 1.20,
    margin: 73.3,
    recipeId: '2',
    estimatedPrepTime: 240,
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    tags: ['french', 'chocolate', 'breakfast'],
    customizable: false,
    popularityScore: 88,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Custom Birthday Cake',
    description: 'Made-to-order birthday cake with custom decorations',
    category: 'cake',
    status: 'active',
    basePrice: 45.00,
    costOfGoods: 12.00,
    margin: 73.3,
    estimatedPrepTime: 180,
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    customizable: true,
    popularityScore: 75,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'Blueberry Muffin',
    description: 'Fresh blueberry muffins made with seasonal berries',
    category: 'pastry',
    status: 'active',
    basePrice: 3.25,
    costOfGoods: 0.95,
    margin: 70.8,
    estimatedPrepTime: 45,
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    customizable: false,
    popularityScore: 82,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    name: 'Artisan Sandwich',
    description: 'Fresh sandwich on house-made bread',
    category: 'sandwich',
    status: 'active',
    basePrice: 12.50,
    costOfGoods: 4.50,
    margin: 64.0,
    estimatedPrepTime: 15,
    allergens: ['Gluten'],
    customizable: true,
    popularityScore: 78,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export const mockInventoryItems: InventoryItem[] = [
  {
    id: '1',
    name: 'All-Purpose Flour',
    category: 'ingredient',
    unit: 'kg',
    currentStock: 45,
    minimumStock: 20,
    reorderPoint: 30,
    reorderQuantity: 50,
    costPerUnit: 1.50,
    supplier: 'Bakery Supplies Co.',
    location: 'Storage Room A'
  },
  {
    id: '2',
    name: 'Butter (Unsalted)',
    category: 'ingredient',
    unit: 'kg',
    currentStock: 15,
    minimumStock: 10,
    reorderPoint: 12,
    reorderQuantity: 25,
    costPerUnit: 8.50,
    supplier: 'Dairy Fresh',
    expirationDate: new Date(Date.now() + 604800000),
    location: 'Refrigerator 1'
  },
  {
    id: '3',
    name: 'Dark Chocolate',
    category: 'ingredient',
    unit: 'kg',
    currentStock: 8,
    minimumStock: 5,
    reorderPoint: 7,
    reorderQuantity: 15,
    costPerUnit: 12.00,
    supplier: 'Premium Chocolate Co.',
    location: 'Storage Room A'
  }
]

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@email.com',
    phone: '555-0101',
    address: '123 Main St, City, State 12345',
    loyaltyPoints: 150,
    createdAt: new Date(Date.now() - 15552000000),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Mike Chen',
    phone: '555-0102',
    loyaltyPoints: 85,
    createdAt: new Date(Date.now() - 7776000000),
    updatedAt: new Date()
  }
]

export const mockInternalOrders: InternalOrder[] = [
  {
    id: '1',
    orderNumber: 'INT-001',
    source: 'cafe',
    status: 'requested',
    priority: 'high',
    requestedBy: 'Alice Manager',
    requestedByEmail: 'alice@bakery.com',
    items: [
      { id: '1', productId: '2', productName: 'Chocolate Croissant', quantity: 24 },
      { id: '2', productId: '4', productName: 'Blueberry Muffin', quantity: 36 }
    ],
    requestedDate: new Date(),
    neededByDate: new Date(Date.now() + 86400000),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    orderNumber: 'INT-002',
    source: 'restaurant',
    status: 'approved',
    priority: 'normal',
    requestedBy: 'Bob Chef',
    items: [
      { id: '3', productId: '1', productName: 'Sourdough Bread', quantity: 10 }
    ],
    requestedDate: new Date(Date.now() - 3600000),
    neededByDate: new Date(Date.now() + 172800000),
    approvedBy: 'Admin User',
    approvedAt: new Date(),
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date()
  }
]

export const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Classic Sourdough Bread',
    category: 'Breads',
    description: 'Traditional sourdough bread recipe',
    ingredients: [
      { ingredientId: '1', ingredientName: 'All-Purpose Flour', quantity: 500, unit: 'g' },
      { ingredientId: '4', ingredientName: 'Water', quantity: 350, unit: 'ml' },
      { ingredientId: '5', ingredientName: 'Salt', quantity: 10, unit: 'g' },
      { ingredientId: '6', ingredientName: 'Sourdough Starter', quantity: 100, unit: 'g' }
    ],
    instructions: [
      'Mix flour, water, and starter',
      'Autolyse for 30 minutes',
      'Add salt and knead',
      'Bulk fermentation for 4-6 hours',
      'Shape and proof overnight',
      'Bake at 450°F for 35-40 minutes'
    ],
    prepTime: 30,
    cookTime: 40,
    yield: 1,
    yieldUnit: 'loaf',
    allergens: ['Gluten'],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export const mockMetrics: DashboardMetrics = {
  todayOrders: {
    total: 4,
    pending: 1,
    inProduction: 1,
    ready: 1,
    delivered: 1,
    value: 180.86
  },
  revenue: {
    today: 180.86,
    week: 1250.00,
    month: 5420.00,
    trend: 15.5
  },
  inventory: {
    lowStock: mockInventoryItems.filter(item => item.currentStock <= item.minimumStock),
    expiringSoon: mockInventoryItems.filter(item => item.expirationDate && item.expirationDate.getTime() - Date.now() < 604800000),
    totalValue: 2450.00
  },
  production: {
    scheduled: 12,
    completed: 8,
    efficiency: 66.7
  },
  topProducts: [
    { name: 'Sourdough Bread', quantity: 45, revenue: 382.50 },
    { name: 'Chocolate Croissant', quantity: 89, revenue: 400.50 },
    { name: 'Blueberry Muffin', quantity: 156, revenue: 507.00 }
  ]
}
