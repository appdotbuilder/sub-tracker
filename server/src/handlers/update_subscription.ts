
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { type UpdateSubscriptionInput, type Subscription } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSubscription = async (input: UpdateSubscriptionInput): Promise<Subscription> => {
  try {
    // First check if subscription exists
    const existing = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      throw new Error(`Subscription with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.price !== undefined) {
      updateData.price = input.price.toString(); // Convert number to string for numeric column
    }
    if (input.billing_cycle !== undefined) {
      updateData.billing_cycle = input.billing_cycle;
    }
    if (input.next_due_date !== undefined) {
      updateData.next_due_date = input.next_due_date;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Update the subscription
    const result = await db.update(subscriptionsTable)
      .set(updateData)
      .where(eq(subscriptionsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const subscription = result[0];
    return {
      ...subscription,
      price: parseFloat(subscription.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Subscription update failed:', error);
    throw error;
  }
};
