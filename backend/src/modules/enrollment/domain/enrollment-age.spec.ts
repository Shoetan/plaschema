import {
  computeEnrollmentAge,
  dateOfBirthRangeForAge,
  formatExportDateDdMmYyyy,
} from './enrollment-age';

describe('enrollment-age', () => {
  const refDate = new Date('2026-08-30T12:00:00.000Z');

  describe('dateOfBirthRangeForAge', () => {
    it('maps min age to an upper bound on date of birth', () => {
      const range = dateOfBirthRangeForAge(18, undefined, refDate);
      expect(range?.lte?.toISOString().slice(0, 10)).toBe('2008-08-30');
    });

    it('maps max age to a lower bound on date of birth', () => {
      const range = dateOfBirthRangeForAge(undefined, 30, refDate);
      expect(range?.gte?.toISOString().slice(0, 10)).toBe('1995-08-31');
    });

    it('combines min and max age bounds', () => {
      const range = dateOfBirthRangeForAge(18, 30, refDate);
      expect(range?.lte?.toISOString().slice(0, 10)).toBe('2008-08-30');
      expect(range?.gte?.toISOString().slice(0, 10)).toBe('1995-08-31');
    });
  });

  describe('computeEnrollmentAge', () => {
    it('computes age from an ISO date string', () => {
      expect(computeEnrollmentAge('2000-01-01', refDate)).toBe(26);
    });

    it('accounts for birthdays not yet reached this year', () => {
      expect(computeEnrollmentAge('2000-12-01', refDate)).toBe(25);
    });
  });

  describe('formatExportDateDdMmYyyy', () => {
    it('formats ISO date-only strings', () => {
      expect(formatExportDateDdMmYyyy('1990-05-04')).toBe('04-05-1990');
    });

    it('formats Date values', () => {
      expect(
        formatExportDateDdMmYyyy(new Date('2024-01-15T10:30:00.000Z')),
      ).toBe('15-01-2024');
    });

    it('returns empty string for nullish values', () => {
      expect(formatExportDateDdMmYyyy(null)).toBe('');
      expect(formatExportDateDdMmYyyy(undefined)).toBe('');
    });
  });
});
