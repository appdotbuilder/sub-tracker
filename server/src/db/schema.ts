
import { serial, text, pgTable, timestamp, numeric, boolean, pgEnum } from 'drizzle-orm/pg-core';

// Define billing cycle enum
export const billingCycleEnum = pgEnum('billing_cycle', ['monthly', 'yearly', 'weekly', 'daily']);

export const subscriptionsTable = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  billing_cycle: billingCycleEnum('billing_cycle').notNull(),
  next_due_date: timestamp('next_due_date').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Subscription = typeof subscriptionsTable.$inferSelect;
export type NewSubscription = typeof subscriptionsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { subscriptions: subscriptionsTable };
