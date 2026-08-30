import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { getApiErrorStatus } from '@/api'

import { fetchCurrentAdmin } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'

export function useAuthSession() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const status = useAuthStore((state) => state.status)
  const completeRestore = useAuthStore((state) => state.completeRestore)
  const clearSession = useAuthStore((state) => state.clearSession)

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentAdmin,
    enabled: Boolean(accessToken) && status === 'restoring',
    retry: (failureCount, error) =>
      getApiErrorStatus(error) !== 401 && failureCount < 1,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (status === 'restoring' && query.data) {
      completeRestore(query.data)
    }
  }, [completeRestore, query.data, status])

  useEffect(() => {
    if (
      status === 'restoring' &&
      query.isError &&
      getApiErrorStatus(query.error) === 401
    ) {
      clearSession('expired')
    }
  }, [clearSession, query.error, query.isError, status])

  return query
}
