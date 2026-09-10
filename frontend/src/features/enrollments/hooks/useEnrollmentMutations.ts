import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/api'

import { updateEnrollmentProfile } from '../services'
import { enrollmentKeys } from './enrollment.keys'

export function useUpdateEnrollmentProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateEnrollmentProfile,
    onSuccess: (_record, variables) => {
      void queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
      void queryClient.invalidateQueries({
        queryKey: enrollmentKeys.detail(variables.id),
      })
      toast.success('Beneficiary details updated successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to update beneficiary details.'))
    },
  })
}
