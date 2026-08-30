import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { AppError } from '../../../platform/http/app-error';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../identity/application/user.repository';
import {
  HEALTH_FACILITY_REPOSITORY,
  type HealthFacilityRepository,
} from '../../health-facility/application/health-facility.repository';
import { fieldWorkerCanAccessWard, fieldWorkerWardListFilter } from './field-worker-ward-access';
import type { ListEnrollmentsQuery } from './enrollment.repository';

function startOfUtcDay(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function endOfUtcDay(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59.999Z`);
}

export type EnrollmentListFilterInput = Omit<
  ListEnrollmentsQuery,
  | 'wardIds'
  | 'enrolledByUserId'
  | 'createdFrom'
  | 'createdTo'
  | 'cursor'
  | 'limit'
> & {
  enrolledByMe?: boolean;
  enrolledByUserId?: string;
  healthFacilityId?: string;
  createdFrom?: string;
  createdTo?: string;
};

@Injectable()
export class ResolveEnrollmentListFiltersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(HEALTH_FACILITY_REPOSITORY)
    private readonly facilities: HealthFacilityRepository,
  ) {}

  async execute(
    actor: AuthenticatedUser,
    query: EnrollmentListFilterInput,
  ): Promise<Omit<ListEnrollmentsQuery, 'cursor' | 'limit'>> {
    let wardIds: string[] | undefined;
    let enrolledByUserId: string | undefined;
    const healthFacilityId = query.healthFacilityId;

    if (healthFacilityId) {
      const facility = await this.facilities.findById(healthFacilityId);
      if (!facility) {
        throw new AppError(
          'HEALTH_FACILITY_NOT_FOUND',
          'Health facility not found',
          404,
        );
      }

      if (actor.role === 'field_worker') {
        const user = await this.users.findById(actor.id);
        if (
          !fieldWorkerCanAccessWard(user?.assignedWards ?? [], facility.wardId)
        ) {
          throw new AppError(
            'FORBIDDEN_WARD',
            'Field workers can only access enrollments in their assigned wards',
            403,
          );
        }
      }
    }

    if (actor.role === 'field_worker') {
      const user = await this.users.findById(actor.id);
      const assignedWards = user?.assignedWards ?? [];
      wardIds = fieldWorkerWardListFilter(assignedWards);

      if (query.wardId && wardIds && !wardIds.includes(query.wardId)) {
        throw new AppError(
          'FORBIDDEN_WARD',
          'Field workers can only access enrollments in their assigned wards',
          403,
        );
      }

      if (query.enrolledByUserId) {
        throw new AppError(
          'FORBIDDEN',
          'Not allowed to filter by field worker',
          403,
        );
      }

      enrolledByUserId = query.enrolledByMe ? actor.id : undefined;
    } else if (query.enrolledByMe) {
      enrolledByUserId = actor.id;
    } else if (query.enrolledByUserId) {
      enrolledByUserId = query.enrolledByUserId;
    }

    return {
      wardId: query.wardId,
      wardIds: query.wardId ? undefined : wardIds,
      healthFacilityId,
      enrolledByUserId,
      search: query.search,
      status: query.status,
      category: query.category,
      printedStatus: query.printedStatus,
      lga: query.lga,
      beneficiaryName: query.beneficiaryName,
      enrollmentId: query.enrollmentId,
      ageMin: query.ageMin,
      ageMax: query.ageMax,
      createdFrom: query.createdFrom
        ? startOfUtcDay(query.createdFrom)
        : undefined,
      createdTo: query.createdTo ? endOfUtcDay(query.createdTo) : undefined,
    };
  }
}
