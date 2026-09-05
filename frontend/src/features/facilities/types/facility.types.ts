import type { CursorPaginationMeta } from '@/api'

export type HealthFacilityStatus = 'active' | 'inactive'
export type HealthFacilityLevel = 'primary' | 'secondary' | 'tertiary'

export interface HealthFacilityWard {
  id: string
  name: string
  lga: string
}

export interface HealthFacilityListParams {
  cursor?: string
  limit?: number
  wardId?: string
  lga?: string
  type?: string
  level?: HealthFacilityLevel
  status?: HealthFacilityStatus
  search?: string
}

export interface HealthFacilityListItemApi {
  id: string
  name: string
  type: string
  level: HealthFacilityLevel
  ward: HealthFacilityWard
  beneficiaries: number
  status: HealthFacilityStatus
}

export interface HealthFacilityListItem {
  id: string
  name: string
  type: string
  level: HealthFacilityLevel
  ward: HealthFacilityWard
  beneficiaries: number
  status: HealthFacilityStatus
}

export interface HealthFacilityListResult {
  items: HealthFacilityListItem[]
  meta: CursorPaginationMeta
}

export interface HealthFacilityRecord {
  id: string
  name: string
  lga: string
  type: string
  level: HealthFacilityLevel
  status: HealthFacilityStatus
  wardId: string
  ward: HealthFacilityWard
  createdAt: string
  updatedAt: string
  state?: 'Plateau'
}

export interface HealthFacilityDetailStatsApi {
  totalBeneficiaries: number
  enrollmentsThisMonth: number
  currentCapitation: number | null
  lastActivityAt: string | null
}

export interface HealthFacilityDetailStats {
  totalBeneficiaries: number
  enrollmentsThisMonth: number
  currentCapitation: number | null
  lastActivityAt: string | null
}

export interface HealthFacilityCapitationRecordApi {
  month: number
  year: number
  period: string
  beneficiaryCount: number
  rate: number
  amount: number
  generatedAt: string
}

export interface HealthFacilityCapitationRecord {
  month: number
  year: number
  period: string
  beneficiaryCount: number
  rate: number
  amount: number
  generatedAt: string
}

export interface HealthFacilityCapitationApi {
  implemented: boolean
  currentAmount: number | null
  currency: string
  records: HealthFacilityCapitationRecordApi[]
}

export interface HealthFacilityCapitation {
  implemented: boolean
  currentAmount: number | null
  currency: string
  records: HealthFacilityCapitationRecord[]
}

export type HealthFacilityActivityCategory =
  | 'enrollment'
  | 'ward'
  | 'user'
  | 'sync'

export type HealthFacilityActivityAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'printed'
  | 'assigned'

export interface HealthFacilityActivityEntry {
  id: string
  category: HealthFacilityActivityCategory
  action: HealthFacilityActivityAction
  summary: string
  actor: { id: string; name: string } | null
  enrollmentId: string | null
  occurredAt: string
}

export interface HealthFacilityDetailApi {
  facility: HealthFacilityRecord
  stats: HealthFacilityDetailStatsApi
  capitation: HealthFacilityCapitationApi
  activityLog: HealthFacilityActivityEntry[]
}

export interface HealthFacilityDetail {
  facility: HealthFacilityRecord
  stats: HealthFacilityDetailStats
  capitation: HealthFacilityCapitation
  activityLog: HealthFacilityActivityEntry[]
}

export interface CreateHealthFacilityPayload {
  name: string
  wardId: string
  type: string
  level: HealthFacilityLevel
  status: HealthFacilityStatus
}

export interface UpdateHealthFacilityPayload {
  name?: string
  wardId?: string
  type?: string
  level?: HealthFacilityLevel
  status?: HealthFacilityStatus
}

export interface UpdateHealthFacilityVariables {
  id: string
  payload: UpdateHealthFacilityPayload
}

export interface HealthFacilityBatchError {
  row: number
  message: string
}

export interface HealthFacilityBatchResult {
  created: number
  failed: number
  errors: HealthFacilityBatchError[]
}

export interface DeleteHealthFacilityResult {
  id: string
  deleted: true
}
