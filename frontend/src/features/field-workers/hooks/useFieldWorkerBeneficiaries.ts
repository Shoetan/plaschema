import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchFieldWorkerBeneficiaries } from '../services'
import type { FieldWorkerBeneficiaryListParams } from '../types'

export function useFieldWorkerBeneficiaries(
  id: string,
  params: FieldWorkerBeneficiaryListParams,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['field-workers', 'beneficiaries', id, params],
    queryFn: () => fetchFieldWorkerBeneficiaries(id, params),
    enabled: Boolean(id) && enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
