import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/api'

import {
  createHealthFacility,
  deleteHealthFacility,
  updateHealthFacility,
  uploadHealthFacilitiesBatch,
} from '../services'
import { facilityKeys } from './facility.keys'

export function useCreateHealthFacility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createHealthFacility,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: facilityKeys.lists() })
      toast.success('Facility created successfully.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to create the facility.')),
  })
}

export function useUploadHealthFacilitiesBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadHealthFacilitiesBatch,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: facilityKeys.lists() })
      if (result.failed > 0) {
        toast.warning(`${result.created} facilities imported; ${result.failed} rows failed.`)
      } else {
        toast.success(`${result.created} facilities imported successfully.`)
      }
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to upload the facilities file.')),
  })
}

export function useUpdateHealthFacility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateHealthFacility,
    onSuccess: (facility) => {
      void queryClient.invalidateQueries({ queryKey: facilityKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: facilityKeys.detail(facility.id) })
      toast.success('Facility updated successfully.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to update the facility.')),
  })
}

export function useDeleteHealthFacility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteHealthFacility,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: facilityKeys.lists() })
      queryClient.removeQueries({ queryKey: facilityKeys.detail(result.id) })
      toast.success('Facility deleted successfully.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to delete the facility.')),
  })
}
