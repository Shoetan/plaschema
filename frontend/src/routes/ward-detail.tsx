import { useParams } from 'react-router-dom'

import { WardDetailView } from '@/features/wards/components'

export function WardDetailPage() {
  const { wardId } = useParams<{ wardId: string }>()
  if (!wardId) return null
  return <WardDetailView wardId={wardId} />
}
