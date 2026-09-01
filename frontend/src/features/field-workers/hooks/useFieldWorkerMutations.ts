import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/api'

import {
  createFieldWorker,
  resetFieldWorkerPassword,
  updateFieldWorker,
} from '../services'

export function useCreateFieldWorker() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFieldWorker,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['field-workers'] })
      toast.success('Field worker created successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to create the field worker.'))
    },
  })
}

export function useUpdateFieldWorker() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateFieldWorker,
    onSuccess: (worker) => {
      void queryClient.invalidateQueries({ queryKey: ['field-workers'] })
      void queryClient.invalidateQueries({
        queryKey: ['field-workers', 'detail', worker.id],
      })
      void queryClient.invalidateQueries({ queryKey: ['wards'] })
      toast.success('Field worker updated successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to update the field worker.'))
    },
  })
}

export function useResetFieldWorkerPassword() {
  return useMutation({
    mutationFn: resetFieldWorkerPassword,
    onSuccess: () => {
      toast.success('Password reset successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to reset the password.'))
    },
  })
}
