import type { CursorPaginationMeta } from '@/api'

export interface CreateWardPayload {
  name: string
  lga: string
}

export interface CreatedWardApi {
  id: string
  name: string
  lga: string
  createdAt: string
  updatedAt: string
  state?: string
  status?: 'active' | 'inactive'
}

export interface CreatedWard {
  id: string
  name: string
  lga: string
  createdAt: string
  updatedAt: string
}

export interface WardBatchError {
  row: number
  message: string
}

export interface WardBatchResult {
  created: number
  failed: number
  errors: WardBatchError[]
}

export type WardStatus = 'active' | 'inactive'

export interface WardListParams {
  cursor?: string
  limit?: number
  search?: string
  status?: WardStatus
}

export interface WardListItem {
  id: string
  name: string
  state: string
  lga: string
  fieldWorkers: number
  beneficiaries: number
  newEnrollments: number
  status: WardStatus
}

export interface WardListItemApi {
  id: string
  name: string
  state?: string
  lga: string
  fieldWorkers?: number | null
  beneficiaries?: number | null
  newEnrollments?: number | null
  status?: WardStatus
}

export interface WardListResult {
  items: WardListItem[]
  meta: CursorPaginationMeta
}

export interface WardRecord {
  id: string
  name: string
  state: string
  lga: string
  status: WardStatus
  createdAt: string
  updatedAt: string
}

export interface WardDetailStats {
  totalBeneficiaries: number
  activeFieldWorkers: number
  enrollmentsThisMonth: number
  lastActivityAt: string | null
}

export interface WardEnrollmentTrendPoint {
  month: string
  label: string
  count: number
}

export interface WardDetailFieldWorker {
  id: string
  name: string
  phone: string | null
  enrolled: number
  lastEnrollmentAt: string | null
  lastSyncedAt: string | null
  status: WardStatus
}

export interface WardDetailHealthFacility {
  id: string
  name: string
  type: string
  level: 'primary' | 'secondary' | 'tertiary'
  ward: { id: string; name: string }
  beneficiaries: number
  status: WardStatus
}

export type WardActivityCategory = 'enrollment' | 'ward' | 'user' | 'sync'
export type WardActivityAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'printed'
  | 'assigned'

export interface WardActivityEntry {
  id: string
  category: WardActivityCategory
  action: WardActivityAction
  summary: string
  actor: { id: string; name: string } | null
  enrollmentId: string | null
  occurredAt: string
}

export interface WardDetail {
  ward: WardRecord
  stats: WardDetailStats
  enrollmentTrend: WardEnrollmentTrendPoint[]
  fieldWorkers: WardDetailFieldWorker[]
  healthFacilities: WardDetailHealthFacility[]
  activityLog: WardActivityEntry[]
}

export interface UpdateWardPayload {
  name?: string
  lga?: string
  status?: WardStatus
}

export interface UpdateWardVariables {
  id: string
  payload: UpdateWardPayload
}

export interface AssignWardFieldWorkersVariables {
  id: string
  fieldWorkerIds: string[]
}

export interface AssignWardFieldWorkersResult {
  message: string
}

export interface DeleteWardResult {
  id: string
  deleted: true
}
