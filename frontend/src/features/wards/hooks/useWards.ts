import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchWardDetail, fetchWards } from '../services'
import type { WardListParams } from '../types'
import { wardKeys } from './ward.keys'

export function useWards(params: WardListParams) {
  return useQuery({
    queryKey: wardKeys.list(params),
    queryFn: () => fetchWards(params),
    placeholderData: keepPreviousData,
  })
}

export function useWardDetail(id: string) {
  return useQuery({
    queryKey: wardKeys.detail(id),
    queryFn: () => fetchWardDetail(id),
  })
}
