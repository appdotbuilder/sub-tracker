
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { type CreateSubscriptionInput, type DeleteSubscriptionInput } from '../schema';
import { deleteSubscription } from '../handlers/delete_subscription';
import { eq } from 'drizzle-orm';

// Test data for creating a subscription to delete
const testSubscriptionInput: CreateSubscriptionInput = {
  name: 'Test Subscription',
  description: 'A subscription for testing deletion',
  price: 9.99,
  billing_cycle: 'monthly',
  next_due_date: new Date('2024-02-01')
};

describe('deleteSubscription', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing subscription', async () => {
    // Create a subscription first
    const createdResult = await db.insert(subscriptionsTable)
      .values({
        name: testSubscriptionInput.name,
        description: testSubscriptionInput.description,
        price: testSubscriptionInput.price.toString(),
        billing_cycle: testSubscriptionInput.billing_cycle,
        next_due_date: testSubscriptionInput.next_due_date
      })
      .returning()
      .execute();

    const subscriptionId = createdResult[0].id;

    // Delete the subscription
    const deleteInput: DeleteSubscriptionInput = { id: subscriptionId };
    const result = await deleteSubscription(deleteInput);

    expect(result.success).toBe(true);

    // Verify the subscription was deleted from the database
    const deletedSubscription = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, subscriptionId))
      .execute();

    expect(deletedSubscription).toHaveLength(0);
  });

  it('should throw error when subscription does not exist', async () => {
    const deleteInput: DeleteSubscriptionInput = { id: 999 };

    await expect(deleteSubscription(deleteInput))
      .rejects.toThrow(/subscription with id 999 not found/i);
  });

  it('should verify subscription exists before deletion', async () => {
    // Create a subscription
    const createdResult = await db.insert(subscriptionsTable)
      .values({
        name: testSubscriptionInput.name,
        description: testSubscriptionInput.description,
        price: testSubscriptionInput.price.toString(),
        billing_cycle: testSubscriptionInput.billing_cycle,
        next_due_date: testSubscriptionInput.next_due_date
      })
      .returning()
      .execute();

    const subscriptionId = createdResult[0].id;

    // Verify subscription exists before deletion
    const existingSubscription = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, subscriptionId))
      .execute();

    expect(existingSubscription).toHaveLength(1);

    // Delete the subscription
    const deleteInput: DeleteSubscriptionInput = { id: subscriptionId };
    await deleteSubscription(deleteInput);

    // Verify subscription no longer exists
    const deletedSubscription = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, subscriptionId))
      .execute();

    expect(deletedSubscription).toHaveLength(0);
  });

  it('should handle multiple subscription deletions correctly', async () => {
    // Create two subscriptions
    const subscription1 = await db.insert(subscriptionsTable)
      .values({
        name: 'Subscription 1',
        description: 'First subscription',
        price: '10.00',
        billing_cycle: 'monthly',
        next_due_date: new Date('2024-02-01')
      })
      .returning()
      .execute();

    const subscription2 = await db.insert(subscriptionsTable)
      .values({
        name: 'Subscription 2',
        description: 'Second subscription',
        price: '20.00',
        billing_cycle: 'yearly',
        next_due_date: new Date('2024-03-01')
      })
      .returning()
      .execute();

    // Delete first subscription
    const result1 = await deleteSubscription({ id: subscription1[0].id });
    expect(result1.success).toBe(true);

    // Verify first is deleted, second still exists
    const remaining = await db.select()
      .from(subscriptionsTable)
      .execute();

    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(subscription2[0].id);

    // Delete second subscription
    const result2 = await deleteSubscription({ id: subscription2[0].id });
    expect(result2.success).toBe(true);

    // Verify both are deleted
    const finalCheck = await db.select()
      .from(subscriptionsTable)
      .execute();

    expect(finalCheck).toHaveLength(0);
  });
});
