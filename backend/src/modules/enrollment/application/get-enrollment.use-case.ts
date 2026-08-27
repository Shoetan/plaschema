import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { AppError } from '../../../platform/http/app-error';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../identity/application/user.repository';
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
  ) {}

  async execute(actor: AuthenticatedUser, id: string) {
    const enrollment = await this.enrollments.findById(id);
    if (!enrollment) {
      throw new AppError('ENROLLMENT_NOT_FOUND', 'Enrollment not found', 404);
    }

    if (actor.role === 'field_worker') {
      const user = await this.users.findById(actor.id);
      const assigned = new Set(
        (user?.assignedWards ?? []).map((ward) => ward.id),
      );
      if (!assigned.has(enrollment.wardId)) {
        throw new AppError('ENROLLMENT_NOT_FOUND', 'Enrollment not found', 404);
      }
    }

    return enrollment;
  }
}
