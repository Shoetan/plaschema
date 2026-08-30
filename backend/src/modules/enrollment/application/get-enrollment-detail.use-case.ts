import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { AppError } from '../../../platform/http/app-error';
import type { ActivityLogEntry } from '../../activity-log/domain/activity-log';
import {
  ACTIVITY_LOG_REPOSITORY,
  type ActivityLogRepository,
} from '../../activity-log/application/activity-log.repository';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../identity/application/user.repository';
import type { EnrollmentDetailOverview } from '../domain/enrollment';
import { enrollmentBeneficiaryName } from '../domain/enrollment-id';
import { fieldWorkerCanAccessWard } from './field-worker-ward-access';
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepository,
} from './enrollment.repository';

export type EnrollmentDetail = {
  overview: EnrollmentDetailOverview;
  activityLog: ActivityLogEntry[];
};

@Injectable()
export class GetEnrollmentDetailUseCase {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollments: EnrollmentRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(ACTIVITY_LOG_REPOSITORY)
    private readonly activityLogs: ActivityLogRepository,
  ) {}

  async execute(actor: AuthenticatedUser, id: string): Promise<EnrollmentDetail> {
    const enrollment = await this.enrollments.findById(id);
    if (!enrollment) {
      throw new AppError('ENROLLMENT_NOT_FOUND', 'Enrollment not found', 404);
    }

    if (actor.role === 'field_worker') {
      const user = await this.users.findById(actor.id);
      if (
        !fieldWorkerCanAccessWard(
          user?.assignedWards ?? [],
          enrollment.wardId,
        )
      ) {
        throw new AppError('ENROLLMENT_NOT_FOUND', 'Enrollment not found', 404);
      }
    }

    const beneficiaryName = enrollmentBeneficiaryName(enrollment);
    const activityLog = await this.activityLogs.findRecentByEnrollment(id, 50);

    return {
      overview: {
        id: enrollment.id,
        beneficiaryName,
        enrollmentId: enrollment.enrollmentId,
        status: enrollment.status,
        syncStatus: 'synced',
        personalDetails: {
          fullName: beneficiaryName,
          enrollmentId: enrollment.enrollmentId,
          dateOfBirth: enrollment.dateOfBirth,
          gender: enrollment.gender,
          nin: enrollment.nin,
          phone: enrollment.phone,
          address: enrollment.residentialAddress,
        },
      },
      activityLog,
    };
  }
}
