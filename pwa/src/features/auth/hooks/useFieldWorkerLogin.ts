import { useMutation, useQueryClient } from '@tanstack/react-query'

import { loginFieldWorker } from '../services'
import { useAuthStore } from '../stores/auth.store'
import type { LoginPayload } from '../types'

export function useFieldWorkerLogin() {
  const queryClient = useQueryClient()
  const setSession = useAuthStore((state) => state.setSession)
  return useMutation({
    mutationFn: (payload: LoginPayload) => loginFieldWorker(payload),
    onSuccess: (result) => {
      queryClient.removeQueries({ queryKey: ['auth'] })
      setSession(result)
    },
  })
}
