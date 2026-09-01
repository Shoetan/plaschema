import type { FacilityBeneficiaryListParams, HealthFacilityListParams } from '../types'

export const facilityKeys = {
  all: ['health-facilities'] as const,
  lists: () => [...facilityKeys.all, 'list'] as const,
  list: (params: HealthFacilityListParams) =>
    [...facilityKeys.lists(), params] as const,
  details: () => [...facilityKeys.all, 'detail'] as const,
  detail: (id: string) => [...facilityKeys.details(), id] as const,
  beneficiaries: (id: string, params: FacilityBeneficiaryListParams) =>
    [...facilityKeys.detail(id), 'beneficiaries', params] as const,
}
