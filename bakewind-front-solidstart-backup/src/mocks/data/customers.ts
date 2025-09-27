import type { Customer } from '~/types/bakery'

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '555-0101',
    address: '123 Oak Street, Downtown',
    notes: 'Prefers whole grain breads. Allergic to nuts.',
    loyaltyPoints: 245,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@techcorp.com',
    phone: '555-0102',
    address: '456 Pine Avenue, Uptown',
    notes: 'Regular customer, orders birthday cakes monthly. Likes extra chocolate.',
    loyaltyPoints: 180,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.r@gmail.com',
    phone: '555-0103',
    address: '789 Maple Drive, Suburbia',
    notes: 'Vegan customer. Always asks about ingredients.',
    loyaltyPoints: 95,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'David Wilson',
    email: 'dwilson@lawfirm.com',
    phone: '555-0104',
    address: '321 Elm Street, Business District',
    notes: 'Corporate orders for office meetings. Usually orders in bulk.',
    loyaltyPoints: 420,
    createdAt: new Date('2023-11-05'),
    updatedAt: new Date()
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    email: 'lisa.thompson@school.edu',
    phone: '555-0105',
    notes: 'Teacher, often orders for school events. Price-sensitive.',
    loyaltyPoints: 65,
    createdAt: new Date('2024-04-12'),
    updatedAt: new Date()
  },
  {
    id: '6',
    name: 'Roberto Garcia',
    phone: '555-0106',
    address: '567 Cedar Lane, Old Town',
    notes: 'Cash customer, no email. Loves sourdough bread.',
    loyaltyPoints: 150,
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date()
  }
]