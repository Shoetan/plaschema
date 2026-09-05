import { startOfTodayInLagos } from '../../ward/domain/ward-date';

export const DASHBOARD_PERIODS = ['7d', '30d', '3m', '6m', '1y'] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

export const DASHBOARD_TREND_GRANULARITIES = [
  'daily',
  'weekly',
  'monthly',
] as const;
export type DashboardTrendGranularity =
  (typeof DASHBOARD_TREND_GRANULARITIES)[number];

export type DashboardPeriodWindow = {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
};

function lagosYmdParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);

  if (!year || !month || !day) {
    throw new Error('Unable to resolve Africa/Lagos calendar date');
  }

  return { year, month, day };
}

function lagosDateAtMidnight(year: number, month: number, day: number): Date {
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  return new Date(`${year}-${monthStr}-${dayStr}T00:00:00+01:00`);
}

/** Add calendar days in Africa/Lagos (handles month boundaries). */
export function addLagosCalendarDays(date: Date, days: number): Date {
  const { year, month, day } = lagosYmdParts(date);
  const utcNoon = Date.UTC(year, month - 1, day + days, 12, 0, 0);
  const shifted = new Date(utcNoon);
  const parts = lagosYmdParts(shifted);
  return lagosDateAtMidnight(parts.year, parts.month, parts.day);
}

/** Add calendar months in Africa/Lagos, clamping to day 1 of the target month. */
export function addLagosCalendarMonths(date: Date, months: number): Date {
  const { year, month } = lagosYmdParts(date);
  const absolute = year * 12 + (month - 1) + months;
  const nextYear = Math.floor(absolute / 12);
  const nextMonth = (absolute % 12) + 1;
  return lagosDateAtMidnight(nextYear, nextMonth, 1);
}

export function resolveDashboardPeriodWindow(
  period: DashboardPeriod,
  now = new Date(),
): DashboardPeriodWindow {
  const end = now;
  const todayStart = startOfTodayInLagos(now);

  let start: Date;
  switch (period) {
    case '7d':
      start = addLagosCalendarDays(todayStart, -6);
      break;
    case '30d':
      start = addLagosCalendarDays(todayStart, -29);
      break;
    case '3m':
      start = addLagosCalendarMonths(todayStart, -2);
      break;
    case '6m':
      start = addLagosCalendarMonths(todayStart, -5);
      break;
    case '1y':
      start = addLagosCalendarMonths(todayStart, -11);
      break;
  }

  const durationMs = end.getTime() - start.getTime();
  const previousEnd = start;
  const previousStart = new Date(start.getTime() - durationMs);

  return { start, end, previousStart, previousEnd };
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export type TrendBucket = {
  key: string;
  label: string;
  start: Date;
};

/** Monday 00:00 Africa/Lagos containing `date`. */
export function startOfLagosWeek(date: Date): Date {
  const { year, month, day } = lagosYmdParts(date);
  const noonUtc = Date.UTC(year, month - 1, day, 12, 0, 0);
  // 0=Sun..6=Sat in UTC for that Lagos calendar day at noon
  const weekday = new Date(noonUtc).getUTCDay();
  const daysFromMonday = (weekday + 6) % 7;
  return addLagosCalendarDays(
    lagosDateAtMidnight(year, month, day),
    -daysFromMonday,
  );
}

export function dayKeyInLagos(date: Date): string {
  const { year, month, day } = lagosYmdParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function weekKeyInLagos(date: Date): string {
  return dayKeyInLagos(startOfLagosWeek(date));
}

export function buildTrendBuckets(
  granularity: DashboardTrendGranularity,
  periodStart: Date,
  periodEnd: Date,
): TrendBucket[] {
  const buckets: TrendBucket[] = [];

  if (granularity === 'monthly') {
    const startParts = lagosYmdParts(periodStart);
    let cursor = lagosDateAtMidnight(startParts.year, startParts.month, 1);

    while (cursor.getTime() <= periodEnd.getTime()) {
      const parts = lagosYmdParts(cursor);
      const key = `${parts.year}-${String(parts.month).padStart(2, '0')}`;
      const label = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Lagos',
        month: 'short',
      }).format(cursor);
      buckets.push({ key, label, start: cursor });
      cursor = addLagosCalendarMonths(cursor, 1);
    }
    return buckets;
  }

  if (granularity === 'weekly') {
    let cursor = startOfLagosWeek(periodStart);
    while (cursor.getTime() <= periodEnd.getTime()) {
      const key = dayKeyInLagos(cursor);
      const label = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Lagos',
        month: 'short',
        day: 'numeric',
      }).format(cursor);
      buckets.push({ key, label, start: cursor });
      cursor = addLagosCalendarDays(cursor, 7);
    }
    return buckets;
  }

  // daily
  let cursor = startOfTodayInLagos(periodStart);
  // If periodStart is mid-day, still start at that Lagos calendar day midnight
  cursor = lagosDateAtMidnight(
    lagosYmdParts(periodStart).year,
    lagosYmdParts(periodStart).month,
    lagosYmdParts(periodStart).day,
  );
  while (cursor.getTime() <= periodEnd.getTime()) {
    const key = dayKeyInLagos(cursor);
    const label = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Lagos',
      month: 'short',
      day: 'numeric',
    }).format(cursor);
    buckets.push({ key, label, start: cursor });
    cursor = addLagosCalendarDays(cursor, 1);
  }
  return buckets;
}

export function trendBucketKeyForDate(
  granularity: DashboardTrendGranularity,
  date: Date,
): string {
  if (granularity === 'monthly') {
    const { year, month } = lagosYmdParts(date);
    return `${year}-${String(month).padStart(2, '0')}`;
  }
  if (granularity === 'weekly') {
    return weekKeyInLagos(date);
  }
  return dayKeyInLagos(date);
}
