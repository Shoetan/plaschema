import { useParams } from 'react-router-dom'

import { FieldWorkerDetailView } from '@/features/field-workers/components'

export function FieldWorkerDetailPage() {
  const { fieldWorkerId } = useParams<{ fieldWorkerId: string }>()
  if (!fieldWorkerId) return null
  return <FieldWorkerDetailView fieldWorkerId={fieldWorkerId} />
}
