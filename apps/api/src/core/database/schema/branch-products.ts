import { pgTable, uuid, numeric, boolean, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { branches } from './branches.js';
import { products } from './products.js';

export const branchProducts = pgTable(
  'branch_products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    promotionalPrice: numeric('promotional_price', { precision: 12, scale: 2 }),
    isOnSale: boolean('is_on_sale').notNull().default(false),
    isAvailable: boolean('is_available').notNull().default(false),
    isFeatured: boolean('is_featured').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_branch_products_unique').on(table.branchId, table.productId),
    index('idx_branch_products_branch_id').on(table.branchId),
    index('idx_branch_products_product_id').on(table.productId),
    index('idx_branch_products_is_featured').on(table.branchId, table.isFeatured),
  ],
);

export type BranchProductEntity = typeof branchProducts.$inferSelect;
export type NewBranchProductEntity = typeof branchProducts.$inferInsert;
