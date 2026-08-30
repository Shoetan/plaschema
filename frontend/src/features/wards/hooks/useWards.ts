import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'

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

export function useWardOptions(search: string) {
  return useInfiniteQuery({
    queryKey: wardKeys.options(search),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchWards({ cursor: pageParam, limit: 100, search: search || undefined }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? (lastPage.meta.nextCursor ?? undefined) : undefined,
  })
}
