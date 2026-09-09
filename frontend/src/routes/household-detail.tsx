import { useParams } from 'react-router-dom'

import { HouseholdDetailView } from '@/features/households/components'

export function HouseholdDetailPage() {
  const { householdId = '' } = useParams()
  return <HouseholdDetailView householdId={householdId} />
}
