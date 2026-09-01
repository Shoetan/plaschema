import type {
  HealthFacilityBatchResult,
  HealthFacilityDetail,
  HealthFacilityDetailApi,
  HealthFacilityListItem,
  HealthFacilityListItemApi,
} from '../types'

export function mapHealthFacilityListItem(
  facility: HealthFacilityListItemApi,
): HealthFacilityListItem {
  return {
    id: facility.id,
    name: facility.name,
    type: facility.type,
    level: facility.level,
    ward: facility.ward,
    beneficiaries: facility.beneficiaries,
    status: facility.status,
  }
}

export function mapHealthFacilityDetail(
  detail: HealthFacilityDetailApi,
): HealthFacilityDetail {
  return {
    facility: detail.facility,
    stats: {
      totalBeneficiaries: detail.stats.totalBeneficiaries,
      enrollmentsThisMonth: detail.stats.enrollmentsThisMonth,
      currentCapitation: detail.stats.currentCapitation,
      lastActivityAt: detail.stats.lastActivityAt,
    },
    capitation: {
      ...detail.capitation,
      currentAmount: detail.capitation.currentAmount,
      records: detail.capitation.records,
    },
    activityLog: detail.activityLog ?? [],
  }
}

export function isHealthFacilityBatchResult(
  value: unknown,
): value is HealthFacilityBatchResult {
  if (typeof value !== 'object' || value === null) return false
  const result = value as Partial<HealthFacilityBatchResult>
  return (
    typeof result.created === 'number' &&
    typeof result.failed === 'number' &&
    Array.isArray(result.errors)
  )
}
