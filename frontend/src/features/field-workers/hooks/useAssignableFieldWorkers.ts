import { useInfiniteQuery } from '@tanstack/react-query'

import { fetchAssignableFieldWorkers } from '../services'

export function useAssignableFieldWorkers(search: string) {
  return useInfiniteQuery({
    queryKey: ['field-workers', 'assignable', { search }],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchAssignableFieldWorkers({
        cursor: pageParam,
        limit: 100,
        search: search || undefined,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore
        ? (lastPage.meta.nextCursor ?? undefined)
        : undefined,
    staleTime: 30_000,
  })
}
