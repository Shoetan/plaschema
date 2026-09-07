import { _get, type ApiResponse } from '@/api'

import type { DashboardOverview, DashboardParams } from '../types'

export async function fetchDashboard(params: DashboardParams): Promise<DashboardOverview> {
  const response = await _get<ApiResponse<DashboardOverview>>('/dashboard', {
    lga: params.lga,
    wardId: params.wardId,
    period: params.period,
    trend: params.trend,
  })
  return response.data.data
}
