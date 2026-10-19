import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  address: varchar('address', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  whatsappNumber: varchar('whatsapp_number', { length: 50 }),
  openingHours: varchar('opening_hours', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type BranchEntity = typeof branches.$inferSelect;
export type NewBranchEntity = typeof branches.$inferInsert;
