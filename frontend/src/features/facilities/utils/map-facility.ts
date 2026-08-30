import type {
  HealthFacilityBatchResult,
  HealthFacilityDetail,
  HealthFacilityDetailApi,
  HealthFacilityListItem,
  HealthFacilityListItemApi,
} from '../types'

function numberOrZero(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function mapHealthFacilityListItem(
  facility: HealthFacilityListItemApi,
): HealthFacilityListItem {
  return {
    id: facility.id,
    name: facility.name,
    type: facility.type?.trim() || 'Primary Health Care',
    level: facility.level ?? 'primary',
    ward: facility.ward ?? { id: '', name: 'Not available', lga: 'Not available' },
    beneficiaries: numberOrZero(facility.beneficiaries),
    status: facility.status ?? 'active',
  }
}

export function mapHealthFacilityDetail(
  detail: HealthFacilityDetailApi,
): HealthFacilityDetail {
  return {
    facility: detail.facility,
    stats: {
      totalBeneficiaries: numberOrZero(detail.stats.totalBeneficiaries),
      enrollmentsThisMonth: numberOrZero(detail.stats.enrollmentsThisMonth),
      currentCapitation: detail.stats.currentCapitation ?? null,
      lastActivityAt: detail.stats.lastActivityAt ?? null,
    },
    capitation: {
      ...detail.capitation,
      currentAmount: detail.capitation.currentAmount ?? null,
      records: detail.capitation.records.map((record) => ({
        ...record,
        beneficiaryCount: numberOrZero(record.beneficiaryCount),
        rate: numberOrZero(record.rate),
        amount: numberOrZero(record.amount),
      })),
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
