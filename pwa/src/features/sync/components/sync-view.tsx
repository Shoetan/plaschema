import { AlertCircle, CheckCircle2, CloudOff, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { StatusBadge } from '@/components/status-badge'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { useAppStore } from '@/stores/app-store'

export function SyncView() {
  const beneficiaries = useAppStore((state) => state.beneficiaries)
  const lastSyncAt = useAppStore((state) => state.lastSyncAt)
  const syncAll = useAppStore((state) => state.syncAll)
  const setSyncStatus = useAppStore((state) => state.setSyncStatus)
  const isOnline = useNetworkStatus()
  const [syncing, setSyncing] = useState(false)
  const pending = beneficiaries.filter((record) => record.syncStatus !== 'Synced')
  const synced = beneficiaries.filter((record) => record.syncStatus === 'Synced')

  async function startSync() {
    setSyncing(true)
    await syncAll()
    setSyncing(false)
  }

  return <div className="space-y-5 px-4 py-6">
    <h1 className="text-xl font-bold">Synchronization</h1>
    <section className="card space-y-4 p-4">
      <div className="flex items-center justify-between"><span className={`flex items-center gap-2 text-sm font-bold ${isOnline ? 'text-green-700' : 'text-amber-700'}`}>{isOnline ? <CheckCircle2 size={17} /> : <CloudOff size={17} />}{isOnline ? 'Online' : 'Offline'}</span>{lastSyncAt && <span className="text-[11px] text-neutral-400">Last demo sync {new Date(lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}</div>
      <div className="grid grid-cols-2 gap-3"><div className="rounded-lg bg-amber-50 p-3"><p className="text-xs text-amber-700">Pending</p><p className="text-2xl font-bold text-amber-800">{pending.length}</p></div><div className="rounded-lg bg-success p-3"><p className="text-xs text-success-foreground">Synced</p><p className="text-2xl font-bold text-success-foreground">{synced.length}</p></div></div>
      <button className="primary-button flex w-full items-center justify-center gap-2" disabled={!isOnline || syncing || pending.length === 0} onClick={() => void startSync()}><RefreshCw className={syncing ? 'animate-spin' : ''} size={17} />{syncing ? 'Running mock sync…' : pending.length ? 'Sync now' : 'Everything is synced'}</button>
      <p className="text-center text-[11px] text-neutral-400">Demo only. No records leave this browser.</p>
    </section>

    <section><h2 className="mb-2 text-sm font-bold">Needs attention ({pending.length})</h2>{pending.length === 0 ? <div className="rounded-xl bg-success p-4 text-center text-sm font-semibold text-success-foreground">All mock records are up to date.</div> : <div className="space-y-2">{pending.map((record) => <article className={`rounded-xl border p-4 ${record.syncStatus === 'Failed' ? 'border-red-200 bg-red-50' : 'border-neutral-200 bg-white'}`} key={record.id}><div className="flex justify-between gap-3"><div><h3 className="text-sm font-bold">{record.firstName} {record.lastName}</h3><p className="text-xs text-neutral-500">{record.ward} · {new Date(record.capturedAt).toLocaleString()}</p></div><StatusBadge status={record.syncStatus} /></div>{record.syncError && <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-red-700"><AlertCircle size={14} />{record.syncError}</p>}<div className="mt-3 flex gap-2"><button className="secondary-button flex-1 !min-h-9 !py-2 text-xs" onClick={() => setSyncStatus(record.id, 'Pending')}>Retry</button><Link className="secondary-button flex-1 !min-h-9 !py-2 text-center text-xs" to={`/beneficiaries/${record.id}`}>Review</Link></div></article>)}</div>}</section>

    <section><h2 className="mb-2 text-sm font-bold">Recently synced</h2><div className="space-y-2">{synced.slice(0, 5).map((record) => <Link className="card flex items-center gap-3 p-3" to={`/beneficiaries/${record.id}`} key={record.id}><CheckCircle2 className="text-green-700" size={22} /><span className="flex-1 text-sm font-semibold">{record.firstName} {record.lastName}</span><span className="text-xs text-neutral-400">Synced</span></Link>)}</div></section>
  </div>
}
