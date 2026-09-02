import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { getApiErrorStatus } from '@/api'
import { useNetworkStatus } from '@/hooks/use-network-status'

import { fetchCurrentFieldWorker } from '../services'
import { useAuthStore } from '../stores/auth.store'
import { FieldWorkerAccessError } from '../utils'

export function useAuthSession() {
  const isOnline = useNetworkStatus()
  const accessToken = useAuthStore((state) => state.accessToken)
  const status = useAuthStore((state) => state.status)
  const validation = useAuthStore((state) => state.validation)
  const completeRestore = useAuthStore((state) => state.completeRestore)
  const continueOffline = useAuthStore((state) => state.continueOffline)
  const clearSession = useAuthStore((state) => state.clearSession)

  const query = useQuery({
    queryKey: ['auth', 'me', accessToken],
    queryFn: ({ signal }) => fetchCurrentFieldWorker(signal),
    enabled: Boolean(accessToken) && isOnline && (status === 'restoring' || validation === 'offline'),
    retry: (failureCount, error) => getApiErrorStatus(error) !== 401 && !(error instanceof FieldWorkerAccessError) && failureCount < 1,
    refetchInterval: validation === 'offline' && isOnline ? 60_000 : false,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (status === 'restoring' && !isOnline) continueOffline()
  }, [continueOffline, isOnline, status])

  useEffect(() => {
    if (query.data && accessToken) completeRestore(query.data, 'verified')
  }, [accessToken, completeRestore, query.data])

  useEffect(() => {
    if (query.isError && query.error instanceof FieldWorkerAccessError) clearSession('expired')
  }, [clearSession, query.error, query.isError])

  return { ...query, isOnline }
}
