import { ArrowRight, Plus, RefreshCw, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'

import { StatusBadge } from '@/components/status-badge'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { useAppStore } from '@/stores/app-store'

export function HomeView() {
  const user = useAuthStore((state) => state.user)!
  const beneficiaries = useAppStore((state) => state.beneficiaries)
  const isOnline = useNetworkStatus()
  const pending = beneficiaries.filter((record) => record.syncStatus !== 'Synced').length
  const today = new Date().toDateString()
  const enrolledToday = beneficiaries.filter((record) => new Date(record.capturedAt).toDateString() === today).length

  return (
    <div className="space-y-5 px-4 py-6">
      <section>
        <h1 className="text-[22px] font-bold tracking-tight">Hello, {user.name.split(' ')[0]} 👋</h1>
        <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${isOnline ? 'bg-success text-success-foreground' : 'bg-amber-50 text-amber-700'}`}>{isOnline ? 'Online' : 'Offline · Saved session'}</p>
      </section>

      <section aria-label="Enrollment summary" className="grid grid-cols-3 gap-3">
        {[['Today', enrolledToday], ['Total', beneficiaries.length], ['Pending', pending]].map(([label, value]) => <div className="card p-3 text-center" key={label}><p className="text-2xl font-bold">{value}</p><p className="mt-1 text-[11px] font-semibold text-neutral-500">{label}</p></div>)}
      </section>

      <Link to="/enroll" className="primary-button flex w-full items-center justify-center gap-2"><Plus size={20} />Enroll new beneficiary</Link>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/beneficiaries" className="secondary-button flex items-center justify-center gap-2 text-sm"><UsersRound size={17} />Beneficiaries</Link>
        <Link to="/sync" className="secondary-button flex items-center justify-center gap-2 text-sm"><RefreshCw size={17} />Pending ({pending})</Link>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold">Recent enrollments</h2><Link className="flex items-center text-xs font-semibold text-neutral-500" to="/beneficiaries">View all <ArrowRight size={14} /></Link></div>
        <div className="space-y-2">
          {beneficiaries.slice(0, 4).map((record) => <Link to={`/beneficiaries/${record.id}`} className="card flex items-center gap-3 p-3" key={record.id}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold">{record.firstName[0]}{record.lastName[0]}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{record.firstName} {record.lastName}</span><span className="text-xs text-neutral-400">{record.ward}</span></span>
            <StatusBadge status={record.syncStatus} />
          </Link>)}
        </div>
      </section>
    </div>
  )
}
