
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { getSpendingSummary } from '../handlers/get_spending_summary';

describe('getSpendingSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero values for empty database', async () => {
    const result = await getSpendingSummary();

    expect(result.total_monthly).toEqual(0);
    expect(result.total_yearly).toEqual(0);
    expect(result.active_subscriptions_count).toEqual(0);
    expect(result.upcoming_due_count).toEqual(0);
  });

  it('should calculate totals for monthly subscriptions correctly', async () => {
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
        next_due_date: new Date('2024-02-15'),
        is_active: true
      }
    ]);

    const result = await getSpendingSummary();

    expect(result.total_monthly).toEqual(25.98);
    expect(result.total_yearly).toEqual(311.76);
    expect(result.active_subscriptions_count).toEqual(2);
  });

  it('should calculate totals for yearly subscriptions correctly', async () => {
    await db.insert(subscriptionsTable).values({
      name: 'Adobe Creative Cloud',
      description: 'Design software',
      price: '239.88',
      billing_cycle: 'yearly',
      next_due_date: new Date('2024-12-01'),
      is_active: true
    });

    const result = await getSpendingSummary();

    expect(result.total_monthly).toEqual(19.99);
    expect(result.total_yearly).toEqual(239.88);
    expect(result.active_subscriptions_count).toEqual(1);
  });

  it('should calculate totals for weekly subscriptions correctly', async () => {
    await db.insert(subscriptionsTable).values({
      name: 'Weekly Service',
      description: 'Test weekly service',
      price: '5.00',
      billing_cycle: 'weekly',
      next_due_date: new Date('2024-01-08'),
      is_active: true
    });

    const result = await getSpendingSummary();

    expect(result.total_monthly).toEqual(21.65); // 5.00 * 4.33
    expect(result.total_yearly).toEqual(260.00); // 5.00 * 52
    expect(result.active_subscriptions_count).toEqual(1);
  });

  it('should calculate totals for daily subscriptions correctly', async () => {
    await db.insert(subscriptionsTable).values({
      name: 'Daily Service',
      description: 'Test daily service',
      price: '1.00',
      billing_cycle: 'daily',
      next_due_date: new Date('2024-01-02'),
      is_active: true
    });

    const result = await getSpendingSummary();

    expect(result.total_monthly).toEqual(30.44); // 1.00 * 30.44
    expect(result.total_yearly).toEqual(365.00); // 1.00 * 365
    expect(result.active_subscriptions_count).toEqual(1);
  });

  it('should exclude inactive subscriptions from calculations', async () => {
    await db.insert(subscriptionsTable).values([
      {
        name: 'Active Service',
        description: 'Active subscription',
        price: '10.00',
        billing_cycle: 'monthly',
        next_due_date: new Date('2024-02-01'),
        is_active: true
      },
      {
        name: 'Inactive Service',
        description: 'Cancelled subscription',
        price: '20.00',
        billing_cycle: 'monthly',
        next_due_date: new Date('2024-02-01'),
        is_active: false
      }
    ]);

    const result = await getSpendingSummary();

    expect(result.total_monthly).toEqual(10.00);
    expect(result.total_yearly).toEqual(120.00);
    expect(result.active_subscriptions_count).toEqual(1);
  });

  it('should count upcoming due subscriptions correctly', async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const fiveDaysFromNow = new Date(today);
    fiveDaysFromNow.setDate(today.getDate() + 5);
    
    const tenDaysFromNow = new Date(today);
    tenDaysFromNow.setDate(today.getDate() + 10);

    await db.insert(subscriptionsTable).values([
      {
        name: 'Due Tomorrow',
        description: 'Due in 1 day',
        price: '10.00',
        billing_cycle: 'monthly',
        next_due_date: tomorrow,
        is_active: true
      },
      {
        name: 'Due in 5 Days',
        description: 'Due in 5 days',
        price: '15.00',
        billing_cycle: 'monthly',
        next_due_date: fiveDaysFromNow,
        is_active: true
      },
      {
        name: 'Due in 10 Days',
        description: 'Due in 10 days',
        price: '20.00',
        billing_cycle: 'monthly',
        next_due_date: tenDaysFromNow,
        is_active: true
      }
    ]);

    const result = await getSpendingSummary();

    expect(result.upcoming_due_count).toEqual(2); // Only first two should be within 7 days
    expect(result.active_subscriptions_count).toEqual(3);
  });

  it('should handle mixed billing cycles correctly', async () => {
    await db.insert(subscriptionsTable).values([
      {
        name: 'Monthly Service',
        description: 'Monthly subscription',
        price: '10.00',
        billing_cycle: 'monthly',
        next_due_date: new Date('2024-02-01'),
        is_active: true
      },
      {
        name: 'Yearly Service',
        description: 'Yearly subscription',
        price: '120.00',
        billing_cycle: 'yearly',
        next_due_date: new Date('2024-12-01'),
        is_active: true
      },
      {
        name: 'Weekly Service',
        description: 'Weekly subscription',
        price: '2.50',
        billing_cycle: 'weekly',
        next_due_date: new Date('2024-01-08'),
        is_active: true
      }
    ]);

    const result = await getSpendingSummary();

    // Monthly: 10.00
    // Yearly: 120.00 / 12 = 10.00
    // Weekly: 2.50 * 4.33 = 10.83 (rounded)
    expect(result.total_monthly).toEqual(30.83);
    
    // Monthly: 10.00 * 12 = 120.00
    // Yearly: 120.00
    // Weekly: 2.50 * 52 = 130.00
    expect(result.total_yearly).toEqual(370.00);
    expect(result.active_subscriptions_count).toEqual(3);
  });
});
