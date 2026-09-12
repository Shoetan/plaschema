import {
  formatHouseholdCodeSuffix,
  parseHouseholdCodeSuffix,
} from './household-code';

describe('household-code', () => {
  describe('parseHouseholdCodeSuffix', () => {
    it('extracts the numeric suffix after the final hyphen', () => {
      expect(parseHouseholdCodeSuffix('BAR-TAF-001')).toBe(1);
      expect(parseHouseholdCodeSuffix('JOS-VOM-042')).toBe(42);
    });

    it('returns null for invalid codes', () => {
      expect(parseHouseholdCodeSuffix('BAR-TAF')).toBeNull();
      expect(parseHouseholdCodeSuffix('BAR-TAF-ABC')).toBeNull();
    });
  });

  describe('formatHouseholdCodeSuffix', () => {
    it('zero-pads to three digits', () => {
      expect(formatHouseholdCodeSuffix(1)).toBe('001');
      expect(formatHouseholdCodeSuffix(42)).toBe('042');
      expect(formatHouseholdCodeSuffix(1000)).toBe('1000');
    });
  });
});
