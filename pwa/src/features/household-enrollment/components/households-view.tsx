import { ArrowLeft, Plus, UsersRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useCachedHouseholds } from '@/features/enrollment/hooks'

export function HouseholdsView() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)!
  const households = useCachedHouseholds(user.id)

  return <div className="space-y-4 px-4 py-6">
    <button className="secondary-button !min-h-9 !rounded-full !p-2" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
    <div><h1 className="text-xl font-bold">Households on this device</h1><p className="mt-1 text-sm text-neutral-500">Add members to households you have enrolled here. The head must sync before members can upload.</p></div>
    <Link className="primary-button flex w-full items-center justify-center gap-2" to="/enroll-household"><Plus size={18} />Enroll new Household</Link>
    {households.length === 0
      ? <div className="card p-5 text-center text-sm text-neutral-500">No households saved on this device yet.</div>
      : <div className="space-y-2">{households.map((household) => <Link className="card flex items-center gap-3 p-4" key={household.householdLocalId} to={`/households/${household.householdLocalId}/add-member`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600"><UsersRound size={18} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{household.householdCode}</span><span className="text-xs text-neutral-400">{household.headName ?? 'Head pending'} · {household.memberCount} member{household.memberCount === 1 ? '' : 's'}</span></span><Plus size={16} className="shrink-0 text-neutral-400" /></Link>)}</div>}
  </div>
}
