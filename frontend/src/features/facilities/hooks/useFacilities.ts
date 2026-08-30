import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchHealthFacilities, fetchHealthFacilityDetail } from '../services'
import type { HealthFacilityListParams } from '../types'
import { facilityKeys } from './facility.keys'

export function useHealthFacilities(params: HealthFacilityListParams) {
  return useQuery({
    queryKey: facilityKeys.list(params),
    queryFn: () => fetchHealthFacilities(params),
    placeholderData: keepPreviousData,
  })
}

export function useHealthFacilityDetail(id: string) {
  return useQuery({
    queryKey: facilityKeys.detail(id),
    queryFn: () => fetchHealthFacilityDetail(id),
  })
}
