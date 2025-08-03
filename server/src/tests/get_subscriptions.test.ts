
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { getSubscriptions } from '../handlers/get_subscriptions';

describe('getSubscriptions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no subscriptions exist', async () => {
    const result = await getSubscriptions();
    expect(result).toEqual([]);
  });

  it('should return all subscriptions', async () => {
    // Create test subscriptions
    await db.insert(subscriptionsTable).values([
      {
        name: 'Netflix',
        description: 'Streaming service',
        price: '15.99',
        billing_cycle: 'monthly',
        next_due_date: new Date('2024-02-01'),
        is_active: true
      },
      {
        name: 'Spotify',
        description: 'Music streaming',
        price: '9.99',
        billing_cycle: 'monthly',
        next_due_date: new Date('2024-01-15'),
        is_active: true
      }
    ]).execute();

    const result = await getSubscriptions();

    expect(result).toHaveLength(2);
    
    // Verify field types and values
    result.forEach(subscription => {
      expect(subscription.id).toBeDefined();
      expect(typeof subscription.name).toBe('string');
      expect(typeof subscription.price).toBe('number');
      expect(subscription.billing_cycle).toMatch(/^(monthly|yearly|weekly|daily)$/);
      expect(subscription.next_due_date).toBeInstanceOf(Date);
      expect(typeof subscription.is_active).toBe('boolean');
      expect(subscription.created_at).toBeInstanceOf(Date);
      expect(subscription.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific subscription data
    const netflix = result.find(s => s.name === 'Netflix');
    const spotify = result.find(s => s.name === 'Spotify');

    expect(netflix).toBeDefined();
    expect(netflix!.price).toBe(15.99);
    expect(netflix!.description).toBe('Streaming service');

    expect(spotify).toBeDefined();
    expect(spotify!.price).toBe(9.99);
    expect(spotify!.description).toBe('Music streaming');
  });

  it('should order subscriptions by next_due_date ascending', async () => {
    // Create subscriptions with different due dates
    await db.insert(subscriptionsTable).values([
      {
        name: 'Third Due',
        description: 'Latest due date',
        price: '20.00',
        billing_cycle: 'monthly',
        next_due_date: new Date('2024-03-01'),
        is_active: true
      },
      {
        name: 'First Due',
        description: 'Earliest due date',
        price: '10.00',
        billing_cycle: 'monthly',
        next_due_date: new Date('2024-01-01'),
        is_active: true
      },
      {
        name: 'Second Due',
        description: 'Middle due date',
        price: '15.00',
        billing_cycle: 'monthly',
        next_due_date: new Date('2024-02-01'),
        is_active: true
      }
    ]).execute();

    const result = await getSubscriptions();

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('First Due');
    expect(result[1].name).toBe('Second Due');
    expect(result[2].name).toBe('Third Due');

    // Verify dates are in ascending order
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].next_due_date <= result[i + 1].next_due_date).toBe(true);
    }
  });

  it('should include both active and inactive subscriptions', async () => {
    await db.insert(subscriptionsTable).values([
      {
        name: 'Active Subscription',
        description: 'Currently active',
        price: '10.00',
        billing_cycle: 'monthly',
        next_due_date: new Date('2024-02-01'),
        is_active: true
      },
      {
        name: 'Inactive Subscription',
        description: 'Currently inactive',
        price: '15.00',
        billing_cycle: 'monthly',
        next_due_date: new Date('2024-01-01'),
        is_active: false
      }
    ]).execute();

    const result = await getSubscriptions();

    expect(result).toHaveLength(2);
    
    const activeSubscription = result.find(s => s.name === 'Active Subscription');
    const inactiveSubscription = result.find(s => s.name === 'Inactive Subscription');

    expect(activeSubscription).toBeDefined();
    expect(activeSubscription!.is_active).toBe(true);

    expect(inactiveSubscription).toBeDefined();
    expect(inactiveSubscription!.is_active).toBe(false);
  });
});
