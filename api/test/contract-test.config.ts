import { DatabaseModule } from '../src/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../src/auth/auth.module';

export const contractTestConfig = {
  // Test database configuration
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5433'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'bakewind_secure_password_2025',
    database: `${process.env.DATABASE_NAME || 'bakewind_db'}_test`,
  },

  // Test-specific environment variables
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'test-jwt-secret-for-contract-tests',
    JWT_REFRESH_SECRET: 'test-refresh-secret-for-contract-tests',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    BCRYPT_ROUNDS: '4', // Lower rounds for faster tests
    STRIPE_SECRET_KEY: 'sk_test_contract_test_key',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_contract_test_key',
    STRIPE_WEBHOOK_SECRET: 'whsec_contract_test_secret',
    TRIAL_LENGTH_DAYS: '14',
    DEFAULT_TRIAL_PLAN: 'starter',
    FRONTEND_URL: 'http://localhost:3001',
    CORS_ORIGIN: 'http://localhost:3001',
    RATE_LIMIT_TTL: '60',
    RATE_LIMIT_MAX: '1000', // Higher limit for tests
  },

  // Test data seeds
  testData: {
    subscriptionPlans: [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Starter',
        description: 'Perfect for small bakeries',
        priceMonthlyUsd: 4900,
        priceAnnualUsd: 47040,
        maxLocations: 1,
        maxUsers: 3,
        features: ['basic_orders', 'inventory_tracking'],
        isPopular: false,
        sortOrder: 1,
        isActive: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Professional',
        description: 'Ideal for growing bakeries',
        priceMonthlyUsd: 14900,
        priceAnnualUsd: 143040,
        maxLocations: 3,
        maxUsers: 10,
        features: ['advanced_analytics', 'multi_location', 'staff_management'],
        isPopular: true,
        sortOrder: 2,
        isActive: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Enterprise',
        description: 'For large bakery chains',
        priceMonthlyUsd: 29900,
        priceAnnualUsd: 287040,
        maxLocations: null,
        maxUsers: null,
        features: ['custom_integrations', 'priority_support', 'advanced_reporting'],
        isPopular: false,
        sortOrder: 3,
        isActive: true,
      },
    ],

    softwareFeatures: [
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        name: 'Order Management',
        description: 'Track customer orders and delivery schedules in real-time',
        iconName: 'orders',
        category: 'orders',
        availableInPlans: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
        demoUrl: 'https://demo.bakewind.com/orders',
        isHighlighted: true,
        sortOrder: 1,
        isActive: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        name: 'Inventory Tracking',
        description: 'Monitor ingredient levels and automate reorder alerts',
        iconName: 'inventory',
        category: 'inventory',
        availableInPlans: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'],
        demoUrl: 'https://demo.bakewind.com/inventory',
        isHighlighted: false,
        sortOrder: 2,
        isActive: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        name: 'Production Scheduling',
        description: 'Plan and optimize baking schedules for maximum efficiency',
        iconName: 'production',
        category: 'production',
        availableInPlans: ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'],
        demoUrl: 'https://demo.bakewind.com/production',
        isHighlighted: true,
        sortOrder: 3,
        isActive: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440014',
        name: 'Advanced Analytics',
        description: 'Comprehensive business insights and performance metrics',
        iconName: 'analytics',
        category: 'analytics',
        availableInPlans: ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'],
        demoUrl: 'https://demo.bakewind.com/analytics',
        isHighlighted: false,
        sortOrder: 4,
        isActive: true,
      },
    ],

    products: [
      {
        id: '550e8400-e29b-41d4-a716-446655440021',
        name: 'Chocolate Cake',
        description: 'Rich, moist chocolate cake with dark chocolate frosting',
        basePrice: '25.00',
        category: 'cake',
        status: 'active',
        costOfGoods: '12.50',
        allergens: ['gluten', 'eggs', 'dairy'],
        nutritionalInfo: {
          calories: 350,
          fat: 15,
          carbs: 45,
          protein: 6,
        },
        customizable: true,
        customizationOptions: [
          { name: 'size', type: 'select', options: ['small', 'medium', 'large'], priceAdjustment: 0, required: true },
          { name: 'frosting_flavor', type: 'select', options: ['chocolate', 'vanilla', 'strawberry'], priceAdjustment: 0, required: false },
          { name: 'decorations', type: 'text', priceAdjustment: 5, required: false }
        ],
        estimatedPrepTime: 120,
        shelfLife: 72
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440022',
        name: 'Vanilla Cupcakes',
        description: 'Classic vanilla cupcakes with buttercream frosting',
        basePrice: '3.00',
        category: 'cake',
        status: 'active',
        costOfGoods: '1.50',
        allergens: ['gluten', 'eggs', 'dairy'],
        nutritionalInfo: {
          calories: 280,
          fat: 12,
          carbs: 38,
          protein: 4,
        },
        customizable: true,
        customizationOptions: [
          { name: 'frosting_color', type: 'select', options: ['white', 'pink', 'blue', 'yellow'], priceAdjustment: 0, required: false },
          { name: 'sprinkles', type: 'checkbox', priceAdjustment: 0.50, required: false }
        ],
        estimatedPrepTime: 45,
        shelfLife: 48
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440023',
        name: 'Artisan Sourdough Bread',
        description: 'Traditional sourdough bread with crispy crust',
        basePrice: '8.00',
        category: 'bread',
        status: 'active',
        costOfGoods: '3.00',
        allergens: ['gluten'],
        nutritionalInfo: {
          calories: 150,
          fat: 1,
          carbs: 30,
          protein: 5,
        },
        customizable: true,
        customizationOptions: [
          { name: 'size', type: 'select', options: ['half', 'full'], priceAdjustment: 0, required: true },
          { name: 'slicing', type: 'checkbox', priceAdjustment: 0, required: false }
        ],
        estimatedPrepTime: 480,
        shelfLife: 120
      },
    ],
  },

  // Test utilities
  utils: {
    generateTestEmail: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
    generateTestPhone: () => `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    generateTestBusinessName: () => `Test Bakery ${Math.floor(Math.random() * 1000)}`,

    // Password validation helper
    generateValidPassword: () => 'TestPassword123!',

    // UUID validation helper
    isValidUUID: (uuid: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(uuid);
    },

    // Date validation helper
    isValidISODate: (dateString: string) => {
      const date = new Date(dateString);
      return date instanceof Date && !isNaN(date.getTime()) && dateString === date.toISOString();
    },

    // Price validation helper (cents)
    isValidPrice: (price: number) => {
      return typeof price === 'number' && price >= 0 && Number.isInteger(price);
    },

    // Sleep utility for test delays
    sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  },

  // Test expectations
  expectations: {
    // API response time thresholds (ms)
    responseTime: {
      fast: 100,
      normal: 500,
      slow: 2000,
    },

    // Pagination defaults
    pagination: {
      defaultLimit: 20,
      maxLimit: 100,
      defaultPage: 1,
    },

    // Authentication token formats
    tokenFormats: {
      accessToken: /^[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*$/,
      refreshToken: /^[A-Za-z0-9\-_]{20,}$/,
    },
  },
};

export default contractTestConfig;