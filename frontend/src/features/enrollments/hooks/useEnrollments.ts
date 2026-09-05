import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchEnrollmentDetail, fetchEnrollments } from '../services'
import type { EnrollmentListParams } from '../types'
import { enrollmentKeys } from './enrollment.keys'

export function useEnrollments(params: EnrollmentListParams, enabled = true) {
  return useQuery({
    queryKey: enrollmentKeys.list(params),
    queryFn: () => fetchEnrollments(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useEnrollmentDetail(id: string) {
  return useQuery({
    queryKey: enrollmentKeys.detail(id),
    queryFn: () => fetchEnrollmentDetail(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  })
}
