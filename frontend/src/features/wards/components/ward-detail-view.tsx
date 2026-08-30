import { RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getApiErrorStatus } from '@/api'
import { StatusBadge } from '@/components/admin/status-badge'
import { cardShadow, tdCell, thCell } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { useWardDetail } from '../hooks'
import type { WardActivityEntry, WardStatus } from '../types'
import { AssignFieldWorkersDialog } from './assign-field-workers-dialog'
import { DeleteWardDialog } from './delete-ward-dialog'
import { EditWardDialog } from './edit-ward-dialog'

const tabs = ['Overview', 'Beneficiaries', 'Field Workers', 'Health Facility', 'Enrollment Activity', 'Activity Log'] as const
type WardTab = (typeof tabs)[number]

interface WardDetailViewProps {
  wardId: string
}

function statusLabel(status: WardStatus) {
  return status === 'active' ? 'Active' : 'Inactive'
}

function tabSlug(tab: WardTab) {
  return tab.toLowerCase().replaceAll(' ', '-')
}

function formatDate(value: string | null, includeTime = false) {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Africa/Lagos',
  }).format(date)
}

function ActivityList({ entries }: { entries: WardActivityEntry[] }) {
  if (entries.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">No recent activity to display.</p>
  return (
    <div className="divide-y divide-border">
      {entries.map((entry) => (
        <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-start sm:justify-between" key={entry.id}>
          <div>
            <p className="text-sm font-semibold text-foreground">{entry.summary}</p>
            <p className="mt-1 text-xs text-muted-foreground">{entry.actor?.name ?? 'System'} · <span className="capitalize">{entry.category}</span></p>
          </div>
          <time className="shrink-0 text-xs text-muted-foreground" dateTime={entry.occurredAt}>{formatDate(entry.occurredAt, true)}</time>
        </div>
      ))}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6" aria-label="Loading ward details">
      <Skeleton className="h-5 w-48" />
      <div className="flex items-center gap-4"><Skeleton className="size-14" /><div className="space-y-2"><Skeleton className="h-7 w-56" /><Skeleton className="h-4 w-40" /></div></div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton className="h-24" key={index} />)}</div>
      <Skeleton className="h-72" />
    </div>
  )
}

