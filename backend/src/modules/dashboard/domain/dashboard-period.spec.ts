import {
  normalizeCategoryBreakdown,
  bucketEnrollmentCategory,
} from './dashboard';
import {
  addLagosCalendarDays,
  buildTrendBuckets,
  percentChange,
  resolveDashboardPeriodWindow,
  startOfLagosWeek,
} from './dashboard-period';

describe('percentChange', () => {
  it('returns 0 when both sides are 0', () => {
    expect(percentChange(0, 0)).toBe(0);
  });

  it('returns 100 when previous is 0 and current is positive', () => {
    expect(percentChange(5, 0)).toBe(100);
  });

  it('rounds to one decimal place', () => {
    expect(percentChange(110, 100)).toBe(10);
    expect(percentChange(115, 100)).toBe(15);
    expect(percentChange(88, 100)).toBe(-12);
  });
});

describe('bucketEnrollmentCategory / normalizeCategoryBreakdown', () => {
  it('maps unknown categories to Other', () => {
    expect(bucketEnrollmentCategory('IDPs')).toBe('IDPs');
    expect(bucketEnrollmentCategory('Refugees')).toBe('Other');
  });

  it('always includes known categories and Other only when needed', () => {
    expect(
      normalizeCategoryBreakdown([
        { category: 'IDPs', count: 3 },
        { category: 'Custom', count: 2 },
        { category: 'Refugees', count: 1 },
      ]),
    ).toEqual([
      { category: 'IDPs', count: 3 },
      { category: 'Elderly 65+', count: 0 },
      { category: 'Indigents / Very Poor / Others', count: 0 },
      { category: 'Other', count: 3 },
    ]);
  });
});

describe('resolveDashboardPeriodWindow', () => {
  const now = new Date('2026-08-29T15:30:00+01:00');

  it('resolves 7d as seven inclusive Lagos calendar days', () => {
    const window = resolveDashboardPeriodWindow('7d', now);
    expect(window.start.toISOString()).toBe('2026-08-22T23:00:00.000Z');
    expect(window.end).toEqual(now);
    expect(window.previousEnd).toEqual(window.start);
  });

  it('resolves 3m from the start of the month two months ago', () => {
    const window = resolveDashboardPeriodWindow('3m', now);
    expect(window.start.toISOString()).toBe('2026-05-31T23:00:00.000Z');
  });
});

describe('buildTrendBuckets', () => {
  it('builds monthly buckets intersecting the period', () => {
    const start = new Date('2026-06-15T12:00:00+01:00');
    const end = new Date('2026-08-29T15:30:00+01:00');
    const buckets = buildTrendBuckets('monthly', start, end);
    expect(buckets.map((bucket) => bucket.key)).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
    ]);
  });

  it('builds daily buckets', () => {
    const start = addLagosCalendarDays(
      new Date('2026-08-28T00:00:00+01:00'),
      0,
    );
    const end = new Date('2026-08-29T15:30:00+01:00');
    const buckets = buildTrendBuckets('daily', start, end);
    expect(buckets.map((bucket) => bucket.key)).toEqual([
      '2026-08-28',
      '2026-08-29',
    ]);
  });

  it('aligns weekly buckets to Lagos Mondays', () => {
    const monday = startOfLagosWeek(new Date('2026-08-29T12:00:00+01:00'));
    expect(monday.toISOString()).toBe('2026-08-23T23:00:00.000Z');
  });
});
