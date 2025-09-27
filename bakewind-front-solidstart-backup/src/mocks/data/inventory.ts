import type { InventoryItem } from '~/types/bakery'

export const mockInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'All-Purpose Flour',
    category: 'ingredient',
    unit: 'kg',
    currentStock: 45,
    minimumStock: 20,
    reorderPoint: 30,
    reorderQuantity: 50,
    costPerUnit: 2.50,
    supplier: 'Valley Mills',
    location: 'Dry Storage A'
  },
  {
    id: '2',
    name: 'Unsalted Butter',
    category: 'ingredient',
    unit: 'kg',
    currentStock: 12,
    minimumStock: 10,
    reorderPoint: 15,
    reorderQuantity: 20,
    costPerUnit: 8.00,
    supplier: 'Dairy Fresh Co',
    location: 'Walk-in Cooler',
    expirationDate: new Date(Date.now() + 604800000) // 7 days
  },
  {
    id: '3',
    name: 'Vanilla Extract',
    category: 'ingredient',
    unit: 'l',
    currentStock: 2.5,
    minimumStock: 1,
    reorderPoint: 1.5,
    reorderQuantity: 3,
    costPerUnit: 45.00,
    supplier: 'Gourmet Supplies'
  }
]