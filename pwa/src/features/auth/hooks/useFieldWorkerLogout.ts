import { useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '../stores/auth.store'

export function useFieldWorkerLogout() {
  const queryClient = useQueryClient()
  const logout = useAuthStore((state) => state.logout)
  return () => {
    void queryClient.cancelQueries({ queryKey: ['auth'] })
    queryClient.removeQueries({ queryKey: ['auth'] })
    logout()
  }
}
