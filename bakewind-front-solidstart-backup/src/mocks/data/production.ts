import type { ProductionItem, ProductionSchedule } from '~/types/bakery'

const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

export const mockProductionItems: ProductionItem[] = [
  {
    id: '1',
    recipeId: '1',
    recipeName: 'Classic Sourdough Bread',
    quantity: 12,
    status: 'completed',
    scheduledTime: new Date(today.setHours(6, 0, 0, 0)),
    completedTime: new Date(today.setHours(8, 30, 0, 0)),
    assignedTo: 'Sarah',
    batchNumber: 'SB-001',
    qualityCheck: true
  },
  {
    id: '2',
    recipeId: '2',
    recipeName: 'Chocolate Croissant',
    quantity: 24,
    status: 'in_progress',
    scheduledTime: new Date(today.setHours(7, 0, 0, 0)),
    assignedTo: 'Mike',
    batchNumber: 'CC-001',
    notes: 'Extra chocolate requested'
  },
  {
    id: '3',
    recipeId: '1',
    recipeName: 'Classic Sourdough Bread',
    quantity: 8,
    status: 'scheduled',
    scheduledTime: new Date(today.setHours(14, 0, 0, 0)),
    assignedTo: 'Sarah',
    batchNumber: 'SB-002'
  },
  {
    id: '4',
    recipeId: '2',
    recipeName: 'Chocolate Croissant',
    quantity: 36,
    status: 'scheduled',
    scheduledTime: new Date(today.setHours(15, 0, 0, 0)),
    assignedTo: 'Mike',
    batchNumber: 'CC-002'
  }
]

export const mockProductionSchedules: ProductionSchedule[] = [
  {
    id: '1',
    date: today,
    items: mockProductionItems,
    totalItems: mockProductionItems.length,
    completedItems: mockProductionItems.filter(item => item.status === 'completed').length,
    notes: 'Regular production day',
    createdBy: 'Admin',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]