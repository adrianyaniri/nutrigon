import { pgTable, uuid, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { branches } from './branches.js';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    fullName: varchar('full_name', { length: 150 }).notNull(),
    role: varchar('role', { length: 50 }).notNull(), // 'ADMIN_GENERAL' | 'BRANCH_ADMIN'
    branchId: uuid('branch_id').references(() => branches.id),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_users_email').on(table.email),
    index('idx_users_branch_id').on(table.branchId),
  ],
);

export type UserEntity = typeof users.$inferSelect;
export type NewUserEntity = typeof users.$inferInsert;
