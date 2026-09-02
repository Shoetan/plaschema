import { Search, UserRoundPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { StatusBadge } from '@/components/status-badge'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useLocalEnrollments } from '@/features/enrollment/hooks'
import type { LocalSyncStatus } from '@/features/enrollment/types'

type Filter = 'all' | 'synced' | 'pending' | 'failed'

export function BeneficiariesView() {
  const user = useAuthStore((state) => state.user)!
  const enrollments = useLocalEnrollments(user.id)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const filtered = useMemo(() => enrollments.filter((record) => {
    const query = search.toLowerCase().trim()
    const name = `${record.form.firstName} ${record.form.middleName} ${record.form.lastName}`
    const matchesSearch = !query || `${name} ${record.enrollmentId ?? record.localId}`.toLowerCase().includes(query)
    const group: Filter = record.syncStatus === 'synced' ? 'synced' : record.syncStatus === 'failed' ? 'failed' : 'pending'
    return matchesSearch && (filter === 'all' || group === filter)
  }), [enrollments, filter, search])

  return <div className="px-4 py-6">
    <h1 className="text-xl font-bold">People enrolled on this device</h1>
    <p className="mt-1 text-xs text-neutral-500">Includes pending records and recently synchronized records retained for offline review.</p>
    <label className="relative mt-4 block"><span className="sr-only">Search enrollments</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input className="field pl-10" placeholder="Search name or enrollment ID" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
    <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Filter by sync state">{(['all', 'synced', 'pending', 'failed'] as Filter[]).map((value) => <button key={value} onClick={() => setFilter(value)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold capitalize ${filter === value ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-600'}`}>{value}</button>)}</div>
    {filtered.length === 0 ? <div className="flex flex-col items-center py-20 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400"><UserRoundPlus /></span><h2 className="mt-4 font-bold">No enrollments found</h2><p className="mt-1 text-sm text-neutral-500">Try another name or filter, or start a new enrollment.</p><Link to="/enroll" className="primary-button mt-5">Start enrollment</Link></div>
      : <div className="mt-4 space-y-2">{filtered.map((record) => <Link key={record.localId} to={`/beneficiaries/${record.localId}`} className="card flex items-center gap-3 p-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold">{record.form.firstName[0]}{record.form.lastName[0]}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{record.form.firstName} {record.form.lastName}</span><span className="block truncate font-mono text-xs text-neutral-400">{record.enrollmentId ?? `Local · ${record.localId.slice(0, 8)}`}</span><span className="block truncate text-xs text-neutral-500">{record.wardName} · {new Date(record.capturedAt).toLocaleDateString()}</span></span><StatusBadge status={record.syncStatus as LocalSyncStatus} /></Link>)}</div>}
  </div>
}
