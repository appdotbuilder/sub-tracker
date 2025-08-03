
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { type CreateSubscriptionInput, type Subscription } from '../schema';

export const createSubscription = async (input: CreateSubscriptionInput): Promise<Subscription> => {
  try {
    // Insert subscription record
    const result = await db.insert(subscriptionsTable)
      .values({
        name: input.name,
        description: input.description,
        price: input.price.toString(), // Convert number to string for numeric column
        billing_cycle: input.billing_cycle,
        next_due_date: input.next_due_date,
        is_active: true // Default to active as per schema
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const subscription = result[0];
    return {
      ...subscription,
      price: parseFloat(subscription.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Subscription creation failed:', error);
    throw error;
  }
};
