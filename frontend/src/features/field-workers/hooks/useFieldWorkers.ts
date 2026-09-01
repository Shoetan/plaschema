import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchFieldWorkers } from '../services'
import type { FieldWorkerListParams } from '../types'

export function useFieldWorkers(params: FieldWorkerListParams) {
  return useQuery({
    queryKey: ['field-workers', params],
    queryFn: () => fetchFieldWorkers(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
