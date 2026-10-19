import { relations } from 'drizzle-orm';
import { branches } from './branches.js';
import { categories } from './categories.js';
import { products } from './products.js';
import { branchProducts } from './branch-products.js';
import { combos, comboItems, branchCombos } from './combos.js';
import { users } from './users.js';

export * from './branches.js';
export * from './categories.js';
export * from './products.js';
export * from './branch-products.js';
export * from './combos.js';
export * from './users.js';

// Drizzle Relations
export const branchesRelations = relations(branches, ({ many }) => ({
  branchProducts: many(branchProducts),
  branchCombos: many(branchCombos),
  users: many(users),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  branchProducts: many(branchProducts),
  comboItems: many(comboItems),
}));

export const branchProductsRelations = relations(branchProducts, ({ one }) => ({
  branch: one(branches, {
    fields: [branchProducts.branchId],
    references: [branches.id],
  }),
  product: one(products, {
    fields: [branchProducts.productId],
    references: [products.id],
  }),
}));

export const combosRelations = relations(combos, ({ many }) => ({
  items: many(comboItems),
  branchCombos: many(branchCombos),
}));

export const comboItemsRelations = relations(comboItems, ({ one }) => ({
  combo: one(combos, {
    fields: [comboItems.comboId],
    references: [combos.id],
  }),
  product: one(products, {
    fields: [comboItems.productId],
    references: [products.id],
  }),
}));

export const branchCombosRelations = relations(branchCombos, ({ one }) => ({
  branch: one(branches, {
    fields: [branchCombos.branchId],
    references: [branches.id],
  }),
  combo: one(combos, {
    fields: [branchCombos.comboId],
    references: [combos.id],
  }),
}));

export const usersRelations = relations(users, ({ one }) => ({
  branch: one(branches, {
    fields: [users.branchId],
    references: [branches.id],
  }),
}));
