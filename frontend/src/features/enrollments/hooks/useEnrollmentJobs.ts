import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  exportEnrollments,
  fetchFileJob,
  fetchFileJobDownload,
  fetchFileJobs,
  generateIdCards,
} from '../services'
import type { ExportEnrollmentPayload, FileJobListParams } from '../types'
import { enrollmentKeys } from './enrollment.keys'

export function useGenerateIdCards() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: generateIdCards,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['file-jobs'] }),
  })
}

export function useExportEnrollments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExportEnrollmentPayload) => exportEnrollments(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['file-jobs'] }),
  })
}

export function useFileJobs(params: FileJobListParams) {
  return useQuery({
    queryKey: enrollmentKeys.jobs(params),
    queryFn: () => fetchFileJobs(params),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => query.state.data?.items.some((job) => job.status === 'queued' || job.status === 'processing') ? 2_500 : false,
  })
}

export function useFileJob(id: string | null) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: enrollmentKeys.job(id ?? ''),
    queryFn: () => fetchFileJob(id ?? ''),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'completed' || status === 'failed') {
        if (status === 'completed') void queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
        return false
      }
      return 2_000
    },
  })
}

export function useFileJobDownload() {
  return useMutation({ mutationFn: fetchFileJobDownload })
}
