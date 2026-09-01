import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchHealthFacilityBeneficiaries } from '../services'
import type { FacilityBeneficiaryListParams } from '../types'
import { facilityKeys } from './facility.keys'

export function useFacilityBeneficiaries(
  id: string,
  params: FacilityBeneficiaryListParams,
  enabled: boolean,
) {
  return useQuery({
    queryKey: facilityKeys.beneficiaries(id, params),
    queryFn: () => fetchHealthFacilityBeneficiaries(id, params),
    enabled,
    placeholderData: keepPreviousData,
  })
}
