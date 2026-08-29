import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAppStore } from '@/stores/app-store'

export function ProtectedLayout() {
  const user = useAppStore((state) => state.user)
  const location = useLocation()
  return user ? <Outlet /> : <Navigate replace to="/login" state={{ from: location.pathname }} />
}
