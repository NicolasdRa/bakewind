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
import { saasUsersTable } from './saas-users';
import { subscriptionPlansTable } from './subscription-plans.schema';
import { trialAccountsTable } from './trial-accounts.schema';
import { userSessionsTable } from './user-sessions.schema';

// Customer relations
export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(customerOrders),
}));

// Customer Order relations
export const customerOrdersRelations = relations(customerOrders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [customerOrders.customerId],
    references: [customers.id],
  }),
  items: many(customerOrderItems),
}));

export const customerOrderItemsRelations = relations(customerOrderItems, ({ one }) => ({
  order: one(customerOrders, {
    fields: [customerOrderItems.orderId],
    references: [customerOrders.id],
  }),
  product: one(products, {
    fields: [customerOrderItems.productId],
    references: [products.id],
  }),
}));

// Internal Order relations
export const internalOrdersRelations = relations(
  internalOrders,
  ({ many }) => ({
    items: many(internalOrderItems),
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

// Product relations
export const productsRelations = relations(products, ({ one, many }) => ({
  recipe: one(recipes, {
    fields: [products.recipeId],
    references: [recipes.id],
  }),
  customerOrderItems: many(customerOrderItems),
  internalOrderItems: many(internalOrderItems),
}));

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

// Inventory relations
export const inventoryItemsRelations = relations(
  inventoryItems,
  ({ many }) => ({
    recipeIngredients: many(recipeIngredients),
  }),
);

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

// User relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  userLocations: many(userLocationsTable),
}));

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

// SaaS User relations
export const saasUsersRelations = relations(
  saasUsersTable,
  ({ one, many }) => ({
    subscriptionPlan: one(subscriptionPlansTable, {
      fields: [saasUsersTable.subscriptionPlanId],
      references: [subscriptionPlansTable.id],
    }),
    trialAccount: one(trialAccountsTable, {
      fields: [saasUsersTable.trialAccountId],
      references: [trialAccountsTable.id],
    }),
    userSessions: many(userSessionsTable),
  }),
);

// Subscription Plan relations
export const subscriptionPlansRelations = relations(
  subscriptionPlansTable,
  ({ many }) => ({
    saasUsers: many(saasUsersTable),
    convertedTrials: many(trialAccountsTable),
  }),
);

// Trial Account relations
export const trialAccountsRelations = relations(
  trialAccountsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [trialAccountsTable.userId],
      references: [usersTable.id],
    }),
    convertedToPlan: one(subscriptionPlansTable, {
      fields: [trialAccountsTable.convertedToPlanId],
      references: [subscriptionPlansTable.id],
    }),
    saasUser: one(saasUsersTable, {
      fields: [trialAccountsTable.id],
      references: [saasUsersTable.trialAccountId],
    }),
  }),
);

// User Session relations
export const userSessionsRelations = relations(
  userSessionsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [userSessionsTable.userId],
      references: [usersTable.id],
    }),
    saasUser: one(saasUsersTable, {
      fields: [userSessionsTable.userId],
      references: [saasUsersTable.id],
    }),
  }),
);
