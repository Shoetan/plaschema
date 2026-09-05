import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchDashboard } from '../services'
import type { DashboardParams } from '../types'
import { dashboardKeys } from './dashboard.keys'

export function useDashboard(params: DashboardParams) {
  return useQuery({
    queryKey: dashboardKeys.overview(params),
    queryFn: () => fetchDashboard(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
