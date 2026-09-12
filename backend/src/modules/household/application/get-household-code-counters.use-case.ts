import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { AppError } from '../../../platform/http/app-error';
import { fieldWorkerWardListFilter } from '../../enrollment/application/field-worker-ward-access';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../identity/application/user.repository';
import { formatHouseholdCodeSuffix } from '../domain/household-code';
import {
  HOUSEHOLD_REPOSITORY,
  type HouseholdRepository,
} from './household.repository';

export type HouseholdCodeCounter = {
  wardId: string;
  lastSuffix: string | null;
};

@Injectable()
export class GetHouseholdCodeCountersUseCase {
  constructor(
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(actor: AuthenticatedUser): Promise<HouseholdCodeCounter[]> {
    if (actor.role !== 'field_worker') {
      throw new AppError(
        'FORBIDDEN',
        'Only enrollment officers can sync household code counters',
        403,
      );
    }

    const user = await this.users.findById(actor.id);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    const assignedWardIds = fieldWorkerWardListFilter(user.assignedWards);
    const wardIds =
      assignedWardIds ??
      (await this.households.findWardIdsWithHouseholds());

    if (wardIds.length === 0) {
      return [];
    }

    const highestByWard =
      await this.households.getHighestCodeSuffixByWardIds(wardIds);

    return wardIds.map((wardId) => {
      const highest = highestByWard.get(wardId);
      return {
        wardId,
        lastSuffix:
          highest === undefined ? null : formatHouseholdCodeSuffix(highest),
      };
    });
  }
}
