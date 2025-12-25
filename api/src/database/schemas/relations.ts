import { relations } from 'drizzle-orm';
import { customers } from './customers.schema';
import { customerOrders, customerOrderItems } from './orders.schema';
import { internalOrders, internalOrderItems } from './internal-orders.schema';
import { products } from './products.schema';
import { recipes, recipeIngredients } from './recipes.schema';
import { inventoryItems } from './inventory.schema';
import { productionSchedules, productionItems } from './production.schema';
import { usersTable } from './users.schema';
import { locationsTable, userLocationsTable } from './locations.schema';
import { subscriptionPlansTable } from './subscription-plans.schema';
import { userSessionsTable } from './user-sessions.schema';
import { tenantsTable } from './tenants.schema';
import { staffTable } from './staff.schema';

// ==================== TENANT RELATIONS ====================

// Tenant relations (bakery business)
export const tenantsRelations = relations(tenantsTable, ({ one, many }) => ({
  // Owner of the bakery business
  owner: one(usersTable, {
    fields: [tenantsTable.ownerUserId],
    references: [usersTable.id],
  }),
  // Subscription plan
  subscriptionPlan: one(subscriptionPlansTable, {
    fields: [tenantsTable.subscriptionPlanId],
    references: [subscriptionPlansTable.id],
  }),
  // Staff members working for this tenant
  staff: many(staffTable),
  // Customers of this bakery
  customers: many(customers),
  // Internal orders for this tenant
  internalOrders: many(internalOrders),
}));

// ==================== STAFF RELATIONS ====================

// Staff relations (bakery employees)
export const staffRelations = relations(staffTable, ({ one, many }) => ({
  // The user account for this staff member
  user: one(usersTable, {
    fields: [staffTable.userId],
    references: [usersTable.id],
  }),
  // The tenant (bakery) they work for
  tenant: one(tenantsTable, {
    fields: [staffTable.tenantId],
    references: [tenantsTable.id],
  }),
  // Internal orders requested by this staff member
  requestedOrders: many(internalOrders, { relationName: 'requestedBy' }),
  // Internal orders approved by this staff member
  approvedOrders: many(internalOrders, { relationName: 'approvedBy' }),
  // Internal orders assigned to this staff member
  assignedOrders: many(internalOrders, { relationName: 'assignedTo' }),
}));

// ==================== USER RELATIONS ====================

// User relations (auth/identity)
export const usersRelations = relations(usersTable, ({ one, many }) => ({
  // User-location assignments
  userLocations: many(userLocationsTable),
  // Staff profile (if user is STAFF role)
  staff: one(staffTable, {
    fields: [usersTable.id],
    references: [staffTable.userId],
  }),
  // Tenant owned by this user (if user is OWNER role)
  ownedTenant: one(tenantsTable, {
    fields: [usersTable.id],
    references: [tenantsTable.ownerUserId],
  }),
  // Customer profile with portal access (if user is CUSTOMER role)
  customerProfile: one(customers, {
    fields: [usersTable.id],
    references: [customers.authUserId],
  }),
  // User sessions
  sessions: many(userSessionsTable),
}));

// ==================== CUSTOMER RELATIONS ====================

// Customer relations (bakery's B2B/B2C clients)
export const customersRelations = relations(customers, ({ one, many }) => ({
  // The tenant (bakery) this customer belongs to
  tenant: one(tenantsTable, {
    fields: [customers.tenantId],
    references: [tenantsTable.id],
  }),
  // Optional auth user (for customer portal access)
  authUser: one(usersTable, {
    fields: [customers.authUserId],
    references: [usersTable.id],
  }),
  // Subscription plan for recurring orders
  subscriptionPlan: one(subscriptionPlansTable, {
    fields: [customers.subscriptionPlanId],
    references: [subscriptionPlansTable.id],
  }),
  // Customer orders
  orders: many(customerOrders),
}));

// ==================== ORDER RELATIONS ====================

// Customer Order relations
export const customerOrdersRelations = relations(
  customerOrders,
  ({ one, many }) => ({
    customer: one(customers, {
      fields: [customerOrders.customerId],
      references: [customers.id],
    }),
    items: many(customerOrderItems),
  }),
);

export const customerOrderItemsRelations = relations(
  customerOrderItems,
  ({ one }) => ({
    order: one(customerOrders, {
      fields: [customerOrderItems.orderId],
      references: [customerOrders.id],
    }),
    product: one(products, {
      fields: [customerOrderItems.productId],
      references: [products.id],
    }),
  }),
);

