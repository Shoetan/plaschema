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
} from './household.repository';

@Injectable()
export class GetHouseholdUseCase {
  constructor(
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(actor: AuthenticatedUser, id: string) {
    const detail = await this.households.findDetail(id);
    if (!detail) {
      throw new AppError('HOUSEHOLD_NOT_FOUND', 'Household not found', 404);
    }

    if (actor.role === 'field_worker') {
      const user = await this.users.findById(actor.id);
      if (
        !fieldWorkerCanAccessWard(
          user?.assignedWards ?? [],
          detail.household.wardId,
        )
      ) {
        throw new AppError(
          'FORBIDDEN_WARD',
          'Field workers can only view households in their assigned wards',
          403,
        );
      }
    }

    return detail;
  }
}
