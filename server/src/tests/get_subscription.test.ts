
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { type CreateSubscriptionInput, type GetSubscriptionInput } from '../schema';
import { getSubscription } from '../handlers/get_subscription';

// Test subscription data
const testSubscription: CreateSubscriptionInput = {
  name: 'Netflix',
  description: 'Streaming service',
  price: 15.99,
  billing_cycle: 'monthly',
  next_due_date: new Date('2024-02-01')
};

describe('getSubscription', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return subscription when found', async () => {
    // Create test subscription
    const insertResult = await db.insert(subscriptionsTable)
      .values({
        name: testSubscription.name,
        description: testSubscription.description,
        price: testSubscription.price.toString(),
        billing_cycle: testSubscription.billing_cycle,
        next_due_date: testSubscription.next_due_date
      })
      .returning()
      .execute();

    const createdSubscription = insertResult[0];

    // Test input
    const input: GetSubscriptionInput = {
      id: createdSubscription.id
    };

    const result = await getSubscription(input);

    // Verify subscription is returned with correct data
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdSubscription.id);
    expect(result!.name).toEqual('Netflix');
    expect(result!.description).toEqual('Streaming service');
    expect(result!.price).toEqual(15.99);
    expect(typeof result!.price).toBe('number');
    expect(result!.billing_cycle).toEqual('monthly');
    expect(result!.next_due_date).toEqual(testSubscription.next_due_date);
    expect(result!.is_active).toBe(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when subscription not found', async () => {
    const input: GetSubscriptionInput = {
      id: 999 // Non-existent ID
    };

    const result = await getSubscription(input);

    expect(result).toBeNull();
  });

  it('should handle subscription with null description', async () => {
    // Create subscription with null description
    const insertResult = await db.insert(subscriptionsTable)
      .values({
        name: 'Spotify',
        description: null,
        price: '9.99',
        billing_cycle: 'monthly',
        next_due_date: new Date('2024-03-01')
      })
      .returning()
      .execute();

    const createdSubscription = insertResult[0];

    const input: GetSubscriptionInput = {
      id: createdSubscription.id
    };

    const result = await getSubscription(input);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Spotify');
    expect(result!.description).toBeNull();
    expect(result!.price).toEqual(9.99);
    expect(typeof result!.price).toBe('number');
  });
});
