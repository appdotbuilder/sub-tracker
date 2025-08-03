
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { type SpendingSummary } from '../schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export async function getSpendingSummary(): Promise<SpendingSummary> {
  try {
    // Get all active subscriptions
    const activeSubscriptions = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.is_active, true))
      .execute();

    // Calculate total monthly spending
    let totalMonthly = 0;
    let totalYearly = 0;

    for (const subscription of activeSubscriptions) {
      const price = parseFloat(subscription.price);
      
      switch (subscription.billing_cycle) {
        case 'monthly':
          totalMonthly += price;
          totalYearly += price * 12;
          break;
        case 'yearly':
          totalMonthly += price / 12;
          totalYearly += price;
          break;
        case 'weekly':
          totalMonthly += price * 4.33; // Average weeks per month
          totalYearly += price * 52;
          break;
        case 'daily':
          totalMonthly += price * 30.44; // Average days per month
          totalYearly += price * 365;
          break;
      }
    }

    // Count active subscriptions
    const activeSubscriptionsCount = activeSubscriptions.length;

    // Count subscriptions due in the next 7 days
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const upcomingDueSubscriptions = await db.select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.is_active, true),
          gte(subscriptionsTable.next_due_date, today),
          lte(subscriptionsTable.next_due_date, sevenDaysFromNow)
        )
      )
      .execute();

    const upcomingDueCount = upcomingDueSubscriptions.length;

    return {
      total_monthly: Math.round(totalMonthly * 100) / 100, // Round to 2 decimal places
      total_yearly: Math.round(totalYearly * 100) / 100,
      active_subscriptions_count: activeSubscriptionsCount,
      upcoming_due_count: upcomingDueCount
    };
  } catch (error) {
    console.error('Spending summary calculation failed:', error);
    throw error;
  }
}
