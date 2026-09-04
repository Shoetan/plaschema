import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchCapitations } from '../services'
import type { CapitationListParams } from '../types'
import { capitationKeys } from './capitation.keys'

export function useCapitations(
  params: CapitationListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: capitationKeys.list(params),
    queryFn: () => fetchCapitations(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
