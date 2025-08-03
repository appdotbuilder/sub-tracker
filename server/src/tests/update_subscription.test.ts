
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { type CreateSubscriptionInput, type UpdateSubscriptionInput } from '../schema';
import { updateSubscription } from '../handlers/update_subscription';
import { eq } from 'drizzle-orm';

// Helper function to create a test subscription
const createTestSubscription = async () => {
  const testData = {
    name: 'Original Subscription',
    description: 'Original description',
    price: '29.99',
    billing_cycle: 'monthly' as const,
    next_due_date: new Date('2024-01-01'),
    is_active: true
  };

  const result = await db.insert(subscriptionsTable)
    .values(testData)
    .returning()
    .execute();

  return result[0];
};

describe('updateSubscription', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update subscription name', async () => {
    const testSubscription = await createTestSubscription();
    
    const updateInput: UpdateSubscriptionInput = {
      id: testSubscription.id,
      name: 'Updated Name'
    };

    const result = await updateSubscription(updateInput);

    expect(result.id).toEqual(testSubscription.id);
    expect(result.name).toEqual('Updated Name');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.price).toEqual(29.99);
    expect(typeof result.price).toEqual('number');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testSubscription.updated_at).toBe(true);
  });

  it('should update multiple fields at once', async () => {
    const testSubscription = await createTestSubscription();
    
    const updateInput: UpdateSubscriptionInput = {
      id: testSubscription.id,
      name: 'Multi Update',
      price: 39.99,
      billing_cycle: 'yearly',
      is_active: false
    };

    const result = await updateSubscription(updateInput);

    expect(result.name).toEqual('Multi Update');
    expect(result.price).toEqual(39.99);
    expect(typeof result.price).toEqual('number');
    expect(result.billing_cycle).toEqual('yearly');
    expect(result.is_active).toEqual(false);
    expect(result.description).toEqual('Original description'); // Unchanged
  });

  it('should update description to null', async () => {
    const testSubscription = await createTestSubscription();
    
    const updateInput: UpdateSubscriptionInput = {
      id: testSubscription.id,
      description: null
    };

    const result = await updateSubscription(updateInput);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Original Subscription'); // Unchanged
  });

  it('should update next_due_date', async () => {
    const testSubscription = await createTestSubscription();
    const newDueDate = new Date('2024-12-31');
    
    const updateInput: UpdateSubscriptionInput = {
      id: testSubscription.id,
      next_due_date: newDueDate
    };

    const result = await updateSubscription(updateInput);

    expect(result.next_due_date).toEqual(newDueDate);
  });

  it('should persist changes to database', async () => {
    const testSubscription = await createTestSubscription();
    
    const updateInput: UpdateSubscriptionInput = {
      id: testSubscription.id,
      name: 'Database Test',
      price: 49.99
    };

    await updateSubscription(updateInput);

    // Verify in database
    const dbResult = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, testSubscription.id))
      .execute();

    expect(dbResult).toHaveLength(1);
    expect(dbResult[0].name).toEqual('Database Test');
    expect(parseFloat(dbResult[0].price)).toEqual(49.99);
    expect(dbResult[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent subscription', async () => {
    const updateInput: UpdateSubscriptionInput = {
      id: 99999,
      name: 'Non-existent'
    };

    await expect(updateSubscription(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle empty update object', async () => {
    const testSubscription = await createTestSubscription();
    
    const updateInput: UpdateSubscriptionInput = {
      id: testSubscription.id
    };

    const result = await updateSubscription(updateInput);

    // Should only update the updated_at timestamp
    expect(result.id).toEqual(testSubscription.id);
    expect(result.name).toEqual('Original Subscription');
    expect(result.updated_at > testSubscription.updated_at).toBe(true);
  });

  it('should update all billing cycle options', async () => {
    const testSubscription = await createTestSubscription();
    
    const cycles = ['weekly', 'daily', 'yearly'] as const;
    
    for (const cycle of cycles) {
      const updateInput: UpdateSubscriptionInput = {
        id: testSubscription.id,
        billing_cycle: cycle
      };

      const result = await updateSubscription(updateInput);
      expect(result.billing_cycle).toEqual(cycle);
    }
  });
});
