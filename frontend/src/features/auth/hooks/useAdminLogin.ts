import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/api'

import { loginAdmin } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'
import type { LoginPayload } from '../types/auth.types'

interface AdminLoginVariables extends LoginPayload {
  remember: boolean
}

export function useAdminLogin() {
  const queryClient = useQueryClient()
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: ({ email, password }: AdminLoginVariables) =>
      loginAdmin({ email, password }),
    onSuccess: (result, variables) => {
      queryClient.removeQueries({ queryKey: ['auth', 'me'] })
      setSession(result, variables.remember)
      toast.success(`Welcome back, ${result.user.name}`)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to sign in. Try again.'))
    },
  })
}
