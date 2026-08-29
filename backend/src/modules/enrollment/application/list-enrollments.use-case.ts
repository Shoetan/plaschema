import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { AppError } from '../../../platform/http/app-error';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../identity/application/user.repository';
import { fieldWorkerWardListFilter } from './field-worker-ward-access';
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepository,
  type ListEnrollmentsQuery,
} from './enrollment.repository';

function startOfUtcDay(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function endOfUtcDay(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59.999Z`);
}

@Injectable()
export class ListEnrollmentsUseCase {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollments: EnrollmentRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(
    actor: AuthenticatedUser,
    query: Omit<ListEnrollmentsQuery, 'wardIds' | 'enrolledByUserId' | 'createdFrom' | 'createdTo'> & {
      enrolledByMe?: boolean;
      createdFrom?: string;
      createdTo?: string;
    },
  ) {
    let wardIds: string[] | undefined;

    if (actor.role === 'field_worker') {
      const user = await this.users.findById(actor.id);
      const assignedWards = user?.assignedWards ?? [];
      wardIds = fieldWorkerWardListFilter(assignedWards);

      if (query.wardId && wardIds && !wardIds.includes(query.wardId)) {
        throw new AppError(
          'FORBIDDEN_WARD',
          'Field workers can only list enrollments in their assigned wards',
          403,
        );
      }
    }

    return this.enrollments.list({
      cursor: query.cursor,
      limit: query.limit,
      wardId: query.wardId,
      wardIds: query.wardId ? undefined : wardIds,
      enrolledByUserId: query.enrolledByMe ? actor.id : undefined,
      search: query.search,
      status: query.status,
      category: query.category,
      printedStatus: query.printedStatus,
      lga: query.lga,
      beneficiaryName: query.beneficiaryName,
      enrollmentId: query.enrollmentId,
      createdFrom: query.createdFrom
        ? startOfUtcDay(query.createdFrom)
        : undefined,
      createdTo: query.createdTo ? endOfUtcDay(query.createdTo) : undefined,
    });
  }
}
