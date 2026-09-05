import type { DashboardOverview, DashboardQuery } from '../domain/dashboard';
import type { DashboardPeriodWindow } from '../domain/dashboard-period';

export const DASHBOARD_REPOSITORY = Symbol('DASHBOARD_REPOSITORY');

export interface DashboardRepository {
  findWardLga(wardId: string): Promise<string | null>;
  loadOverview(
    query: DashboardQuery,
    window: DashboardPeriodWindow,
  ): Promise<Omit<DashboardOverview, 'filters' | 'recentActivity'>>;
}
