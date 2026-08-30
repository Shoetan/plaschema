import type { CursorPaginationMeta } from '@/api'

export type FieldWorkerStatus = 'active' | 'inactive'

export interface FieldWorkerWard {
  id: string
  name: string
  lga: string
}

export interface AssignableFieldWorker {
  id: string
  name: string
  phone: string | null
  email: string
  wards: FieldWorkerWard[]
  beneficiariesEnrolled: number
  lastEnrollmentAt: string | null
  lastSyncedAt: string | null
  status: FieldWorkerStatus
}

export interface FieldWorkerListParams {
  cursor?: string
  limit?: number
  search?: string
}

export interface FieldWorkerListResult {
  items: AssignableFieldWorker[]
  meta: CursorPaginationMeta
}
