import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/api'

import { fieldWorkerKeys } from '@/features/field-workers/hooks'

import {
  assignWardFieldWorkers,
  createWard,
  deleteWard,
  updateWard,
  uploadWardsBatch,
} from '../services'
import { wardKeys } from './ward.keys'

export function useCreateWard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWard,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wardKeys.lists() })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to create the ward.'))
    },
  })
}

export function useUploadWardsBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadWardsBatch,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: wardKeys.lists() })

      const createdLabel = result.created === 1 ? 'ward' : 'wards'
      const failedLabel = result.failed === 1 ? 'row' : 'rows'

      if (result.failed > 0) {
        toast.warning(
          `${result.created} ${createdLabel} imported; ${result.failed} ${failedLabel} failed.`,
        )
        return
      }

      toast.success(
        `${result.created} ${createdLabel} imported successfully.`,
      )
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to upload the wards file.'))
    },
  })
}

export function useUpdateWard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateWard,
    onSuccess: (ward) => {
      void queryClient.invalidateQueries({ queryKey: wardKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: wardKeys.detail(ward.id) })
      toast.success('Ward updated successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to update the ward.'))
    },
  })
}

export function useAssignWardFieldWorkers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: assignWardFieldWorkers,
    onSuccess: (result, variables) => {
      void queryClient.invalidateQueries({ queryKey: wardKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: wardKeys.detail(variables.id),
      })
      void queryClient.invalidateQueries({ queryKey: fieldWorkerKeys.all })
      toast.success(result.message)
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, 'Unable to assign the field workers.'),
      )
    },
  })
}

export function useDeleteWard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWard,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: wardKeys.lists() })
      queryClient.removeQueries({ queryKey: wardKeys.detail(result.id) })
      toast.success('Ward deleted successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to delete the ward.'))
    },
  })
}
