import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useAuthStore } from '@/features/auth/stores/auth.store'

import { syncPendingEnrollments, syncReferenceDataIfNeeded } from '../services/sync.service'

export function OfflineEnrollmentCoordinator() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)

  useEffect(() => {
    if (status !== 'authenticated' || !user || !navigator.onLine) return
    const wardIds = user.assignedWards.map((ward) => ward.id)
    const run = async (refreshReferences: boolean) => {
      if (refreshReferences) {
        try { await syncReferenceDataIfNeeded(user.id, wardIds) } catch { /* Existing complete references remain usable. */ }
      }
      try {
        if (await syncPendingEnrollments(user.id)) {
          await queryClient.invalidateQueries({ queryKey: ['field-worker', 'own-detail', user.id] })
        }
      } catch { /* Queue remains durable and will retry after authentication/network recovery. */ }
    }
    void run(true)
    const onOnline = () => void run(true)
    window.addEventListener('online', onOnline)
    const interval = window.setInterval(() => { if (navigator.onLine) void run(false) }, 30_000)
    return () => {
      window.removeEventListener('online', onOnline)
      window.clearInterval(interval)
    }
  }, [queryClient, status, user])

  return null
}
