
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { type Subscription } from '../schema';
import { asc } from 'drizzle-orm';

export async function getSubscriptions(): Promise<Subscription[]> {
  try {
    const results = await db.select()
      .from(subscriptionsTable)
      .orderBy(asc(subscriptionsTable.next_due_date))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(subscription => ({
      ...subscription,
      price: parseFloat(subscription.price)
    }));
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
    throw error;
  }
}
