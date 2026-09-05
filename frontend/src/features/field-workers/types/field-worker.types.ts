import type { CursorPaginationMeta } from '@/api'

export type FieldWorkerStatus = 'active' | 'inactive'

export interface FieldWorkerWard {
  id: string
  name: string
  lga: string
  state?: string
}

export interface FieldWorker {
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

export type AssignableFieldWorker = FieldWorker

export interface FieldWorkerListParams {
  cursor?: string
  limit?: number
  search?: string
  status?: FieldWorkerStatus
}

export interface FieldWorkerListResult {
  items: FieldWorker[]
  meta: CursorPaginationMeta
}

export interface FieldWorkerOverview {
  id: string
  name: string
  email: string
  phone: string | null
  status: FieldWorkerStatus
  createdAt: string
  updatedAt: string
}

export interface FieldWorkerStats {
  totalEnrolled: number
  enrollmentsThisMonth: number
  lastEnrollmentAt: string | null
  lastSyncedAt: string | null
}

export interface FieldWorkerActivityEntry {
  id: string
  category: 'enrollment' | 'ward' | 'user' | 'sync'
  action: 'created' | 'updated' | 'status_changed' | 'printed' | 'assigned'
  summary: string
  actor: { id: string; name: string } | null
  enrollmentId: string | null
  occurredAt: string
}

export interface FieldWorkerDetail {
  fieldWorker: FieldWorkerOverview
  stats: FieldWorkerStats
  wards: FieldWorkerWard[]
  activityLog: FieldWorkerActivityEntry[]
}

export interface FieldWorkerUserRecord {
  id: string
  name: string
  email: string
  role: 'admin' | 'field_worker'
  status: FieldWorkerStatus
  phone: string | null
  lastSyncedAt: string | null
  assignedWards: FieldWorkerWard[]
  createdAt: string
  updatedAt: string
}

export interface CreateFieldWorkerPayload {
  name: string
  email: string
  phone: string
  password: string
  role: 'field_worker'
  assignedWardIds: string[]
  status: FieldWorkerStatus
}

export interface UpdateFieldWorkerPayload {
  name?: string
  phone?: string
  assignedWardIds?: string[]
  status?: FieldWorkerStatus
}

export interface UpdateFieldWorkerVariables {
  id: string
  payload: UpdateFieldWorkerPayload
}

export interface ResetFieldWorkerPasswordVariables {
  id: string
  password: string
}

export interface ResetFieldWorkerPasswordResult {
  message: string
}
