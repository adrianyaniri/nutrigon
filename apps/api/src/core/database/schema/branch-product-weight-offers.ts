import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  integer,
  numeric,
  timestamp,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { branchProducts } from './branch-products.js';

export const branchProductWeightOffers = pgTable(
  'branch_product_weight_offers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    branchProductId: uuid('branch_product_id')
      .notNull()
      .references(() => branchProducts.id, { onDelete: 'cascade' }),
    weightGrams: integer('weight_grams').notNull(),
    promotionalPrice: numeric('promotional_price', {
      precision: 12,
      scale: 2,
    }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'branch_product_weight_offers_values_check',
      sql`${table.weightGrams} > 0 AND ${table.promotionalPrice} > 0`,
    ),
    uniqueIndex('idx_branch_product_weight_offers_unique').on(
      table.branchProductId,
      table.weightGrams,
    ),
    index('idx_branch_product_weight_offers_branch_product_id').on(
      table.branchProductId,
    ),
  ],
);

export type BranchProductWeightOfferEntity =
  typeof branchProductWeightOffers.$inferSelect;
export type NewBranchProductWeightOfferEntity =
  typeof branchProductWeightOffers.$inferInsert;
