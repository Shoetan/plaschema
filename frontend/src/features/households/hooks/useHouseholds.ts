import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchHouseholdDetail, fetchHouseholds } from '../services'
import type { HouseholdListParams } from '../types'
import { householdKeys } from './household.keys'

export function useHouseholds(params: HouseholdListParams, enabled = true) {
  return useQuery({
    queryKey: householdKeys.list(params),
    queryFn: () => fetchHouseholds(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useHouseholdDetail(id: string) {
  return useQuery({
    queryKey: householdKeys.detail(id),
    queryFn: () => fetchHouseholdDetail(id),
  })
}
