import type { Recipe } from '~/types/bakery'

export const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Classic Sourdough Bread',
    category: 'Breads',
    description: 'Traditional sourdough with a crispy crust and tangy flavor',
    productId: '1',
    productName: 'Classic Sourdough Bread',
    ingredients: [
      { ingredientId: '1', ingredientName: 'Bread Flour', quantity: 500, unit: 'g' },
      { ingredientId: '2', ingredientName: 'Water', quantity: 375, unit: 'ml' },
      { ingredientId: '3', ingredientName: 'Sourdough Starter', quantity: 100, unit: 'g' },
      { ingredientId: '4', ingredientName: 'Salt', quantity: 10, unit: 'g' }
    ],
    instructions: [
      'Mix flour and water, let autolyse for 30 minutes',
      'Add starter and salt, mix until combined',
      'Bulk ferment for 4 hours with folds every 30 minutes',
      'Pre-shape and bench rest for 30 minutes',
      'Final shape and cold proof overnight',
      'Bake at 475°F for 45 minutes'
    ],
    prepTime: 30,
    cookTime: 45,
    yield: 1,
    yieldUnit: 'loaf',
    costPerUnit: 3.50,
    sellingPrice: 8.50,
    margin: 58.8,
    allergens: ['Gluten'],
    tags: ['sourdough', 'artisan', 'overnight'],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Chocolate Croissant',
    category: 'Pastries',
    description: 'Buttery, flaky croissant filled with dark chocolate',
    productId: '2',
    productName: 'Chocolate Croissant',
    ingredients: [
      { ingredientId: '5', ingredientName: 'Croissant Dough', quantity: 100, unit: 'g' },
      { ingredientId: '6', ingredientName: 'Dark Chocolate', quantity: 20, unit: 'g' }
    ],
    instructions: [
      'Roll out croissant dough to 3mm thickness',
      'Cut into triangles',
      'Place chocolate at the base of each triangle',
      'Roll tightly from base to tip',
      'Proof for 2 hours at room temperature',
      'Brush with egg wash',
      'Bake at 375°F for 18-20 minutes'
    ],
    prepTime: 180,
    cookTime: 20,
    yield: 12,
    yieldUnit: 'pieces',
    costPerUnit: 1.20,
    sellingPrice: 4.50,
    margin: 73.3,
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    tags: ['french', 'chocolate', 'breakfast'],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]