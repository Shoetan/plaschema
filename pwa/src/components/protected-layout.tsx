import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/stores/auth.store'

export function ProtectedLayout() {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()
  const from = `${location.pathname}${location.search}${location.hash}`
  return status === 'authenticated' ? <Outlet /> : <Navigate replace to="/login" state={{ from }} />
}
