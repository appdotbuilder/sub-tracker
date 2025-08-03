
import { z } from 'zod';

// Subscription schema
export const subscriptionSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  billing_cycle: z.enum(['monthly', 'yearly', 'weekly', 'daily']),
  next_due_date: z.coerce.date(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Subscription = z.infer<typeof subscriptionSchema>;

// Input schema for creating subscriptions
export const createSubscriptionInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable(),
  price: z.number().positive('Price must be positive'),
  billing_cycle: z.enum(['monthly', 'yearly', 'weekly', 'daily']),
  next_due_date: z.coerce.date()
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionInputSchema>;

// Input schema for updating subscriptions
export const updateSubscriptionInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive('Price must be positive').optional(),
  billing_cycle: z.enum(['monthly', 'yearly', 'weekly', 'daily']).optional(),
  next_due_date: z.coerce.date().optional(),
  is_active: z.boolean().optional()
});

export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionInputSchema>;

// Input schema for getting subscription by ID
export const getSubscriptionInputSchema = z.object({
  id: z.number()
});

export type GetSubscriptionInput = z.infer<typeof getSubscriptionInputSchema>;

// Input schema for deleting subscription
export const deleteSubscriptionInputSchema = z.object({
  id: z.number()
});

export type DeleteSubscriptionInput = z.infer<typeof deleteSubscriptionInputSchema>;

// Response schema for spending summary
export const spendingSummarySchema = z.object({
  total_monthly: z.number(),
  total_yearly: z.number(),
  active_subscriptions_count: z.number(),
  upcoming_due_count: z.number()
});

export type SpendingSummary = z.infer<typeof spendingSummarySchema>;
