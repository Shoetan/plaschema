import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { AppError } from '../../../platform/http/app-error';
import { enrollmentBeneficiaryName } from '../domain/enrollment-id';
import {
  canTransitionEnrollmentStatus,
  type EnrollmentAdminStatusTarget,
} from '../domain/enrollment-status';
import { RecordActivityUseCase } from '../../activity-log/application/record-activity.use-case';
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepository,
  type EnrollmentStatusRow,
} from './enrollment.repository';

const MAX_STATUS_BATCH = 100;

export type EnrollmentStatusSkipReason =
  | 'not_found'
  | 'unchanged'
  | 'invalid_transition';

export type EnrollmentStatusSkip = {
  id: string;
  reason: EnrollmentStatusSkipReason;
  currentStatus?: EnrollmentStatusRow['status'];
};

export type UpdateEnrollmentStatusResult = {
  status: EnrollmentAdminStatusTarget;
  updated: number;
  updatedIds: string[];
  skipped: EnrollmentStatusSkip[];
};

@Injectable()
export class UpdateEnrollmentStatusUseCase {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollments: EnrollmentRepository,
    private readonly recordActivity: RecordActivityUseCase,
  ) {}

  async execute(
    actor: AuthenticatedUser,
    input: {
      enrollmentIds: string[];
      status: EnrollmentAdminStatusTarget;
    },
  ): Promise<UpdateEnrollmentStatusResult> {
    const uniqueIds = [...new Set(input.enrollmentIds)];

    if (uniqueIds.length < 1 || uniqueIds.length > MAX_STATUS_BATCH) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Select between 1 and ${MAX_STATUS_BATCH} beneficiaries`,
        400,
      );
    }

    if (uniqueIds.length !== input.enrollmentIds.length) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Duplicate enrollment IDs are not allowed',
        400,
      );
    }

    const rows = await this.enrollments.findManyStatusByIds(uniqueIds);
    const byId = new Map(rows.map((row) => [row.id, row]));

    const toUpdate: EnrollmentStatusRow[] = [];
    const skipped: EnrollmentStatusSkip[] = [];

    for (const id of uniqueIds) {
      const row = byId.get(id);
      if (!row) {
        skipped.push({ id, reason: 'not_found' });
        continue;
      }
      if (row.status === input.status) {
        skipped.push({
          id,
          reason: 'unchanged',
          currentStatus: row.status,
        });
        continue;
      }
      if (!canTransitionEnrollmentStatus(row.status, input.status)) {
        skipped.push({
          id,
          reason: 'invalid_transition',
          currentStatus: row.status,
        });
        continue;
      }
      toUpdate.push(row);
    }

    if (toUpdate.length > 0) {
      await this.enrollments.updateStatus(
        toUpdate.map((row) => row.id),
        input.status,
      );

      await Promise.all(
        toUpdate.map((row) => {
          const name = enrollmentBeneficiaryName(row);
          const verb =
            input.status === 'active' ? 'activated' : 'deactivated';
          return this.recordActivity.execute({
            category: 'enrollment',
            action: 'status_changed',
            summary: `${name} ${verb} by ${actor.name} (${row.status} → ${input.status})`,
            wardId: row.wardId,
            actorUserId: actor.id,
            enrollmentId: row.id,
            metadata: {
              fromStatus: row.status,
              toStatus: input.status,
            },
          });
        }),
      );
    }

    return {
      status: input.status,
      updated: toUpdate.length,
      updatedIds: toUpdate.map((row) => row.id),
      skipped,
    };
  }

  /** Single-id helper for PATCH /enrollments/:id — fails hard if not found. */
  async executeOne(
    actor: AuthenticatedUser,
    id: string,
    status: EnrollmentAdminStatusTarget,
  ): Promise<UpdateEnrollmentStatusResult> {
    const result = await this.execute(actor, {
      enrollmentIds: [id],
      status,
    });

    const skip = result.skipped[0];
    if (skip?.reason === 'not_found') {
      throw new AppError('ENROLLMENT_NOT_FOUND', 'Enrollment not found', 404);
    }
    if (skip?.reason === 'invalid_transition') {
      throw new AppError(
        'INVALID_STATUS_TRANSITION',
        `Cannot change status from ${skip.currentStatus} to ${status}`,
        409,
      );
    }

    return result;
  }
}
