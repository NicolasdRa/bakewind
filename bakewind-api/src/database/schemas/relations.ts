import { relations } from 'drizzle-orm';
import { customers } from './customers.schema';
import { orders, orderItems } from './orders.schema';
import { internalOrders, internalOrderItems } from './internal-orders.schema';
import { products } from './products.schema';
import { recipes, recipeIngredients } from './recipes.schema';
import { inventoryItems } from './inventory.schema';
import { productionSchedules, productionItems } from './production.schema';
import { usersTable } from './users.schema';
import { locationsTable, userLocationsTable } from './locations.schema';

// Customer relations
export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

// Order relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// Internal Order relations
export const internalOrdersRelations = relations(
  internalOrders,
  ({ many }) => ({
    items: many(internalOrderItems),
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
  orderItems: many(orderItems),
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
export const userLocationsRelations = relations(userLocationsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userLocationsTable.userId],
    references: [usersTable.id],
  }),
  location: one(locationsTable, {
    fields: [userLocationsTable.locationId],
    references: [locationsTable.id],
  }),
}));
