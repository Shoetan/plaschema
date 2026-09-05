import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateEnrollmentStatus, updateEnrollmentStatuses } from '../services'
import { enrollmentKeys } from './enrollment.keys'

export function useUpdateEnrollmentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateEnrollmentStatus,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: enrollmentKeys.all }),
  })
}

export function useUpdateEnrollmentStatuses() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateEnrollmentStatuses,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: enrollmentKeys.all }),
  })
}
