import { formatEnrollmentId } from './enrollment-id';

describe('formatEnrollmentId', () => {
  it('pads sequence to at least 3 digits', () => {
    expect(formatEnrollmentId(2026, 1)).toBe('PL/CBHI/2026/001');
    expect(formatEnrollmentId(2026, 12)).toBe('PL/CBHI/2026/012');
    expect(formatEnrollmentId(2026, 1000)).toBe('PL/CBHI/2026/1000');
  });
});
