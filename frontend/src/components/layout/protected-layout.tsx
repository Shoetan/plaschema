import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useMatches } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/stores/auth.store'

import { AdminSidebar } from './admin-sidebar'
import { AdminTopBar } from './admin-top-bar'

interface RouteHandle {
  section?: string
  title?: string
}

function isRouteHandle(value: unknown): value is RouteHandle {
  if (!value || typeof value !== 'object') return false
  const handle = value as RouteHandle
  return typeof handle.title === 'string' || typeof handle.section === 'string'
}

export function ProtectedLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const matches = useMatches()
  const routeHandle = matches.findLast((match) => isRouteHandle(match.handle))?.handle
  const title = isRouteHandle(routeHandle)
    ? (routeHandle.section ?? routeHandle.title ?? 'Admin')
    : 'Admin'

  useEffect(() => {
    document.title = `${title} | PLASCHEMA`
  }, [title])

  if (status === 'unauthenticated') {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate replace state={{ from }} to="/login" />
  }

  if (status === 'restoring' || !user) return null

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-background">
      <AdminSidebar
        mobileOpen={menuOpen}
        onMobileClose={() => setMenuOpen(false)}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-muted/40">
        <AdminTopBar onMenuOpen={() => setMenuOpen(true)} title={title} />
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
