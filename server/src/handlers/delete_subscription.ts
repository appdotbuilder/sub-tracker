
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { type DeleteSubscriptionInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteSubscription = async (input: DeleteSubscriptionInput): Promise<{ success: boolean }> => {
  try {
    // First, check if the subscription exists
    const existingSubscription = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, input.id))
      .execute();

    if (existingSubscription.length === 0) {
      throw new Error(`Subscription with id ${input.id} not found`);
    }

    // Delete the subscription
    const result = await db.delete(subscriptionsTable)
      .where(eq(subscriptionsTable.id, input.id))
      .returning()
      .execute();

    // Verify deletion was successful
    if (result.length === 0) {
      throw new Error('Failed to delete subscription');
    }

    return { success: true };
  } catch (error) {
    console.error('Subscription deletion failed:', error);
    throw error;
  }
};
