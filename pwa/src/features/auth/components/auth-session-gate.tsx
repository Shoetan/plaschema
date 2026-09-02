import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'

import { useAuthSession } from '../hooks'
import { PWA_SESSION_STORAGE_KEY, useAuthStore } from '../stores/auth.store'

export function AuthSessionGate({ children }: PropsWithChildren) {
  const status = useAuthStore((state) => state.status)
  const expiresAt = useAuthStore((state) => state.expiresAt)
  const continueOffline = useAuthStore((state) => state.continueOffline)
  const clearSession = useAuthStore((state) => state.clearSession)
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage)
  const sessionQuery = useAuthSession()

  useEffect(() => {
    if (!expiresAt) return
    const remaining = expiresAt - Date.now()
    if (remaining <= 0) {
      clearSession('expired')
      return
    }
    const timer = window.setTimeout(() => clearSession('expired'), remaining)
    return () => window.clearTimeout(timer)
  }, [clearSession, expiresAt])

  useEffect(() => {
    function storageChanged(event: StorageEvent) {
      if (event.key === PWA_SESSION_STORAGE_KEY) hydrateFromStorage()
    }
    window.addEventListener('storage', storageChanged)
    return () => window.removeEventListener('storage', storageChanged)
  }, [hydrateFromStorage])

  if (status !== 'restoring') return children

  if (sessionQuery.isError) {
    return <main className="app-frame flex min-h-dvh items-center justify-center bg-neutral-50 p-6"><section className="card w-full p-6 text-center" role="alert"><h1 className="text-lg font-bold">Unable to verify your session</h1><p className="mt-2 text-sm text-neutral-500">The saved session is still valid. Retry when the service is available or continue offline using your saved profile.</p><div className="mt-5 flex flex-col gap-3"><button className="primary-button" onClick={() => void sessionQuery.refetch()} type="button">Retry</button><button className="secondary-button" onClick={continueOffline} type="button">Continue offline</button></div></section></main>
  }

  return <main aria-busy="true" aria-live="polite" className="app-frame flex min-h-dvh items-center justify-center bg-neutral-50"><div className="flex items-center gap-3 text-sm font-semibold text-neutral-500"><span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />Restoring your session…</div></main>
}
