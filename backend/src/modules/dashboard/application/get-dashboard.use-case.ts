import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import {
  ACTIVITY_LOG_REPOSITORY,
  type ActivityLogRepository,
} from '../../activity-log/application/activity-log.repository';
import type { DashboardOverview, DashboardQuery } from '../domain/dashboard';
import { resolveDashboardPeriodWindow } from '../domain/dashboard-period';
import {
  DASHBOARD_REPOSITORY,
  type DashboardRepository,
} from './dashboard.repository';

const RECENT_ACTIVITY_LIMIT = 10;

@Injectable()
export class GetDashboardUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboard: DashboardRepository,
    @Inject(ACTIVITY_LOG_REPOSITORY)
    private readonly activityLogs: ActivityLogRepository,
  ) {}

  async execute(query: DashboardQuery): Promise<DashboardOverview> {
    if (query.wardId) {
      const wardLga = await this.dashboard.findWardLga(query.wardId);
      if (!wardLga) {
        throw new AppError('WARD_NOT_FOUND', 'Ward not found', 404);
      }
      if (query.lga && query.lga !== wardLga) {
        throw new AppError(
          'WARD_LGA_MISMATCH',
          'wardId does not belong to the specified lga',
          400,
        );
      }
    }

    const window = resolveDashboardPeriodWindow(query.period);

    const [overview, recentActivity] = await Promise.all([
      this.dashboard.loadOverview(query, window),
      this.activityLogs.findRecent(
        {
          wardId: query.wardId,
          lga: query.wardId ? undefined : query.lga,
          occurredFrom: window.start,
          occurredTo: window.end,
        },
        RECENT_ACTIVITY_LIMIT,
      ),
    ]);

    return {
      filters: {
        lga: query.lga ?? null,
        wardId: query.wardId ?? null,
        period: query.period,
        trend: query.trend,
        periodStart: window.start,
        periodEnd: window.end,
      },
      ...overview,
      recentActivity: recentActivity.map((entry) => ({
        id: entry.id,
        category: entry.category,
        action: entry.action,
        summary: entry.summary,
        ward: entry.ward,
        actor: entry.actor,
        occurredAt: entry.occurredAt,
      })),
    };
  }
}
