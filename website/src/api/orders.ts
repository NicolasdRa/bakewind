// Orders API - Mock implementation until API endpoints are available

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    instructions?: string;
  };
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  paymentMethod: 'card' | 'cash';
  specialInstructions?: string;
  estimatedReady?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    instructions?: string;
  };
  paymentMethod: 'card' | 'cash';
  specialInstructions?: string;
  preferredDate: string;
  preferredTime: string;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Mock data for demonstration
const mockOrders: Order[] = [
  {
    id: `BW${Date.now().toString().slice(-6)}`,
    customerId: 'customer_123',
    items: [
      {
        id: 'item_1',
        productId: '1',
        name: 'Artisan Sourdough Bread',
        price: 4.50,
        quantity: 1,
        subtotal: 4.50,
      },
      {
        id: 'item_2',
        productId: '2',
        name: 'Butter Croissants (6-pack)',
        price: 12.00,
        quantity: 1,
        subtotal: 12.00,
      },
    ],
    subtotal: 16.50,
    tax: 1.32,
    total: 17.82,
    status: 'pending',
    deliveryType: 'pickup',
    customerInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
    },
    paymentMethod: 'card',
    estimatedReady: '45 minutes',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock API functions
export const ordersApi = {
  // Create a new order
  createOrder: async (orderData: CreateOrderRequest): Promise<Order> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Calculate totals (this would be done server-side)
    const subtotal = orderData.items.reduce((sum, item) => {
      // In real implementation, we'd fetch product prices from the server
      const mockPrice = 10; // Placeholder
      return sum + (mockPrice * item.quantity);
    }, 0);

    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;

    const newOrder: Order = {
      id: `BW${Date.now().toString().slice(-6)}`,
      customerId: 'customer_123', // Would come from auth context
      items: orderData.items.map((item, index) => ({
        id: `item_${index + 1}`,
        productId: item.productId,
        name: `Product ${item.productId}`, // Would be fetched from products
        price: 10, // Placeholder
        quantity: item.quantity,
        subtotal: 10 * item.quantity,
      })),
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
      status: 'pending',
      deliveryType: orderData.deliveryType,
      deliveryAddress: orderData.deliveryAddress,
      customerInfo: orderData.customerInfo,
      paymentMethod: orderData.paymentMethod,
      specialInstructions: orderData.specialInstructions,
      estimatedReady: '30-45 minutes',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to mock orders list
    mockOrders.unshift(newOrder);

    return newOrder;
  },

  // Get orders for current customer
  getOrders: async (page: number = 1, limit: number = 10): Promise<OrdersResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = mockOrders.slice(startIndex, endIndex);

    return {
      orders: paginatedOrders,
      total: mockOrders.length,
      page,
      limit,
      hasMore: endIndex < mockOrders.length,
    };
  },

  // Get single order by ID
  getOrder: async (id: string): Promise<Order | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return mockOrders.find(order => order.id === id) || null;
  },

  // Cancel an order
  cancelOrder: async (id: string): Promise<Order | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const orderIndex = mockOrders.findIndex(order => order.id === id);
    if (orderIndex === -1) return null;

    const order = mockOrders[orderIndex];
    if (order.status === 'pending' || order.status === 'confirmed') {
      order.status = 'cancelled';
      order.updatedAt = new Date().toISOString();
      return order;
    }

    throw new Error('Order cannot be cancelled at this stage');
  },

  // Track order status
  trackOrder: async (id: string): Promise<{
    order: Order;
    timeline: Array<{
      status: string;
      timestamp: string;
      description: string;
    }>;
  } | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const order = mockOrders.find(o => o.id === id);
    if (!order) return null;

    // Mock timeline
    const timeline = [
      {
        status: 'pending',
        timestamp: order.createdAt,
        description: 'Order placed and payment confirmed',
      },
    ];

    if (order.status !== 'pending') {
      timeline.push({
        status: 'confirmed',
        timestamp: order.updatedAt,
        description: 'Order confirmed and sent to kitchen',
      });
    }

    return {
      order,
      timeline,
    };
  },

  // Reorder previous order
  reorder: async (orderId: string): Promise<Order> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const originalOrder = mockOrders.find(order => order.id === orderId);
    if (!originalOrder) {
      throw new Error('Original order not found');
    }

    // Create new order based on original
    const reorderData: CreateOrderRequest = {
      items: originalOrder.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      customerInfo: originalOrder.customerInfo,
      deliveryType: originalOrder.deliveryType,
      deliveryAddress: originalOrder.deliveryAddress,
      paymentMethod: originalOrder.paymentMethod,
      specialInstructions: originalOrder.specialInstructions,
      preferredDate: new Date().toISOString().split('T')[0],
      preferredTime: '12:00',
    };

    return ordersApi.createOrder(reorderData);
  },
};