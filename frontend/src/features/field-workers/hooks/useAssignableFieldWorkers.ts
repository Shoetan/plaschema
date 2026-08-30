import { useInfiniteQuery } from '@tanstack/react-query'

import { fetchAssignableFieldWorkers } from '../services/field-worker.service'

export const fieldWorkerKeys = {
  all: ['field-workers'] as const,
  assignable: (search: string) =>
    [...fieldWorkerKeys.all, 'assignable', { search }] as const,
}

export function useAssignableFieldWorkers(search: string) {
  return useInfiniteQuery({
    queryKey: fieldWorkerKeys.assignable(search),
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
  })
}
