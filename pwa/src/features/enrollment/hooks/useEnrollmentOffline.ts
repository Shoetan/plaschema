import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'

import { useAuthStore } from '@/features/auth/stores/auth.store'
import { offlineDb } from '@/lib/offline-db'

import { fetchOwnFieldWorkerDetail } from '../services'
import { syncPendingEnrollments, syncReferenceData } from '../services/sync.service'

export function useEnrollmentDraft(ownerUserId: string) {
  return useLiveQuery(async () => (await offlineDb.drafts.get(ownerUserId)) ?? null, [ownerUserId])
}

export function useLocalEnrollments(ownerUserId: string) {
  return useLiveQuery(
    () => offlineDb.enrollments.where('ownerUserId').equals(ownerUserId).reverse().sortBy('capturedAt'),
    [ownerUserId],
    [],
  )
}

export function useLocalEnrollment(localId: string) {
  return useLiveQuery(() => offlineDb.enrollments.get(localId), [localId])
}

export function useDeviceSyncState(ownerUserId: string) {
  return useLiveQuery(() => offlineDb.syncState.get(ownerUserId), [ownerUserId])
}

export function useEnrollmentReferences(ownerUserId: string) {
  const wards = useLiveQuery(() => offlineDb.wards.where('ownerUserId').equals(ownerUserId).toArray(), [ownerUserId], [])
  const facilities = useLiveQuery(() => offlineDb.facilities.where('ownerUserId').equals(ownerUserId).toArray(), [ownerUserId], [])
  const metadata = useLiveQuery(() => offlineDb.referenceMetadata.get(ownerUserId), [ownerUserId])
  return { wards, facilities, metadata }
}

export function useReferenceSync() {
  const user = useAuthStore((state) => state.user)!
  return useMutation({ mutationFn: () => syncReferenceData(user.id, user.assignedWards.map((ward) => ward.id)) })
}

export function useEnrollmentSync() {
  const user = useAuthStore((state) => state.user)!
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => syncPendingEnrollments(user.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['field-worker', 'own-detail', user.id] }),
  })
}

export function useOwnFieldWorkerDetail() {
  const user = useAuthStore((state) => state.user)
  const query = useQuery({
    queryKey: ['field-worker', 'own-detail', user?.id],
    queryFn: ({ signal }) => fetchOwnFieldWorkerDetail(user!.id, signal),
    enabled: Boolean(user && navigator.onLine),
    staleTime: 30_000,
  })
  const cachedStats = useLiveQuery(async () => user ? (await offlineDb.workerStats.get(user.id))?.stats : undefined, [user?.id])
  useEffect(() => {
    if (!user || !query.data) return
    void offlineDb.workerStats.put({ ownerUserId: user.id, stats: query.data.stats, cachedAt: new Date().toISOString() })
  }, [query.data, user])
  return { ...query, effectiveStats: query.data?.stats ?? cachedStats }
}
