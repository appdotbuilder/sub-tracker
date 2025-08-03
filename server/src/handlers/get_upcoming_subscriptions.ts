
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { type Subscription } from '../schema';
import { eq, and, gte, lte, asc } from 'drizzle-orm';

export async function getUpcomingSubscriptions(): Promise<Subscription[]> {
  try {
    // Calculate date range - today to 7 days from now
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    sevenDaysFromNow.setHours(23, 59, 59, 999); // End of the 7th day

    // Query for active subscriptions due within the next 7 days
    const results = await db.select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.is_active, true),
          gte(subscriptionsTable.next_due_date, today),
          lte(subscriptionsTable.next_due_date, sevenDaysFromNow)
        )
      )
      .orderBy(asc(subscriptionsTable.next_due_date))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(subscription => ({
      ...subscription,
      price: parseFloat(subscription.price)
    }));
  } catch (error) {
    console.error('Failed to get upcoming subscriptions:', error);
    throw error;
  }
}
