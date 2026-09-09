import { RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getApiErrorStatus } from '@/api'
import { StatusBadge } from '@/components/admin/status-badge'
import { cardShadow, tdCell, thCell } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { useHouseholdDetail } from '../hooks'
import type { HouseholdMemberSummary } from '../types'
import { formatHouseholdDate, householdSize, householdStatusLabel, memberDisplayName } from '../utils'

const TABS = ['Overview', 'Members'] as const
type Tab = (typeof TABS)[number]

function slug(tab: Tab) {
  return tab.toLowerCase()
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  )
}

function memberRows(head: HouseholdMemberSummary | null, members: HouseholdMemberSummary[]) {
  const rows: Array<HouseholdMemberSummary & { roleLabel: string }> = []
  if (head) rows.push({ ...head, roleLabel: 'Head' })
  members.forEach((member, index) => rows.push({ ...member, roleLabel: member.memberSequence ? `Member ${member.memberSequence}` : `Member ${index + 1}` }))
  return rows
}

interface HouseholdDetailViewProps {
  householdId: string
}

export function HouseholdDetailView({ householdId }: HouseholdDetailViewProps) {
  const navigate = useNavigate()
  const query = useHouseholdDetail(householdId)
  const [tab, setTab] = useState<Tab>('Overview')

  const members = useMemo(() => (query.data ? memberRows(query.data.head, query.data.members) : []), [query.data])
  const activeCount = useMemo(() => members.filter((member) => member.status === 'active').length, [members])

  if (query.isPending) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6" aria-label="Loading household details">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Skeleton className="h-24" key={index} />)}</div>
        <Skeleton className="h-72" />
      </div>
    )
  }

  if (query.isError || !query.data) {
    const notFound = getApiErrorStatus(query.error) === 404
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center" role="alert">
        <p className="text-lg font-semibold">{notFound ? 'Household not found.' : 'Unable to load this household.'}</p>
        <p className="text-sm text-muted-foreground">{notFound ? 'It may have been removed or the address is incorrect.' : 'Check your connection and try again.'}</p>
        <div className="flex gap-2">
          {!notFound && <Button onClick={() => void query.refetch()} variant="outline"><RefreshCw aria-hidden="true" /> Retry</Button>}
          <Button onClick={() => navigate('/admin/beneficiaries')} variant="outline">Back to CBHI Enrolments</Button>
        </div>
      </div>
    )
  }

  const { household, head } = query.data
  const title = head ? memberDisplayName(head.firstName, head.lastName) : household.householdCode

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 sm:p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link className="hover:text-foreground" to="/admin/beneficiaries">CBHI Enrolments</Link>
        <span>/</span>
        <span className="text-foreground">{household.householdCode}</span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.48px]">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{household.ward.name} · {household.ward.lga} LGA · Household ID {household.householdCode}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Household size', value: String(householdSize({ headName: head ? memberDisplayName(head.firstName, head.lastName) : null, memberCount: household.memberCount })) },
          { label: 'Active members', value: String(activeCount) },
          { label: 'Ward', value: household.ward.name },
          { label: 'Registered', value: formatHouseholdDate(household.createdAt) },
        ].map((item) => (
          <div className={`rounded-xl bg-card p-5 ${cardShadow}`} key={item.label}>
            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-xl font-semibold">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto border-b border-border">
        <div className="flex min-w-max gap-1" role="tablist" aria-label="Household details">
          {TABS.map((item) => (
            <button
              aria-controls={`household-panel-${slug(item)}`}
              aria-selected={tab === item}
              className={`border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === item ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              id={`household-tab-${slug(item)}`}
              key={item}
              onClick={() => setTab(item)}
              role="tab"
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <section aria-labelledby={`household-tab-${slug(tab)}`} id={`household-panel-${slug(tab)}`} role="tabpanel">
        {tab === 'Overview' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={`rounded-xl bg-card p-5 ${cardShadow}`}>
              <h2 className="mb-3 text-sm font-semibold">Household information</h2>
              <InfoRow label="Household ID" value={household.householdCode} />
              <InfoRow label="Insurance base ID" value={household.baseEnrollmentId ?? 'Pending head sync'} />
              <InfoRow label="Household head" value={head ? memberDisplayName(head.firstName, head.lastName) : 'Not assigned'} />
              <InfoRow label="Registered" value={formatHouseholdDate(household.createdAt)} />
              <InfoRow label="Last updated" value={formatHouseholdDate(household.updatedAt, true)} />
            </div>
            <div className={`rounded-xl bg-card p-5 ${cardShadow}`}>
              <h2 className="mb-3 text-sm font-semibold">Location</h2>
              <InfoRow label="Settlement address" value={household.residentialAddress ?? 'Not recorded'} />
              <InfoRow label="Ward" value={household.ward.name} />
              <InfoRow label="LGA" value={household.ward.lga} />
              <InfoRow label="Ward code" value={household.ward.code} />
            </div>
          </div>
        )}

        {tab === 'Members' && (
          <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Role', 'Beneficiary', 'Enrollment ID', 'Status', 'Actions'].map((heading) => (
                      <th className={thCell} key={heading}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr className="cursor-pointer hover:bg-muted/40" key={member.id} onClick={() => navigate(`/admin/beneficiaries/${member.id}`)}>
                      <td className={`${tdCell} text-muted-foreground`}>{member.roleLabel}</td>
                      <td className={`${tdCell} font-semibold`}>{memberDisplayName(member.firstName, member.lastName)}</td>
                      <td className={`${tdCell} font-mono text-xs text-muted-foreground`}>{member.enrollmentId}</td>
                      <td className={tdCell}><StatusBadge status={householdStatusLabel(member.status)} /></td>
                      <td className={tdCell} onClick={(event) => event.stopPropagation()}>
                        <Button onClick={() => navigate(`/admin/beneficiaries/${member.id}`)} size="sm" variant="outline">View</Button>
                      </td>
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr>
                      <td className="px-6 py-12 text-center text-sm text-muted-foreground" colSpan={5}>No household members are recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