// Internal Order relations
export const internalOrdersRelations = relations(
  internalOrders,
  ({ one, many }) => ({
    // Tenant this order belongs to
    tenant: one(tenantsTable, {
      fields: [internalOrders.tenantId],
      references: [tenantsTable.id],
    }),
    // Staff member who requested the order
    requestedByStaff: one(staffTable, {
      fields: [internalOrders.requestedByStaffId],
      references: [staffTable.id],
      relationName: 'requestedBy',
    }),
    // Staff member who approved the order
    approvedByStaff: one(staffTable, {
      fields: [internalOrders.approvedByStaffId],
      references: [staffTable.id],
      relationName: 'approvedBy',
    }),
    // Staff member assigned to the order
    assignedStaff: one(staffTable, {
      fields: [internalOrders.assignedStaffId],
      references: [staffTable.id],
      relationName: 'assignedTo',
    }),
    // Order items
    items: many(internalOrderItems),
    // Production items
    productionItems: many(productionItems),
  }),
);

export const internalOrderItemsRelations = relations(
  internalOrderItems,
  ({ one }) => ({
    internalOrder: one(internalOrders, {
      fields: [internalOrderItems.internalOrderId],
      references: [internalOrders.id],
    }),
    product: one(products, {
      fields: [internalOrderItems.productId],
      references: [products.id],
    }),
  }),
);

// ==================== PRODUCT RELATIONS ====================

// Product relations
export const productsRelations = relations(products, ({ one, many }) => ({
  recipe: one(recipes, {
    fields: [products.recipeId],
    references: [recipes.id],
  }),
  customerOrderItems: many(customerOrderItems),
  internalOrderItems: many(internalOrderItems),
}));

// ==================== RECIPE RELATIONS ====================

// Recipe relations
export const recipesRelations = relations(recipes, ({ one, many }) => ({
  product: one(products, {
    fields: [recipes.productId],
    references: [products.id],
  }),
  ingredients: many(recipeIngredients),
  productionItems: many(productionItems),
}));

export const recipeIngredientsRelations = relations(
  recipeIngredients,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeIngredients.recipeId],
      references: [recipes.id],
    }),
    inventoryItem: one(inventoryItems, {
      fields: [recipeIngredients.ingredientId],
      references: [inventoryItems.id],
    }),
  }),
);

// ==================== INVENTORY RELATIONS ====================

// Inventory relations
export const inventoryItemsRelations = relations(
  inventoryItems,
  ({ many }) => ({
    recipeIngredients: many(recipeIngredients),
  }),
);

// ==================== PRODUCTION RELATIONS ====================

// Production relations
export const productionSchedulesRelations = relations(
  productionSchedules,
  ({ many }) => ({
    items: many(productionItems),
  }),
);

export const productionItemsRelations = relations(
  productionItems,
  ({ one }) => ({
    schedule: one(productionSchedules, {
      fields: [productionItems.scheduleId],
      references: [productionSchedules.id],
    }),
    internalOrder: one(internalOrders, {
      fields: [productionItems.internalOrderId],
      references: [internalOrders.id],
    }),
    recipe: one(recipes, {
      fields: [productionItems.recipeId],
      references: [recipes.id],
    }),
  }),
);

// ==================== LOCATION RELATIONS ====================

// Location relations
export const locationsRelations = relations(locationsTable, ({ many }) => ({
  userLocations: many(userLocationsTable),
}));

// User-Location junction table relations
export const userLocationsRelations = relations(
  userLocationsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [userLocationsTable.userId],
      references: [usersTable.id],
    }),
    location: one(locationsTable, {
      fields: [userLocationsTable.locationId],
      references: [locationsTable.id],
    }),
  }),
);

// ==================== SUBSCRIPTION RELATIONS ====================

// Subscription Plan relations
export const subscriptionPlansRelations = relations(
  subscriptionPlansTable,
  ({ many }) => ({
    // Tenants subscribed to this plan
    tenants: many(tenantsTable),
    // Customers with recurring subscriptions on this plan
    customers: many(customers),
  }),
);

// ==================== SESSION RELATIONS ====================

// User Session relations
export const userSessionsRelations = relations(
  userSessionsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [userSessionsTable.userId],
      references: [usersTable.id],
    }),
  }),
);
