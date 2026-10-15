import { pgTable, uuid, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { categories } from './categories.js';

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
    code: varchar('code', { length: 50 }),
    barcode: varchar('barcode', { length: 50 }),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    saleUnit: varchar('sale_unit', { length: 20 }).notNull(), // 'UNIT' | 'WEIGHT'
    imageUrls: text('image_urls')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_products_category_id').on(table.categoryId),
    index('idx_products_code').on(table.code),
    index('idx_products_barcode').on(table.barcode),
  ],
);

export type ProductEntity = typeof products.$inferSelect;
export type NewProductEntity = typeof products.$inferInsert;
