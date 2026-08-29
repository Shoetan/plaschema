import { startOfTodayInLagos } from './ward-date';

describe('startOfTodayInLagos', () => {
  it('returns midnight WAT for the Lagos calendar day', () => {
    const result = startOfTodayInLagos(
      new Date('2026-08-29T15:30:00+01:00'),
    );
    expect(result.toISOString()).toBe('2026-08-28T23:00:00.000Z');
  });
});
