import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/api'

import { generateCapitation } from '../services'
import { capitationKeys } from './capitation.keys'

export function useGenerateCapitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: generateCapitation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: capitationKeys.lists() })
      toast.success('Capitation generated successfully.')
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(error, 'Unable to generate capitation.'),
      ),
  })
}
