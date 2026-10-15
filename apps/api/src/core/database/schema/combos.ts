import { pgTable, uuid, varchar, text, numeric, boolean, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { branches } from './branches.js';
import { products } from './products.js';

export const combos = pgTable('combos', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  imageUrls: text('image_urls')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const comboItems = pgTable(
  'combo_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    comboId: uuid('combo_id')
      .notNull()
      .references(() => combos.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull(),
  },
  (table) => [
    index('idx_combo_items_combo_id').on(table.comboId),
    index('idx_combo_items_product_id').on(table.productId),
  ],
);

export const branchCombos = pgTable(
  'branch_combos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),
    comboId: uuid('combo_id')
      .notNull()
      .references(() => combos.id, { onDelete: 'cascade' }),
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    isAvailable: boolean('is_available').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_branch_combos_unique').on(table.branchId, table.comboId),
    index('idx_branch_combos_branch_id').on(table.branchId),
    index('idx_branch_combos_combo_id').on(table.comboId),
  ],
);

export type ComboEntity = typeof combos.$inferSelect;
export type NewComboEntity = typeof combos.$inferInsert;
export type ComboItemEntity = typeof comboItems.$inferSelect;
export type NewComboItemEntity = typeof comboItems.$inferInsert;
export type BranchComboEntity = typeof branchCombos.$inferSelect;
export type NewBranchComboEntity = typeof branchCombos.$inferInsert;
