import {
  formatEnrollmentId,
  formatHouseholdMemberEnrollmentId,
} from './enrollment-id';

describe('formatEnrollmentId', () => {
  it('pads sequence to at least 3 digits', () => {
    expect(formatEnrollmentId(2026, 1)).toBe('PL/CBHI/2026/001');
    expect(formatEnrollmentId(2026, 12)).toBe('PL/CBHI/2026/012');
    expect(formatEnrollmentId(2026, 1000)).toBe('PL/CBHI/2026/1000');
  });
});

describe('formatHouseholdMemberEnrollmentId', () => {
  it('appends a two-digit member suffix to the head enrollment ID', () => {
    expect(
      formatHouseholdMemberEnrollmentId('PL/CBHI/2026/010', 1),
    ).toBe('PL/CBHI/2026/010-01');
    expect(
      formatHouseholdMemberEnrollmentId('PL/CBHI/2026/010', 12),
    ).toBe('PL/CBHI/2026/010-12');
  });
});
