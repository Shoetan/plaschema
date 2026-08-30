import { LoaderCircle, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getApiErrorStatus } from '@/api'
import { StatusBadge } from '@/components/admin/status-badge'
import { cardShadow, tdCell, thCell } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { useHealthFacilityDetail, useUpdateHealthFacility } from '../hooks'
import type { HealthFacilityActivityEntry, HealthFacilityStatus } from '../types'
import { DeleteFacilityDialog } from './delete-facility-dialog'
import { EditFacilityDialog } from './edit-facility-dialog'

const TABS = ['Overview', 'Beneficiaries', 'Capitation', 'Activity'] as const
type Tab = (typeof TABS)[number]

interface FacilityDetailViewProps { facilityId: string }
function statusLabel(status: HealthFacilityStatus) { return status === 'active' ? 'Active' : 'Inactive' }
function slug(tab: Tab) { return tab.toLowerCase() }
function formatDate(value: string | null, time = false) {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric', ...(time ? { hour: '2-digit', minute: '2-digit' } : {}), timeZone: 'Africa/Lagos' }).format(date)
}
function formatCurrency(value: number | null) { return value === null ? 'Not available' : new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(value) }

function InfoRow({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 border-b border-border py-3 last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-right text-sm font-medium">{value}</span></div> }
function ActivityList({ entries }: { entries: HealthFacilityActivityEntry[] }) {
  if (entries.length === 0) return <p className="py-12 text-center text-sm text-muted-foreground">No recent activity is available.</p>
  return <div className="divide-y divide-border">{entries.map((entry) => <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:justify-between" key={entry.id}><div><p className="text-sm font-semibold">{entry.summary}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{entry.actor?.name ?? 'System'} · {entry.category}</p></div><time className="text-xs text-muted-foreground" dateTime={entry.occurredAt}>{formatDate(entry.occurredAt, true)}</time></div>)}</div>
}

export function FacilityDetailView({ facilityId }: FacilityDetailViewProps) {
  const navigate = useNavigate()
  const query = useHealthFacilityDetail(facilityId)
  const updateMutation = useUpdateHealthFacility()
  const [tab, setTab] = useState<Tab>('Overview')
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (query.isPending) return <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6" aria-label="Loading facility details"><Skeleton className="h-5 w-48" /><Skeleton className="h-16 w-full" /><div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Skeleton className="h-24" key={index} />)}</div><Skeleton className="h-72" /></div>
  if (query.isError || !query.data) {
    const notFound = getApiErrorStatus(query.error) === 404
    return <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center" role="alert"><p className="text-lg font-semibold">{notFound ? 'Facility not found.' : 'Unable to load this facility.'}</p><p className="text-sm text-muted-foreground">{notFound ? 'It may have been deleted or the address is incorrect.' : 'Check your connection and try again.'}</p><div className="flex gap-2">{!notFound && <Button onClick={() => void query.refetch()} variant="outline"><RefreshCw aria-hidden="true" /> Retry</Button>}<Button onClick={() => navigate('/admin/facilities')} variant="outline">Back to Facilities</Button></div></div>
  }

  const { facility, stats, capitation, activityLog } = query.data
  const nextStatus: HealthFacilityStatus = facility.status === 'active' ? 'inactive' : 'active'
  function toggleStatus() { updateMutation.mutate({ id: facility.id, payload: { status: nextStatus } }) }

  return <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 sm:p-6">
    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Link className="hover:text-foreground" to="/admin/facilities">Facilities</Link><span>/</span><span className="text-foreground">{facility.name}</span></div>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold tracking-[-0.48px]">{facility.name}</h1><StatusBadge status={statusLabel(facility.status)} /></div><p className="mt-1 text-sm text-muted-foreground">{facility.ward.name} · {facility.lga} LGA</p></div><div className="flex flex-wrap gap-2"><Button onClick={() => setEditOpen(true)} variant="outline">Edit Facility</Button><Button disabled={updateMutation.isPending} onClick={toggleStatus} variant="outline">{updateMutation.isPending ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> Updating…</> : nextStatus === 'inactive' ? 'Deactivate' : 'Activate'}</Button><Button onClick={() => setDeleteOpen(true)} variant="destructive"><Trash2 aria-hidden="true" /> Delete</Button></div></div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{ label: 'Assigned Beneficiaries', value: stats.totalBeneficiaries.toLocaleString() }, { label: 'Enrollments This Month', value: stats.enrollmentsThisMonth.toLocaleString() }, { label: 'Current Capitation', value: formatCurrency(stats.currentCapitation) }, { label: 'Last Activity', value: formatDate(stats.lastActivityAt, true) }].map((item) => <div className={`rounded-xl bg-card p-5 ${cardShadow}`} key={item.label}><p className="text-xs font-medium text-muted-foreground">{item.label}</p><p className="mt-1 text-xl font-semibold">{item.value}</p></div>)}</div>

    <div className="overflow-x-auto border-b border-border"><div className="flex min-w-max gap-1" role="tablist" aria-label="Facility details">{TABS.map((item) => { const disabled = item === 'Beneficiaries'; return <button aria-controls={`facility-panel-${slug(item)}`} aria-selected={tab === item} className={`border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === item ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'} disabled:cursor-not-allowed disabled:opacity-60`} disabled={disabled} id={`facility-tab-${slug(item)}`} key={item} onClick={() => setTab(item)} role="tab" title={disabled ? 'Beneficiary rows require a separate endpoint.' : undefined}>{disabled ? 'Beneficiaries · Not connected' : item}</button> })}</div></div>

    <section aria-labelledby={`facility-tab-${slug(tab)}`} id={`facility-panel-${slug(tab)}`} role="tabpanel">
      {tab === 'Overview' && <div className="grid gap-4 lg:grid-cols-2"><div className={`rounded-xl bg-card p-5 ${cardShadow}`}><h2 className="mb-3 text-sm font-semibold">Facility Information</h2><InfoRow label="Facility Name" value={facility.name} /><InfoRow label="Facility Type" value={facility.type} /><InfoRow label="Facility Level" value={facility.level[0].toUpperCase() + facility.level.slice(1)} /><InfoRow label="Status" value={statusLabel(facility.status)} /><InfoRow label="Created" value={formatDate(facility.createdAt)} /><InfoRow label="Updated" value={formatDate(facility.updatedAt)} /></div><div className={`rounded-xl bg-card p-5 ${cardShadow}`}><h2 className="mb-3 text-sm font-semibold">Location</h2><InfoRow label="State" value={facility.state ?? 'Plateau'} /><InfoRow label="LGA" value={facility.lga} /><InfoRow label="Ward" value={facility.ward.name} /></div></div>}
      {tab === 'Capitation' && <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-4"><div><p className="text-xs text-muted-foreground">CURRENT CAPITATION</p><p className="text-lg font-semibold">{formatCurrency(capitation.currentAmount)}</p></div><p className="text-sm text-muted-foreground">{capitation.records.length} records</p></div><div className="overflow-x-auto"><table className="w-full"><thead><tr>{['Period', 'Beneficiaries', 'Rate', 'Amount', 'Generated'].map((heading) => <th className={thCell} key={heading}>{heading}</th>)}</tr></thead><tbody>{capitation.records.map((record) => <tr className="hover:bg-muted/40" key={`${record.year}-${record.month}`}><td className={tdCell}>{record.period}</td><td className={tdCell}>{record.beneficiaryCount.toLocaleString()}</td><td className={tdCell}>{formatCurrency(record.rate)}</td><td className={`${tdCell} font-semibold`}>{formatCurrency(record.amount)}</td><td className={`${tdCell} text-muted-foreground`}>{formatDate(record.generatedAt)}</td></tr>)}{capitation.records.length === 0 && <tr><td className="px-6 py-12 text-center text-sm text-muted-foreground" colSpan={5}>No capitation records are available.</td></tr>}</tbody></table></div></div>}
      {tab === 'Activity' && <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}><ActivityList entries={activityLog} /></div>}
    </section>

    {editOpen && <EditFacilityDialog facility={facility} onOpenChange={setEditOpen} open />}
    <DeleteFacilityDialog facilityId={facility.id} facilityName={facility.name} onDeleted={() => navigate('/admin/facilities')} onOpenChange={setDeleteOpen} open={deleteOpen} />
  </div>
}
