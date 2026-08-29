import { Search, UserRoundPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { StatusBadge } from '@/components/status-badge'
import { useAppStore } from '@/stores/app-store'
import type { SyncStatus } from '@/types'

type Filter = 'All' | SyncStatus

export function BeneficiariesView() {
  const beneficiaries = useAppStore((state) => state.beneficiaries)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('All')
  const filtered = useMemo(() => beneficiaries.filter((record) => {
    const query = search.toLowerCase().trim()
    const matchesSearch = !query || `${record.firstName} ${record.lastName} ${record.beneficiaryCode}`.toLowerCase().includes(query)
    return matchesSearch && (filter === 'All' || record.syncStatus === filter)
  }), [beneficiaries, filter, search])

  return <div className="px-4 py-6">
    <h1 className="text-xl font-bold">Beneficiaries</h1>
    <label className="relative mt-4 block"><span className="sr-only">Search beneficiaries</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} /><input className="field pl-10" placeholder="Search name or ID" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
    <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Filter by sync state">{(['All', 'Synced', 'Pending', 'Failed'] as Filter[]).map((value) => <button key={value} onClick={() => setFilter(value)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${filter === value ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-600'}`}>{value}</button>)}</div>

    {filtered.length === 0 ? <div className="flex flex-col items-center py-20 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400"><UserRoundPlus /></span><h2 className="mt-4 font-bold">No beneficiaries found</h2><p className="mt-1 text-sm text-neutral-500">Try another name, ID or filter.</p><Link to="/enroll" className="primary-button mt-5">Start enrollment</Link></div>
      : <div className="mt-4 space-y-2">{filtered.map((record) => <Link key={record.id} to={`/beneficiaries/${record.id}`} className="card flex items-center gap-3 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold">{record.firstName[0]}{record.lastName[0]}</span>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{record.firstName} {record.lastName}</span><span className="block text-xs font-mono text-neutral-400">{record.beneficiaryCode}</span><span className="block truncate text-xs text-neutral-500">{record.ward} · {new Date(record.capturedAt).toLocaleDateString()}</span></span>
        <StatusBadge status={record.syncStatus} />
      </Link>)}</div>}
  </div>
}
