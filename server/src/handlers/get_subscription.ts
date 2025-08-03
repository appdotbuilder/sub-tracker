
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetSubscriptionInput, type Subscription } from '../schema';

export const getSubscription = async (input: GetSubscriptionInput): Promise<Subscription | null> => {
  try {
    // Query subscription by ID
    const result = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, input.id))
      .execute();

    // Return null if no subscription found
    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const subscription = result[0];
    return {
      ...subscription,
      price: parseFloat(subscription.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Get subscription failed:', error);
    throw error;
  }
};
