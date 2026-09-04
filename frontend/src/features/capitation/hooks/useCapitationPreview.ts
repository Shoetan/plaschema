import { useQuery } from '@tanstack/react-query'

import { fetchCapitationPreview } from '../services'
import { capitationKeys } from './capitation.keys'

export function useCapitationPreview(
  month: number,
  year: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: capitationKeys.preview(month, year),
    queryFn: () => fetchCapitationPreview(month, year),
    enabled,
    staleTime: 30_000,
  })
}
