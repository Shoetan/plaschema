import { useParams } from 'react-router-dom'

import { EnrollmentDetailView } from '@/features/enrollments/components'

export function BeneficiaryDetailPage() {
  const { beneficiaryId } = useParams<{ beneficiaryId: string }>()
  if (!beneficiaryId) return null
  return <EnrollmentDetailView enrollmentId={beneficiaryId} />
}
