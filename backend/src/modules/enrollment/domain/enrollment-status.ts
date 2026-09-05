import type { EnrollmentStatus } from './enrollment';

/** Admin activate/deactivate targets (deceased is handled separately). */
export const ENROLLMENT_ADMIN_STATUS_TARGETS = ['active', 'disabled'] as const;

export type EnrollmentAdminStatusTarget =
  (typeof ENROLLMENT_ADMIN_STATUS_TARGETS)[number];

/**
 * Whether an enrollment may move from `from` to admin target `to`.
 * Same-status is not a transition (caller treats as unchanged).
 * `deceased` cannot be changed via activate/deactivate.
 */
export function canTransitionEnrollmentStatus(
  from: EnrollmentStatus,
  to: EnrollmentAdminStatusTarget,
): boolean {
  if (from === to) {
    return false;
  }
  if (from === 'deceased') {
    return false;
  }
  if (to === 'active') {
    return from === 'pending' || from === 'disabled';
  }
  return from === 'pending' || from === 'active';
}
