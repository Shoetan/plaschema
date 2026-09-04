import type { CursorPaginationMeta } from '@/api'

export interface CapitationRecord {
  id: string
  healthFacilityId: string
  facilityName: string
  lga: string
  month: number
  year: number
  period: string
  beneficiaryCount: number
  rate: number
  amount: number
}

export interface CapitationSummary {
  runId: string
  month: number
  year: number
  rate: number
  generatedAt: string
  totalFacilities: number
  totalBeneficiaries: number
  totalCapitation: number
}

export interface CapitationListParams {
  month: number
  year: number
  cursor?: string
  limit: number
  lga?: string
  healthFacilityId?: string
  search?: string
}

export interface CapitationListResult {
  items: CapitationRecord[]
  meta: CursorPaginationMeta
  summary: CapitationSummary | null | undefined
}

export interface CapitationPreviewRecord {
  healthFacilityId: string
  facilityName: string
  lga: string
  beneficiaryCount: number
  rate: number
  amount: number
}

export interface CapitationPreview {
  month: number
  year: number
  rate: number
  totalFacilities: number
  totalBeneficiaries: number
  totalCapitation: number
  records: CapitationPreviewRecord[]
}

export interface GenerateCapitationPayload {
  month: number
  year: number
}

export interface GenerateCapitationResult extends CapitationSummary {
  recordCount: number
}

export interface CapitationPeriod {
  month: number
  year: number
}
