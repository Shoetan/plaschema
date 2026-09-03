import { ChevronDown, MapPin } from 'lucide-react'
import { useState } from 'react'

import type { AssignedWardApi } from '@/features/auth/types'

export function WardAccessCard({ wards }: { wards: AssignedWardApi[] }) {
  const [expanded, setExpanded] = useState(false)

  return <section className="card p-4" aria-labelledby="ward-access-title">
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600"><MapPin aria-hidden="true" size={18} /></span>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-bold" id="ward-access-title">Ward access</h2>
        {wards.length === 0 ? <><p className="mt-1 font-semibold">All wards</p><p className="mt-1 text-xs text-neutral-500">You can enroll beneficiaries in any available ward.</p></>
          : wards.length === 1 ? <><p className="mt-1 font-semibold">{wards[0].name}</p><p className="text-xs text-neutral-500">{wards[0].lga}</p></>
            : <><p className="mt-1 font-semibold">{wards.length} assigned wards</p><button aria-expanded={expanded} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-neutral-600 underline" onClick={() => setExpanded((value) => !value)} type="button">{expanded ? 'Hide wards' : 'View wards'}<ChevronDown aria-hidden="true" className={`transition-transform ${expanded ? 'rotate-180' : ''}`} size={14} /></button></>}
      </div>
    </div>
    {wards.length > 1 && expanded && <ul className="mt-3 divide-y divide-neutral-100 border-t border-neutral-100">{wards.map((ward) => <li className="py-3 text-sm" key={ward.id}><p className="font-semibold">{ward.name}</p><p className="text-xs text-neutral-500">{ward.lga}</p></li>)}</ul>}
  </section>
}
