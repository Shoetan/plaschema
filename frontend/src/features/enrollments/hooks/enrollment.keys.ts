import type { EnrollmentListParams, FileJobListParams } from '../types'

export const enrollmentKeys = {
  all: ['enrollments'] as const,
  list: (params: EnrollmentListParams) => [...enrollmentKeys.all, 'list', params] as const,
  detail: (id: string) => [...enrollmentKeys.all, 'detail', id] as const,
  jobs: (params: FileJobListParams) => ['file-jobs', 'list', params] as const,
  job: (id: string) => ['file-jobs', 'detail', id] as const,
}
