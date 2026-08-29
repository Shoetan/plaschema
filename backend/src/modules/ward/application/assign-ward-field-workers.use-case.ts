import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { AppError } from '../../../platform/http/app-error';
import { RecordActivityUseCase } from '../../activity-log/application/record-activity.use-case';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../identity/application/user.repository';
import {
  WARD_REPOSITORY,
  type WardRepository,
} from './ward.repository';

@Injectable()
export class AssignWardFieldWorkersUseCase {
  constructor(
    @Inject(WARD_REPOSITORY) private readonly wards: WardRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly recordActivity: RecordActivityUseCase,
  ) {}

  async execute(
    actor: AuthenticatedUser,
    wardId: string,
    fieldWorkerIds: string[],
  ) {
    const ward = await this.wards.findById(wardId);
    if (!ward) {
      throw new AppError('WARD_NOT_FOUND', 'Ward not found', 404);
    }

    const uniqueIds = [...new Set(fieldWorkerIds)];
    const validatedWorkers =
      uniqueIds.length > 0
        ? await this.users.findFieldWorkersByIds(uniqueIds)
        : [];

    if (validatedWorkers.length !== uniqueIds.length) {
      throw new AppError(
        'FIELD_WORKER_NOT_FOUND',
        'One or more field workers were not found',
        400,
      );
    }

    const workersById = new Map(
      validatedWorkers.map((worker) => [worker.id, worker.name]),
    );

    const result = await this.wards.assignFieldWorkers(wardId, uniqueIds);

    await Promise.all(
      result.addedUserIds.map((userId) =>
        this.recordActivity.execute({
          category: 'user',
          action: 'assigned',
          summary: `${workersById.get(userId) ?? 'Field worker'} assigned to ${ward.name}`,
          wardId,
          actorUserId: actor.id,
          metadata: { userId },
        }),
      ),
    );

    const count = uniqueIds.length;
    const workerLabel = count === 1 ? 'field worker' : 'field workers';

    return {
      message: `${count} ${workerLabel} assigned to ${ward.name}`,
    };
  }
}
