import type { SyncStatus } from '@/types'

const styles: Record<SyncStatus, string> = {
  Synced: 'bg-success text-success-foreground',
  Pending: 'bg-amber-50 text-amber-700',
  Syncing: 'bg-blue-50 text-blue-700',
  Failed: 'bg-red-50 text-red-700',
}

export function StatusBadge({ status }: { status: SyncStatus }) {
  return <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${styles[status]}`}>{status}</span>
}
