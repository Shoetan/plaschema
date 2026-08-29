import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import type { ActivityLogEntry } from '../../activity-log/domain/activity-log';
import {
  ACTIVITY_LOG_REPOSITORY,
  type ActivityLogRepository,
} from '../../activity-log/application/activity-log.repository';
import type {
  FieldWorkerDetailOverview,
  FieldWorkerDetailStats,
  FieldWorkerDetailWard,
} from '../domain/user';
import {
  USER_REPOSITORY,
  type UserRepository,
} from './user.repository';

export type FieldWorkerDetail = {
  fieldWorker: FieldWorkerDetailOverview;
  stats: FieldWorkerDetailStats;
  wards: FieldWorkerDetailWard[];
  activityLog: ActivityLogEntry[];
};

@Injectable()
export class GetFieldWorkerDetailUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(ACTIVITY_LOG_REPOSITORY)
    private readonly activityLogs: ActivityLogRepository,
  ) {}

  async execute(id: string): Promise<FieldWorkerDetail> {
    const user = await this.users.findById(id);
    if (!user || user.role !== 'field_worker') {
      throw new AppError('USER_NOT_FOUND', 'Field worker not found', 404);
    }

    const aggregates = await this.users.findFieldWorkerDetailAggregates(id);
    if (!aggregates) {
      throw new AppError('USER_NOT_FOUND', 'Field worker not found', 404);
    }

    const activityLog = await this.activityLogs.findRecentByActor(id, 50);

    return {
      fieldWorker: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      stats: aggregates.stats,
      wards: aggregates.wards,
      activityLog,
    };
  }
}
