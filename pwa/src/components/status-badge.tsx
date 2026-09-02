import type { LocalSyncStatus } from '@/features/enrollment/types'

const styles: Record<LocalSyncStatus, string> = {
  synced: 'bg-success text-success-foreground',
  pending: 'bg-amber-50 text-amber-700',
  uploading: 'bg-blue-50 text-blue-700',
  submitting: 'bg-blue-50 text-blue-700',
  failed: 'bg-red-50 text-red-700',
}

const labels: Record<LocalSyncStatus, string> = { synced: 'Synced', pending: 'Pending', uploading: 'Uploading', submitting: 'Creating', failed: 'Failed' }

export function StatusBadge({ status }: { status: LocalSyncStatus }) {
  return <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${styles[status]}`}>{labels[status]}</span>
}
