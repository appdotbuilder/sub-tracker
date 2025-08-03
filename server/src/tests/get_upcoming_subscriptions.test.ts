
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { type CreateSubscriptionInput } from '../schema';
import { getUpcomingSubscriptions } from '../handlers/get_upcoming_subscriptions';

describe('getUpcomingSubscriptions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return subscriptions due within next 7 days', async () => {
    // Create test subscriptions with different due dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const inFiveDays = new Date(today);
    inFiveDays.setDate(today.getDate() + 5);

    // Create subscription due tomorrow
    await db.insert(subscriptionsTable).values({
      name: 'Netflix',
      description: 'Streaming service',
      price: '15.99',
      billing_cycle: 'monthly',
      next_due_date: tomorrow,
      is_active: true
    });

    // Create subscription due in 5 days
    await db.insert(subscriptionsTable).values({
      name: 'Spotify',
      description: 'Music streaming',
      price: '9.99',
      billing_cycle: 'monthly',
      next_due_date: inFiveDays,
      is_active: true
    });

    const results = await getUpcomingSubscriptions();

    expect(results).toHaveLength(2);
    expect(results[0].name).toEqual('Netflix');
    expect(results[0].price).toEqual(15.99);
    expect(typeof results[0].price).toBe('number');
    expect(results[1].name).toEqual('Spotify');
    expect(results[1].price).toEqual(9.99);
  });

  it('should exclude subscriptions due more than 7 days away', async () => {
    const today = new Date();
    const inTenDays = new Date(today);
    inTenDays.setDate(today.getDate() + 10);

    // Create subscription due in 10 days (should not be included)
    await db.insert(subscriptionsTable).values({
      name: 'Future Service',
      description: 'Far away subscription',
      price: '20.00',
      billing_cycle: 'monthly',
      next_due_date: inTenDays,
      is_active: true
    });

    const results = await getUpcomingSubscriptions();
    expect(results).toHaveLength(0);
  });

  it('should exclude inactive subscriptions', async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Create inactive subscription due tomorrow
    await db.insert(subscriptionsTable).values({
      name: 'Inactive Service',
      description: 'Cancelled subscription',
      price: '12.99',
      billing_cycle: 'monthly',
      next_due_date: tomorrow,
      is_active: false
    });

    const results = await getUpcomingSubscriptions();
    expect(results).toHaveLength(0);
  });

  it('should exclude subscriptions due in the past', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Create subscription due yesterday
    await db.insert(subscriptionsTable).values({
      name: 'Overdue Service',
      description: 'Past due subscription',
      price: '8.99',
      billing_cycle: 'monthly',
      next_due_date: yesterday,
      is_active: true
    });

    const results = await getUpcomingSubscriptions();
    expect(results).toHaveLength(0);
  });

  it('should return subscriptions ordered by due date', async () => {
    const today = new Date();
    const inTwoDays = new Date(today);
    inTwoDays.setDate(today.getDate() + 2);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Create subscriptions in reverse chronological order
    await db.insert(subscriptionsTable).values({
      name: 'Second Due',
      description: 'Due in 2 days',
      price: '15.99',
      billing_cycle: 'monthly',
      next_due_date: inTwoDays,
      is_active: true
    });

    await db.insert(subscriptionsTable).values({
      name: 'First Due',
      description: 'Due tomorrow',
      price: '9.99',
      billing_cycle: 'monthly',
      next_due_date: tomorrow,
      is_active: true
    });

    const results = await getUpcomingSubscriptions();

    expect(results).toHaveLength(2);
    expect(results[0].name).toEqual('First Due');
    expect(results[0].next_due_date).toEqual(tomorrow);
    expect(results[1].name).toEqual('Second Due');
    expect(results[1].next_due_date).toEqual(inTwoDays);
  });

  it('should include subscriptions due today', async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Set to noon today

    await db.insert(subscriptionsTable).values({
      name: 'Due Today',
      description: 'Due today',
      price: '10.00',
      billing_cycle: 'monthly',
      next_due_date: today,
      is_active: true
    });

    const results = await getUpcomingSubscriptions();

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Due Today');
    expect(results[0].price).toEqual(10.00);
  });
});
