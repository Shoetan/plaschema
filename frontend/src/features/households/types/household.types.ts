import type { CursorPaginationMeta } from '@/api'

export type HouseholdRole = 'head' | 'member'

export interface HouseholdWard {
  id: string
  name: string
  lga: string
  code: string
}

export interface HouseholdListItem {
  id: string
  householdLocalId: string
  householdCode: string
  wardId: string
  ward: HouseholdWard
  headName: string | null
  memberCount: number
  residentialAddress: string | null
  createdAt: string
}

export interface HouseholdListParams {
  cursor?: string
  limit?: number
  wardId?: string
  lga?: string
  search?: string
  householdCode?: string
}

export interface HouseholdListResult {
  items: HouseholdListItem[]
  meta: CursorPaginationMeta
}

export interface HouseholdMemberSummary {
  id: string
  enrollmentId: string
  householdRole: HouseholdRole
  memberSequence: number | null
  firstName: string
  lastName: string
  status: string
}

export interface HouseholdRecord {
  id: string
  householdLocalId: string
  householdCode: string
  wardId: string
  headEnrollmentId: string | null
  baseEnrollmentId: string | null
  residentialAddress: string | null
  memberCount: number
  createdAt: string
  updatedAt: string
  ward: HouseholdWard
}

export interface HouseholdDetail {
  household: HouseholdRecord
  head: HouseholdMemberSummary | null
  members: HouseholdMemberSummary[]
}
