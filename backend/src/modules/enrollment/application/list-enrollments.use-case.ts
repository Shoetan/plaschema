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
  type ListEnrollmentsQuery,
} from './enrollment.repository';

@Injectable()
export class ListEnrollmentsUseCase {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollments: EnrollmentRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(
    actor: AuthenticatedUser,
    query: Omit<ListEnrollmentsQuery, 'wardIds' | 'enrolledByUserId'> & {
      enrolledByMe?: boolean;
    },
  ) {
    let wardIds: string[] | undefined;

    if (actor.role === 'field_worker') {
      const user = await this.users.findById(actor.id);
      wardIds = (user?.assignedWards ?? []).map((ward) => ward.id);
      if (wardIds.length === 0) {
        return {
          items: [],
          total: 0,
          page: query.page,
          pageSize: query.pageSize,
        };
      }

      if (query.wardId && !wardIds.includes(query.wardId)) {
        throw new AppError(
          'FORBIDDEN_WARD',
          'Field workers can only list enrollments in their assigned wards',
          403,
        );
      }
    }

    return this.enrollments.list({
      page: query.page,
      pageSize: query.pageSize,
      wardId: query.wardId,
      wardIds: query.wardId ? undefined : wardIds,
      enrolledByUserId: query.enrolledByMe ? actor.id : undefined,
      search: query.search,
    });
  }
}
