import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useMatches } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/stores/auth.store'

import { AdminSidebar } from './admin-sidebar'
import { AdminTopBar } from './admin-top-bar'

export function ProtectedLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const matches = useMatches()
  const title = matches.findLast(
    (match) => typeof (match.handle as { title?: unknown } | undefined)?.title === 'string',
  )?.handle as { title?: string } | undefined

  useEffect(() => {
    document.title = title?.title ? `${title.title} | PLASCHEMA` : 'PLASCHEMA'
  }, [title?.title])

  if (status === 'unauthenticated') {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate replace state={{ from }} to="/login" />
  }

  if (status === 'restoring' || !user) return null

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <AdminSidebar
        mobileOpen={menuOpen}
        onMobileClose={() => setMenuOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col bg-muted/40">
        <AdminTopBar onMenuOpen={() => setMenuOpen(true)} />
        <main className="flex min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
