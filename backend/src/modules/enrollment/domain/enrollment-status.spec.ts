import {
  canTransitionEnrollmentStatus,
  type EnrollmentAdminStatusTarget,
} from './enrollment-status';

describe('canTransitionEnrollmentStatus', () => {
  it.each([
    ['pending', 'active', true],
    ['disabled', 'active', true],
    ['active', 'disabled', true],
    ['pending', 'disabled', true],
    ['active', 'active', false],
    ['disabled', 'disabled', false],
    ['deceased', 'active', false],
    ['deceased', 'disabled', false],
  ] as const)(
    'from %s to %s → %s',
    (from, to, expected) => {
      expect(
        canTransitionEnrollmentStatus(from, to as EnrollmentAdminStatusTarget),
      ).toBe(expected);
    },
  );
});
