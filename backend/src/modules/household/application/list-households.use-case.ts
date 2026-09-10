import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { AppError } from '../../../platform/http/app-error';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../identity/application/user.repository';
import { fieldWorkerCanAccessWard } from '../../enrollment/application/field-worker-ward-access';
import {
  HOUSEHOLD_REPOSITORY,
  type HouseholdRepository,
  type ListHouseholdsQuery,
} from './household.repository';

@Injectable()
export class ListHouseholdsUseCase {
  constructor(
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(
    actor: AuthenticatedUser,
    query: Pick<
      ListHouseholdsQuery,
      'cursor' | 'limit' | 'wardId' | 'lga' | 'search' | 'householdCode'
    >,
  ) {
    if (query.wardId && actor.role === 'field_worker') {
      const user = await this.users.findById(actor.id);
      if (
        !fieldWorkerCanAccessWard(user?.assignedWards ?? [], query.wardId)
      ) {
        throw new AppError(
          'FORBIDDEN_WARD',
          'Field workers can only view households in their assigned wards',
          403,
        );
      }
    }

    let wardIds: string[] | undefined;
    if (actor.role === 'field_worker') {
      const user = await this.users.findById(actor.id);
      const assigned = user?.assignedWards ?? [];
      if (assigned.length > 0) {
        wardIds = assigned.map((ward) => ward.id);
        if (query.wardId && !wardIds.includes(query.wardId)) {
          throw new AppError(
            'FORBIDDEN_WARD',
            'Field workers can only view households in their assigned wards',
            403,
          );
        }
      }
    }

    return this.households.list({
      ...query,
      ...(query.wardId ? {} : wardIds ? { wardIds } : {}),
    });
  }
}
