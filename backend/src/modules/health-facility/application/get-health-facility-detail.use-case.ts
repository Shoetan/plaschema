import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import type { ActivityLogEntry } from '../../activity-log/domain/activity-log';
import {
  ACTIVITY_LOG_REPOSITORY,
  type ActivityLogRepository,
} from '../../activity-log/application/activity-log.repository';
import {
  CAPITATION_REPOSITORY,
  type CapitationRepository,
} from '../../capitation/application/capitation.repository';
import { WARD_STATE } from '../../ward/domain/ward';
import type {
  HealthFacility,
  HealthFacilityCapitation,
  HealthFacilityDetailStats,
} from '../domain/health-facility';
import {
  HEALTH_FACILITY_REPOSITORY,
  type HealthFacilityRepository,
} from './health-facility.repository';

export type HealthFacilityDetail = {
  facility: HealthFacility & { state: typeof WARD_STATE };
  stats: HealthFacilityDetailStats;
  capitation: HealthFacilityCapitation;
  activityLog: ActivityLogEntry[];
};

@Injectable()
export class GetHealthFacilityDetailUseCase {
  constructor(
    @Inject(HEALTH_FACILITY_REPOSITORY)
    private readonly facilities: HealthFacilityRepository,
    @Inject(ACTIVITY_LOG_REPOSITORY)
    private readonly activityLogs: ActivityLogRepository,
    @Inject(CAPITATION_REPOSITORY)
    private readonly capitation: CapitationRepository,
  ) {}

  async execute(id: string): Promise<HealthFacilityDetail> {
    const facility = await this.facilities.findById(id);
    if (!facility) {
      throw new AppError(
        'HEALTH_FACILITY_NOT_FOUND',
        'Health facility not found',
        404,
      );
    }

    const aggregates = await this.facilities.findDetailAggregates(id);
    if (!aggregates) {
      throw new AppError(
        'HEALTH_FACILITY_NOT_FOUND',
        'Health facility not found',
        404,
      );
    }

    const [activityLog, latestActivity, capitationDetail] = await Promise.all([
      this.activityLogs.findRecentByHealthFacility(id, 50),
      this.activityLogs.findLatestByHealthFacility(id),
      this.capitation.findFacilityCapitation(id),
    ]);

    const lastActivityAt =
      latestActivity?.occurredAt ?? aggregates.stats.lastActivityAt;

    return {
      facility: { ...facility, state: WARD_STATE },
      stats: {
        ...aggregates.stats,
        currentCapitation: capitationDetail.currentAmount,
        lastActivityAt,
      },
      capitation: capitationDetail,
      activityLog,
    };
  }
}
