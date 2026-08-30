import { useQueryClient } from '@tanstack/react-query'
import { useEffect, type PropsWithChildren } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { useAuthSession } from '../hooks'
import { useAuthStore } from '../stores/auth.store'

export function AuthSessionGate({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const status = useAuthStore((state) => state.status)
  const notice = useAuthStore((state) => state.notice)
  const consumeNotice = useAuthStore((state) => state.consumeNotice)
  const logout = useAuthStore((state) => state.logout)
  const sessionQuery = useAuthSession()

  useEffect(() => {
    if (notice !== 'expired') return

    queryClient.removeQueries({ queryKey: ['auth'] })
    toast.error('Your session has expired. Please sign in again.')
    consumeNotice()
  }, [consumeNotice, notice, queryClient])

  if (status !== 'restoring') return children

  if (sessionQuery.isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <div className="w-full max-w-sm rounded-2xl border bg-card p-6 text-center shadow-card">
          <h1 className="text-lg font-semibold">Unable to restore your session</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Check your connection and try again. Your saved session has not been
            removed.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button onClick={() => void sessionQuery.refetch()} type="button">
              Retry
            </Button>
            <Button onClick={logout} type="button" variant="outline">
              Sign out
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-muted/40"
    >
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="size-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
        Restoring your session…
      </div>
    </main>
  )
}
