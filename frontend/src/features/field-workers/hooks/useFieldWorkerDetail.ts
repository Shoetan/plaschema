import { useQuery } from '@tanstack/react-query'

import { fetchFieldWorkerDetail } from '../services'

export function useFieldWorkerDetail(id: string) {
  return useQuery({
    queryKey: ['field-workers', 'detail', id],
    queryFn: () => fetchFieldWorkerDetail(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  })
}
