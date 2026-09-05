import type { DashboardParams } from '../types'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: (params: DashboardParams) => [...dashboardKeys.all, 'overview', params] as const,
}
