import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import type { ActivityLogEntry } from '../../activity-log/domain/activity-log';
import {
  ACTIVITY_LOG_REPOSITORY,
  type ActivityLogRepository,
} from '../../activity-log/application/activity-log.repository';
import { WARD_STATE, type Ward, type WardDetailAggregates } from '../domain/ward';
import {
  WARD_REPOSITORY,
  type WardRepository,
} from './ward.repository';

export type WardDetail = {
  ward: Ward & { state: typeof WARD_STATE };
  stats: WardDetailAggregates['stats'];
  enrollmentTrend: WardDetailAggregates['enrollmentTrend'];
  fieldWorkers: WardDetailAggregates['fieldWorkers'];
  healthFacilities: WardDetailAggregates['healthFacilities'];
  activityLog: ActivityLogEntry[];
};

@Injectable()
export class GetWardDetailUseCase {
  constructor(
    @Inject(WARD_REPOSITORY) private readonly wards: WardRepository,
    @Inject(ACTIVITY_LOG_REPOSITORY)
    private readonly activityLogs: ActivityLogRepository,
  ) {}

  async execute(id: string): Promise<WardDetail> {
    const ward = await this.wards.findById(id);
    if (!ward) {
      throw new AppError('WARD_NOT_FOUND', 'Ward not found', 404);
    }

    const [aggregates, activityLog, latestActivity] = await Promise.all([
      this.wards.findDetailAggregates(id),
      this.activityLogs.findRecentByWard(id, 50),
      this.activityLogs.findLatestByWard(id),
    ]);

    const lastActivityAt =
      latestActivity?.occurredAt ?? aggregates.stats.lastActivityAt;

    return {
      ward: { ...ward, state: WARD_STATE },
      stats: {
        ...aggregates.stats,
        lastActivityAt,
      },
      enrollmentTrend: aggregates.enrollmentTrend,
      fieldWorkers: aggregates.fieldWorkers,
      healthFacilities: aggregates.healthFacilities,
      activityLog,
    };
  }
}
