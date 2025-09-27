import type { Product } from '~/types/bakery'

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
    estimatedPrepTime: 480, // 8 hours including fermentation
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
    recipeName: 'Chocolate Croissant',
    estimatedPrepTime: 240, // 4 hours with proofing
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
    description: 'Made-to-order birthday cake with custom decorations and flavors',
    category: 'cake',
    status: 'active',
    basePrice: 45.00,
    costOfGoods: 12.00,
    margin: 73.3,
    estimatedPrepTime: 180, // 3 hours
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    tags: ['custom', 'celebration', 'decorated'],
    customizable: true,
    customizationOptions: [
      { name: 'Cake Size', type: 'select', options: ['6 inch', '8 inch', '10 inch'], priceAdjustment: 0, required: true },
      { name: 'Flavor', type: 'select', options: ['Vanilla', 'Chocolate', 'Red Velvet', 'Lemon'], required: true },
      { name: 'Custom Message', type: 'text', priceAdjustment: 0 },
      { name: 'Special Decorations', type: 'checkbox', priceAdjustment: 8.00 }
    ],
    minimumOrderQuantity: 1,
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
    tags: ['muffin', 'blueberry', 'breakfast'],
    customizable: false,
    popularityScore: 82,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    name: 'Artisan Sandwich',
    description: 'Fresh sandwich on house-made bread with premium ingredients',
    category: 'sandwich',
    status: 'active',
    basePrice: 12.50,
    costOfGoods: 4.50,
    margin: 64.0,
    estimatedPrepTime: 15,
    allergens: ['Gluten'],
    tags: ['sandwich', 'lunch', 'fresh'],
    customizable: true,
    customizationOptions: [
      { name: 'Bread Type', type: 'select', options: ['Sourdough', 'Whole Wheat', 'Rye'], required: true },
      { name: 'Protein', type: 'select', options: ['Turkey', 'Ham', 'Chicken', 'Veggie'], required: true },
      { name: 'Extra Cheese', type: 'checkbox', priceAdjustment: 1.50 },
      { name: 'Avocado', type: 'checkbox', priceAdjustment: 2.00 }
    ],
    popularityScore: 78,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]