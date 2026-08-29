import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { AppError } from '../../../platform/http/app-error';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../identity/application/user.repository';
import { AttachEnrollmentFileUrls } from './attach-enrollment-file-urls';
import { fieldWorkerCanAccessWard } from './field-worker-ward-access';
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepository,
} from './enrollment.repository';

@Injectable()
export class GetEnrollmentUseCase {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollments: EnrollmentRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly attachFileUrls: AttachEnrollmentFileUrls,
  ) {}

  async execute(actor: AuthenticatedUser, id: string) {
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

    return this.attachFileUrls.forOne(enrollment);
  }
}
