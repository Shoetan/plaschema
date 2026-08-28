import { useParams } from 'react-router-dom'

import { FacilityDetailView } from '@/features/facilities/components'

export function FacilityDetailPage() {
  const { facilityId } = useParams<{ facilityId: string }>()
  if (!facilityId) return null
  return <FacilityDetailView facilityId={facilityId} />
}
