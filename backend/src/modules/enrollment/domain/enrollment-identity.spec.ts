import {
  assertReasonableDateOfBirth,
  formatIsoDateOnly,
  normalizeEnrollmentNameKey,
  parseIsoDateOnly,
} from './enrollment-identity';

describe('enrollment identity helpers', () => {
  it('normalizes names for duplicate keys', () => {
    expect(normalizeEnrollmentNameKey('  Ada   Obi ')).toBe('ada obi');
  });

  it('parses and formats ISO dates', () => {
    const date = parseIsoDateOnly('1990-05-04');
    expect(formatIsoDateOnly(date)).toBe('1990-05-04');
  });

  it('rejects invalid dates', () => {
    expect(() => parseIsoDateOnly('1990-13-01')).toThrow(/Invalid/);
    expect(() => parseIsoDateOnly('05/04/1990')).toThrow(/YYYY-MM-DD/);
  });

  it('rejects future dates of birth', () => {
    expect(() =>
      assertReasonableDateOfBirth(parseIsoDateOnly('2999-01-01')),
    ).toThrow(/future/);
  });
});
