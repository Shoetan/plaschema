import { AlertCircle, CheckCircle2, CloudOff, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'

import { StatusBadge } from '@/components/status-badge'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useEnrollmentSync, useLocalEnrollments } from '@/features/enrollment/hooks'
import { retryLocalEnrollment } from '@/features/enrollment/services'
import { useNetworkStatus } from '@/hooks/use-network-status'

export function SyncView() {
  const user = useAuthStore((state) => state.user)!
  const enrollments = useLocalEnrollments(user.id)
  const sync = useEnrollmentSync()
  const isOnline = useNetworkStatus()
  const pending = enrollments.filter((record) => record.syncStatus !== 'synced')
  const synced = enrollments.filter((record) => record.syncStatus === 'synced')
  const activelySyncing = pending.some((record) => record.syncStatus === 'uploading' || record.syncStatus === 'submitting') || sync.isPending
  const retryable = pending.filter((record) => record.syncStatus === 'pending').length

  async function retry(id: string) {
    await retryLocalEnrollment(id)
    sync.mutate()
  }

  return <div className="space-y-5 px-4 py-6">
    <h1 className="text-xl font-bold">Synchronization</h1>
    <section className="card space-y-4 p-4">
      <div className="flex items-center justify-between"><span className={`flex items-center gap-2 text-sm font-bold ${isOnline ? 'text-green-700' : 'text-amber-700'}`}>{isOnline ? <CheckCircle2 size={17} /> : <CloudOff size={17} />}{isOnline ? 'Online' : 'Offline'}</span>{user.lastSyncedAt && <span className="text-[11px] text-neutral-400">Last complete sync {new Date(user.lastSyncedAt).toLocaleString()}</span>}</div>
      <div className="grid grid-cols-2 gap-3"><div className="rounded-lg bg-amber-50 p-3"><p className="text-xs text-amber-700">Needs sync</p><p className="text-2xl font-bold text-amber-800">{pending.length}</p></div><div className="rounded-lg bg-success p-3"><p className="text-xs text-success-foreground">Recent synced</p><p className="text-2xl font-bold text-success-foreground">{synced.length}</p></div></div>
      <button className="primary-button flex w-full items-center justify-center gap-2" disabled={!isOnline || activelySyncing || retryable === 0} onClick={() => sync.mutate()}><RefreshCw className={activelySyncing ? 'animate-spin' : ''} size={17} />{activelySyncing ? 'Synchronizing…' : retryable ? 'Sync now' : pending.length ? 'Review failed records' : 'Everything is synced'}</button>
      {!isOnline && pending.length > 0 && <p className="text-center text-xs font-semibold text-amber-700">Records are safe on this device and will synchronize when the app is open and online.</p>}
      {sync.isError && <p role="alert" className="text-center text-xs font-semibold text-red-700">Synchronization stopped. Your records remain saved; check your connection or sign in again.</p>}
    </section>

    <section><h2 className="mb-2 text-sm font-bold">Needs attention ({pending.length})</h2>{pending.length === 0 ? <div className="rounded-xl bg-success p-4 text-center text-sm font-semibold text-success-foreground">All device records are up to date.</div> : <div className="space-y-2">{pending.map((record) => <article className={`rounded-xl border p-4 ${record.syncStatus === 'failed' ? 'border-red-200 bg-red-50' : 'border-neutral-200 bg-white'}`} key={record.localId}><div className="flex justify-between gap-3"><div><h3 className="text-sm font-bold">{record.form.firstName} {record.form.lastName}</h3><p className="text-xs text-neutral-500">{record.wardName} · {new Date(record.capturedAt).toLocaleString()}</p></div><StatusBadge status={record.syncStatus} /></div>{record.errorMessage && <p className="mt-2 flex items-start gap-1 text-xs font-semibold text-red-700"><AlertCircle className="mt-0.5 shrink-0" size={14} />{record.errorMessage}</p>}<div className="mt-3 flex gap-2">{record.syncStatus === 'failed' && <button className="secondary-button flex-1 !min-h-9 !py-2 text-xs" disabled={!isOnline || sync.isPending} onClick={() => void retry(record.localId)}>Retry</button>}<Link className="secondary-button flex-1 !min-h-9 !py-2 text-center text-xs" to={`/beneficiaries/${record.localId}`}>Review</Link></div></article>)}</div>}</section>
    <section><h2 className="mb-2 text-sm font-bold">Recently synced on this device</h2>{synced.length === 0 ? <p className="text-sm text-neutral-500">No device enrollments have synchronized yet.</p> : <div className="space-y-2">{synced.slice(0, 5).map((record) => <Link className="card flex items-center gap-3 p-3" to={`/beneficiaries/${record.localId}`} key={record.localId}><CheckCircle2 className="text-green-700" size={22} /><span className="min-w-0 flex-1 truncate text-sm font-semibold">{record.form.firstName} {record.form.lastName}</span><span className="text-xs text-neutral-400">{record.enrollmentId}</span></Link>)}</div>}</section>
  </div>
}
