import { ArrowRight, Plus, RefreshCw, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'

import { StatusBadge } from '@/components/status-badge'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useLocalEnrollments, useOwnFieldWorkerDetail } from '@/features/enrollment/hooks'
import { getEnrollmentHomeSummary } from '@/features/enrollment/utils'
import { useNetworkStatus } from '@/hooks/use-network-status'

export function HomeView() {
  const user = useAuthStore((state) => state.user)!
  const enrollments = useLocalEnrollments(user.id)
  const detail = useOwnFieldWorkerDetail()
  const isOnline = useNetworkStatus()
  const summary = getEnrollmentHomeSummary(enrollments, detail.effectiveStats)
  const unsentEnrollments = enrollments.filter((record) => record.syncStatus !== 'synced')

  return <div className="space-y-5 px-4 py-6">
    <section><h1 className="text-[22px] font-bold tracking-tight">Hello, {user.name.split(' ')[0]} 👋</h1><p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${isOnline ? 'bg-success text-success-foreground' : 'bg-amber-50 text-amber-700'}`}>{isOnline ? 'Online' : 'Offline · Work remains saved'}</p></section>
    <section aria-label="Enrollment summary" className="grid grid-cols-3 gap-3">{[['Today', summary.today], ['Total', summary.total], ['Pending', summary.pending]].map(([label, value]) => <div className="card p-3 text-center" key={label}><p className="text-2xl font-bold">{value}</p><p className="mt-1 text-[11px] font-semibold text-neutral-500">{label}</p></div>)}</section>
    {detail.isError && isOnline && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">Server totals are temporarily unavailable. Device records and enrollment remain available.</p>}
    <Link to="/enroll" className="primary-button flex w-full items-center justify-center gap-2"><Plus size={20} />Enroll new beneficiary</Link>
    <div className="grid grid-cols-2 gap-3"><Link to="/beneficiaries" className="secondary-button flex items-center justify-center gap-2 text-sm"><UsersRound size={17} />People</Link><Link to="/sync" className="secondary-button flex items-center justify-center gap-2 text-sm"><RefreshCw size={17} />Pending ({summary.pending})</Link></div>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold">Recent device enrollments</h2><Link className="flex items-center text-xs font-semibold text-neutral-500" to="/beneficiaries">View all <ArrowRight size={14} /></Link></div>{unsentEnrollments.length === 0 ? <div className="card p-5 text-center text-sm text-neutral-500">No pending enrollments on this device.</div> : <div className="space-y-2">{unsentEnrollments.slice(0, 4).map((record) => <Link to={`/beneficiaries/${record.localId}`} className="card flex items-center gap-3 p-3" key={record.localId}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold">{record.form.firstName[0]}{record.form.lastName[0]}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{record.form.firstName} {record.form.lastName}</span><span className="text-xs text-neutral-400">{record.wardName}</span></span><StatusBadge status={record.syncStatus} /></Link>)}</div>}</section>
  </div>
}