export function WardDetailView({ wardId }: WardDetailViewProps) {
  const navigate = useNavigate()
  const detailQuery = useWardDetail(wardId)
  const [tab, setTab] = useState<WardTab>('Overview')
  const [editOpen, setEditOpen] = useState(false)
  const [assignmentOpen, setAssignmentOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (detailQuery.isPending) return <DetailSkeleton />

  if (detailQuery.isError || !detailQuery.data) {
    const notFound = getApiErrorStatus(detailQuery.error) === 404
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center" role="alert">
        <p className="text-lg font-semibold">{notFound ? 'Ward not found.' : 'Unable to load this ward.'}</p>
        <p className="text-sm text-muted-foreground">{notFound ? 'It may have been deleted or the address may be incorrect.' : 'Check your connection and try again.'}</p>
        <div className="flex gap-2">
          {!notFound && <Button onClick={() => void detailQuery.refetch()} variant="outline"><RefreshCw aria-hidden="true" /> Retry</Button>}
          <Button onClick={() => navigate('/admin/wards')} variant="outline">Back to Wards</Button>
        </div>
      </div>
    )
  }

  const { ward, stats, enrollmentTrend, fieldWorkers, healthFacilities, activityLog } = detailQuery.data
  const enrollmentActivity = activityLog.filter((entry) => entry.category === 'enrollment')
  const maxTrend = Math.max(1, ...enrollmentTrend.map((point) => point.count))

  async function openAssignment() {
    await detailQuery.refetch()
    setAssignmentOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 sm:p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button className="hover:text-foreground" onClick={() => navigate('/admin/wards')}>Wards</button><span>/</span><span className="font-medium text-foreground">{ward.name}</span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-xl bg-accent"><span className="text-xl text-primary-foreground" aria-hidden="true">🏘️</span></div>
          <div>
            <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold tracking-[-0.48px]">{ward.name}</h1><StatusBadge status={statusLabel(ward.status)} /></div>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{ward.lga} LGA · {ward.state}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setEditOpen(true)} variant="outline">Edit Ward</Button>
          <Button disabled={detailQuery.isFetching} onClick={() => void openAssignment()}>{detailQuery.isFetching ? 'Refreshing…' : 'Assign Field Worker'}</Button>
          <Button onClick={() => setDeleteOpen(true)} variant="destructive"><Trash2 aria-hidden="true" /> Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Beneficiaries', value: stats.totalBeneficiaries.toLocaleString() },
          { label: 'Active Field Workers', value: String(stats.activeFieldWorkers) },
          { label: 'Enrollments This Month', value: stats.enrollmentsThisMonth.toLocaleString() },
          { label: 'Last Activity', value: formatDate(stats.lastActivityAt, true) },
        ].map(({ label, value }) => <div className={`rounded-xl bg-card p-4 ${cardShadow}`} key={label}><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="mt-1 text-[22px] font-semibold tracking-[-0.44px]">{value}</p></div>)}
      </div>

      <div className="overflow-x-auto border-b border-border">
        <div className="flex min-w-max items-center gap-1" role="tablist" aria-label="Ward details">
          {tabs.map((item) => {
            const disabled = item === 'Beneficiaries'
            return <button aria-controls={`ward-panel-${tabSlug(item)}`} aria-selected={tab === item} className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${tab === item ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'} disabled:cursor-not-allowed disabled:opacity-60`} disabled={disabled} id={`ward-tab-${tabSlug(item)}`} key={item} onClick={() => setTab(item)} role="tab" title={disabled ? 'Beneficiary data will be connected with its own endpoint.' : undefined}>{disabled ? 'Beneficiaries · Not connected' : item}</button>
          })}
        </div>
      </div>

      <section aria-labelledby={`ward-tab-${tabSlug(tab)}`} id={`ward-panel-${tabSlug(tab)}`} role="tabpanel">
        {tab === 'Overview' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={`rounded-xl bg-card p-5 ${cardShadow}`}>
              <p className="mb-4 text-sm font-semibold">Ward Information</p>
              {[
                { label: 'Ward Name', value: ward.name }, { label: 'State', value: ward.state }, { label: 'LGA', value: ward.lga }, { label: 'Status', value: statusLabel(ward.status) }, { label: 'Date Created', value: formatDate(ward.createdAt) },
              ].map(({ label, value }) => <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0" key={label}><span className="text-sm text-muted-foreground">{label}</span>{label === 'Status' ? <StatusBadge status={value} /> : <span className="text-right text-sm font-medium">{value}</span>}</div>)}
            </div>
            <div className={`rounded-xl bg-card p-5 ${cardShadow}`}>
              <p className="mb-4 text-sm font-semibold">Enrollment Trend</p>
              {enrollmentTrend.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No enrollment trend is available.</p> : <div className="flex h-40 items-end gap-2" aria-label="Enrollment trend chart">{enrollmentTrend.map((point) => <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={point.month}><span className="text-xs font-semibold">{point.count}</span><div className="w-full rounded-t bg-primary" style={{ height: `${Math.max(point.count > 0 ? 8 : 2, (point.count / maxTrend) * 96)}px` }} /><span className="max-w-full truncate text-xs text-muted-foreground">{point.label}</span></div>)}</div>}
            </div>
          </div>
        )}

        {tab === 'Field Workers' && <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}><div className="overflow-x-auto"><table className="w-full"><thead><tr>{['Field Worker', 'Phone', 'Enrolled', 'Last Enrollment', 'Last Sync', 'Status'].map((heading) => <th className={thCell} key={heading}>{heading}</th>)}</tr></thead><tbody>{fieldWorkers.map((worker) => <tr className="cursor-pointer hover:bg-muted/40" key={worker.id} onClick={() => navigate(`/admin/field-workers/${worker.id}`)}><td className={tdCell}><div className="flex items-center gap-2"><div aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary-foreground">{worker.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><span className="font-semibold">{worker.name}</span></div></td><td className={`${tdCell} text-muted-foreground`}>{worker.phone ?? 'Not provided'}</td><td className={`${tdCell} font-semibold`}>{worker.enrolled.toLocaleString()}</td><td className={`${tdCell} text-muted-foreground`}>{formatDate(worker.lastEnrollmentAt, true)}</td><td className={`${tdCell} text-muted-foreground`}>{formatDate(worker.lastSyncedAt, true)}</td><td className={tdCell}><StatusBadge status={statusLabel(worker.status)} /></td></tr>)}{fieldWorkers.length === 0 && <tr><td className="px-6 py-10 text-center text-sm text-muted-foreground" colSpan={6}>No field workers are assigned to this ward.</td></tr>}</tbody></table></div></div>}

        {tab === 'Health Facility' && <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}><div className="border-b border-border px-4 py-3"><p className="text-sm font-semibold">Health Facilities in {ward.name} ({healthFacilities.length})</p></div><div className="overflow-x-auto"><table className="w-full"><thead><tr>{['Facility Name', 'Code', 'Type', 'Level', 'Ward', 'Beneficiaries', 'Status'].map((heading) => <th className={thCell} key={heading}>{heading}</th>)}</tr></thead><tbody>{healthFacilities.map((facility) => <tr className="cursor-pointer hover:bg-muted/40" key={facility.id} onClick={() => navigate(`/admin/facilities/${facility.id}`)}><td className={`${tdCell} font-semibold`}>{facility.name}</td><td className={`${tdCell} text-muted-foreground`}>—</td><td className={`${tdCell} text-muted-foreground`}>{facility.type}</td><td className={`${tdCell} capitalize text-muted-foreground`}>{facility.level}</td><td className={`${tdCell} text-muted-foreground`}>{facility.ward.name}</td><td className={`${tdCell} font-semibold`}>{facility.beneficiaries.toLocaleString()}</td><td className={tdCell}><StatusBadge status={statusLabel(facility.status)} /></td></tr>)}{healthFacilities.length === 0 && <tr><td className="px-6 py-10 text-center text-sm text-muted-foreground" colSpan={7}>No health facilities are linked to this ward.</td></tr>}</tbody></table></div></div>}

        {tab === 'Enrollment Activity' && <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}><ActivityList entries={enrollmentActivity} /></div>}
        {tab === 'Activity Log' && <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}><ActivityList entries={activityLog} /></div>}
      </section>

      {editOpen && <EditWardDialog onOpenChange={setEditOpen} open ward={ward} />}
      {assignmentOpen && <AssignFieldWorkersDialog currentWorkers={fieldWorkers} onOpenChange={setAssignmentOpen} open wardId={ward.id} wardName={ward.name} />}
      <DeleteWardDialog onDeleted={() => navigate('/admin/wards')} onOpenChange={setDeleteOpen} open={deleteOpen} wardId={ward.id} wardName={ward.name} />
    </div>
  )
}
