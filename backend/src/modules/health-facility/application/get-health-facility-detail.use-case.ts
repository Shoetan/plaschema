import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import type { ActivityLogEntry } from '../../activity-log/domain/activity-log';
import {
  ACTIVITY_LOG_REPOSITORY,
  type ActivityLogRepository,
} from '../../activity-log/application/activity-log.repository';
import { WARD_STATE } from '../../ward/domain/ward';
import type {
  HealthFacility,
  HealthFacilityCapitationStub,
  HealthFacilityDetailStats,
} from '../domain/health-facility';
import {
  HEALTH_FACILITY_REPOSITORY,
  type HealthFacilityRepository,
} from './health-facility.repository';

const CAPITATION_STUB: HealthFacilityCapitationStub = {
  implemented: false,
  currentAmount: null,
  currency: 'NGN',
  records: [],
};

export type HealthFacilityDetail = {
  facility: HealthFacility & { state: typeof WARD_STATE };
  stats: HealthFacilityDetailStats;
  capitation: HealthFacilityCapitationStub;
  activityLog: ActivityLogEntry[];
};

@Injectable()
export class GetHealthFacilityDetailUseCase {
  constructor(
    @Inject(HEALTH_FACILITY_REPOSITORY)
    private readonly facilities: HealthFacilityRepository,
    @Inject(ACTIVITY_LOG_REPOSITORY)
    private readonly activityLogs: ActivityLogRepository,
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

    const [activityLog, latestActivity] = await Promise.all([
      this.activityLogs.findRecentByHealthFacility(id, 50),
      this.activityLogs.findLatestByHealthFacility(id),
    ]);

    const lastActivityAt =
      latestActivity?.occurredAt ?? aggregates.stats.lastActivityAt;

    return {
      facility: { ...facility, state: WARD_STATE },
      stats: {
        ...aggregates.stats,
        lastActivityAt,
      },
      capitation: CAPITATION_STUB,
      activityLog,
    };
  }
}
