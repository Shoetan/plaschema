import { useParams } from 'react-router-dom'

import { BeneficiaryDetailView } from '@/features/beneficiaries/components/beneficiary-detail-view'

export function BeneficiaryDetailPage() {
  const { beneficiaryId } = useParams<{ beneficiaryId: string }>()
  return beneficiaryId ? <BeneficiaryDetailView beneficiaryId={beneficiaryId} /> : null
}
