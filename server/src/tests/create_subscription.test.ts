
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { type CreateSubscriptionInput } from '../schema';
import { createSubscription } from '../handlers/create_subscription';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateSubscriptionInput = {
  name: 'Netflix Premium',
  description: 'Streaming service subscription',
  price: 15.99,
  billing_cycle: 'monthly',
  next_due_date: new Date('2024-02-15')
};

describe('createSubscription', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a subscription with all fields', async () => {
    const result = await createSubscription(testInput);

    // Verify all fields are correctly set
    expect(result.name).toEqual('Netflix Premium');
    expect(result.description).toEqual('Streaming service subscription');
    expect(result.price).toEqual(15.99);
    expect(typeof result.price).toBe('number');
    expect(result.billing_cycle).toEqual('monthly');
    expect(result.next_due_date).toEqual(new Date('2024-02-15'));
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save subscription to database', async () => {
    const result = await createSubscription(testInput);

    // Query database to verify persistence
    const subscriptions = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, result.id))
      .execute();

    expect(subscriptions).toHaveLength(1);
    const savedSubscription = subscriptions[0];
    expect(savedSubscription.name).toEqual('Netflix Premium');
    expect(savedSubscription.description).toEqual('Streaming service subscription');
    expect(parseFloat(savedSubscription.price)).toEqual(15.99);
    expect(savedSubscription.billing_cycle).toEqual('monthly');
    expect(savedSubscription.next_due_date).toEqual(new Date('2024-02-15'));
    expect(savedSubscription.is_active).toBe(true);
    expect(savedSubscription.created_at).toBeInstanceOf(Date);
    expect(savedSubscription.updated_at).toBeInstanceOf(Date);
  });

  it('should create subscription with null description', async () => {
    const inputWithNullDescription: CreateSubscriptionInput = {
      ...testInput,
      description: null
    };

    const result = await createSubscription(inputWithNullDescription);

    expect(result.description).toBeNull();
    expect(result.name).toEqual(testInput.name);
    expect(result.price).toEqual(testInput.price);

    // Verify in database
    const subscriptions = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, result.id))
      .execute();

    expect(subscriptions[0].description).toBeNull();
  });

  it('should handle different billing cycles', async () => {
    const yearlyInput: CreateSubscriptionInput = {
      ...testInput,
      name: 'Annual Plan',
      billing_cycle: 'yearly',
      price: 120.00
    };

    const result = await createSubscription(yearlyInput);

    expect(result.billing_cycle).toEqual('yearly');
    expect(result.price).toEqual(120.00);
    expect(result.name).toEqual('Annual Plan');
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createSubscription(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});
