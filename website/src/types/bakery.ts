export type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'cancelled'
export type OrderSource = 'online' | 'phone' | 'walk_in' | 'wholesale'
export type InternalOrderSource = 'cafe' | 'restaurant' | 'front_house' | 'catering' | 'retail' | 'events'
export type InternalOrderStatus = 'requested' | 'approved' | 'in_preparation' | 'ready' | 'delivered' | 'rejected'
export type InternalOrderPriority = 'low' | 'normal' | 'high' | 'urgent'
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded'
export type InventoryUnit = 'kg' | 'g' | 'l' | 'ml' | 'unit' | 'dozen'
export type ProductionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type ProductCategory = 'bread' | 'pastry' | 'cake' | 'cookie' | 'sandwich' | 'beverage' | 'seasonal' | 'custom'
export type ProductStatus = 'active' | 'inactive' | 'seasonal' | 'discontinued'

export interface Customer {
  id: string
  name: string
  email?: string
  phone: string
  address?: string
  notes?: string
  loyaltyPoints?: number
  orderHistory?: Order[]
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  description?: string
  category: ProductCategory
  status: ProductStatus
  basePrice: number
  costOfGoods?: number
  margin?: number
  recipeId?: string
  recipeName?: string
  estimatedPrepTime?: number // minutes
  allergens?: string[]
  tags?: string[]
  imageUrl?: string
  nutritionalInfo?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    sugar?: number
    sodium?: number
  }
  availableSeasons?: string[]
  minimumOrderQuantity?: number
  storageInstructions?: string
  shelfLife?: number // hours
  customizable: boolean
  customizationOptions?: {
    name: string
    type: 'text' | 'select' | 'checkbox'
    options?: string[]
    priceAdjustment?: number
    required?: boolean
  }[]
  popularityScore?: number
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  specialInstructions?: string
  customizations?: Record<string, any>
}

export interface Order {
  id: string
  orderNumber: string
  customerId?: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  source: OrderSource
  status: OrderStatus
  paymentStatus: PaymentStatus
  items: OrderItem[]
  subtotal: number
  tax: number
  discount?: number
  total: number
  pickupTime?: Date
  deliveryTime?: Date
  specialRequests?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface InternalOrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitCost?: number
  specialInstructions?: string
  customizations?: Record<string, any>
}

export interface InternalOrder {
  id: string
  orderNumber: string
  source: InternalOrderSource
  status: InternalOrderStatus
  priority: InternalOrderPriority
  requestedBy: string
  requestedByEmail?: string
  department: string
  items: InternalOrderItem[]
  totalCost?: number
  requestedDate: Date
  neededByDate: Date
  approvedBy?: string
  approvedAt?: Date
  completedAt?: Date
  deliveredAt?: Date
  specialInstructions?: string
  notes?: string
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    nextOrderDate?: Date
    endDate?: Date
  }
  createdAt: Date
  updatedAt: Date
}

export interface InventoryItem {
  id: string
  name: string
  category: 'ingredient' | 'packaging' | 'supplies'
  unit: InventoryUnit
  currentStock: number
  minimumStock: number
  reorderPoint: number
  reorderQuantity: number
  costPerUnit: number
  supplier?: string
  expirationDate?: Date
  location?: string
  lastRestocked?: Date
  notes?: string
}

export interface RecipeIngredient {
  ingredientId: string
  ingredientName: string
  quantity: number
  unit: InventoryUnit
  cost?: number
}

export interface Recipe {
  id: string
  name: string
  category: string
  description?: string
  ingredients: RecipeIngredient[]
  instructions: string[]
  prepTime: number // minutes
  cookTime: number // minutes
  yield: number
  yieldUnit: string
  costPerUnit?: number
  sellingPrice?: number
  margin?: number
  productId?: string // Link to the product this recipe produces
  productName?: string
  nutritionalInfo?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    sugar?: number
    sodium?: number
  }
  allergens?: string[]
  tags?: string[]
  imageUrl?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProductionItem {
  id: string
  recipeId: string
  recipeName: string
  quantity: number
  status: ProductionStatus
  scheduledTime: Date
  completedTime?: Date
  assignedTo?: string
  notes?: string
  batchNumber?: string
  qualityCheck?: boolean
}

export interface ProductionSchedule {
  id: string
  date: Date
  items: ProductionItem[]
  totalItems: number
  completedItems: number
  notes?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ProductionDemand {
  productId: string
  productName: string
  totalQuantity: number
  sources: {
    externalOrders: number
    internalOrders: number
  }
  estimatedPrepTime: number
  priority: 'low' | 'normal' | 'high' | 'urgent'
  dueTime?: Date
  recipeId?: string
  notes?: string
}

export interface DashboardMetrics {
  todayOrders: {
    total: number
    pending: number
    inProduction: number
    ready: number
    delivered: number
    value: number
  }
  revenue: {
    today: number
    week: number
    month: number
    trend: number // percentage change
  }
  inventory: {
    lowStock: InventoryItem[]
    expiringSoon: InventoryItem[]
    totalValue: number
  }
  production: {
    scheduled: number
    completed: number
    efficiency: number // percentage
  }
  topProducts: {
    name: string
    quantity: number
    revenue: number
  }[]
}

export interface POSIntegration {
  provider: 'square' | 'toast' | 'stripe' | 'clover'
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: Date
  settings?: Record<string, any>
}

export interface Supplier {
  id: string
  name: string
  contactPerson?: string
  email?: string
  phone: string
  address?: string
  website?: string
  deliveryDays?: string[]
  minimumOrder?: number
  paymentTerms?: string
  notes?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Alert {
  id: string
  type: 'low_inventory' | 'expiring_soon' | 'order_pending' | 'production_delay' | 'system'
  severity: 'low' | 'medium' | 'high'
  title: string
  message: string
  actionUrl?: string
  read: boolean
  createdAt: Date
}