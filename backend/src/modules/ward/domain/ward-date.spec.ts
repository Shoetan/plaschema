import {
  lastNMonthsInLagos,
  monthKeyInLagos,
  startOfMonthInLagos,
  startOfTodayInLagos,
} from './ward-date';

describe('startOfTodayInLagos', () => {
  it('returns midnight WAT for the Lagos calendar day', () => {
    const result = startOfTodayInLagos(
      new Date('2026-08-29T15:30:00+01:00'),
    );
    expect(result.toISOString()).toBe('2026-08-28T23:00:00.000Z');
  });
});

describe('monthKeyInLagos', () => {
  it('returns YYYY-MM in Africa/Lagos', () => {
    expect(monthKeyInLagos(new Date('2026-08-29T15:30:00+01:00'))).toBe(
      '2026-08',
    );
  });
});

describe('startOfMonthInLagos', () => {
  it('returns the first day of the Lagos calendar month', () => {
    const result = startOfMonthInLagos(new Date('2026-08-29T15:30:00+01:00'));
    expect(result.toISOString()).toBe('2026-07-31T23:00:00.000Z');
  });
});

describe('lastNMonthsInLagos', () => {
  it('returns N consecutive months ending with the current Lagos month', () => {
    const months = lastNMonthsInLagos(3, new Date('2026-08-29T15:30:00+01:00'));
    expect(months.map((month) => month.month)).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
    ]);
    expect(months.every((month) => month.label.length > 0)).toBe(true);
  });

  it('zero-fills missing months in trend data consumers', () => {
    const months = lastNMonthsInLagos(2, new Date('2026-01-15T12:00:00+01:00'));
    const counts = new Map<string, number>();
    expect(months.map(({ month }) => counts.get(month) ?? 0)).toEqual([0, 0]);
  });
});
