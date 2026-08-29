import { useParams } from 'react-router-dom'

import { BeneficiaryDetailView } from '@/features/beneficiaries/components'

export function BeneficiaryDetailPage() {
  const { beneficiaryId } = useParams<{ beneficiaryId: string }>()
  if (!beneficiaryId) return null
  return <BeneficiaryDetailView beneficiaryId={beneficiaryId} />
}
