import { ArrowLeft, ExternalLink, Power, PowerOff, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getApiErrorMessage, getApiErrorStatus } from '@/api'
import { StatusBadge } from '@/components/admin/status-badge'
import { btnSecondary, cardShadow, tabGroup } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { useEnrollmentDetail } from '../hooks'
import { availableEnrollmentStatusTargets, formatEnrollmentDate, readableValue, statusLabel } from '../utils'
import { EnrollmentStatusDialog, type EnrollmentStatusAction } from './enrollment-status-dialog'

const tabs = ['Personal information', 'Enrollment information', 'Synchronization', 'Activity history'] as const
type Tab = (typeof tabs)[number]

function Field({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-semibold">{value}</dd></div>
}

export function EnrollmentDetailView({ enrollmentId }: { enrollmentId: string }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('Personal information')
  const [statusAction, setStatusAction] = useState<EnrollmentStatusAction | null>(null)
  const query = useEnrollmentDetail(enrollmentId)
  const detail = query.data

  if (query.isPending) return <div className="flex flex-1 flex-col gap-5 overflow-auto p-4 sm:p-6"><Skeleton className="h-8 w-72" /><Skeleton className="h-32 w-full" /><Skeleton className="h-80 w-full" /></div>
  if (query.isError || !detail) {
    const missing = getApiErrorStatus(query.error) === 404
    return <div className="flex flex-1 items-center justify-center p-6"><div className="max-w-md text-center"><h1 className="text-xl font-semibold">{missing ? 'Enrollment not found' : 'Unable to load enrollment'}</h1><p className="mt-2 text-sm text-muted-foreground">{missing ? 'This record may no longer exist or the link may be incorrect.' : getApiErrorMessage(query.error, 'Check your connection and try again.')}</p><div className="mt-5 flex justify-center gap-2"><Button onClick={() => navigate('/admin/beneficiaries')} variant="outline"><ArrowLeft aria-hidden="true" /> Back</Button>{!missing && <Button onClick={() => void query.refetch()}><RefreshCw aria-hidden="true" /> Retry</Button>}</div></div></div>
  }

  const { record, overview, activityLog } = detail
  const fullName = [record.title, record.firstName, record.middleName, record.lastName].filter(Boolean).map((part) => readableValue(part)).join(' ')
  const statusTargets = availableEnrollmentStatusTargets(record.status)

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 sm:p-6">
      <button className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => navigate('/admin/beneficiaries')} type="button"><ArrowLeft className="size-4" aria-hidden="true" /> Back to CBHI Enrolments</button>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs text-muted-foreground">{record.enrollmentId}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">{overview.beneficiaryName}</h1><p className="mt-1 text-sm text-muted-foreground">Enrolled on {formatEnrollmentDate(record.createdAt)}</p></div>
        <div className="flex flex-wrap items-center gap-2"><StatusBadge status={statusLabel(record.status)} /><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{record.hasPrinted ? `Printed ${record.printCount} time${record.printCount === 1 ? '' : 's'}` : 'ID card not printed'}</span>{statusTargets.map((target) => <Button key={target} onClick={() => setStatusAction({ bulk: false, enrollmentIds: [record.id], subject: `${overview.beneficiaryName} (${record.enrollmentId})`, target })} variant={target === 'disabled' ? 'destructive' : 'default'}>{target === 'active' ? <Power aria-hidden="true" /> : <PowerOff aria-hidden="true" />}{target === 'active' ? 'Activate' : 'Deactivate'}</Button>)}</div>
      </div>

      <div className={`grid gap-5 rounded-xl bg-card p-5 sm:grid-cols-[120px_1fr] ${cardShadow}`}>
        <div className="flex h-32 w-28 items-center justify-center overflow-hidden rounded-xl border bg-muted">
          {record.passportUrl ? <img alt={`Passport of ${overview.beneficiaryName}`} className="h-full w-full object-cover" src={record.passportUrl} /> : <span className="text-xs text-muted-foreground">No passport</span>}
        </div>
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Field label="Full name" value={fullName} /><Field label="Enrollment ID" value={record.enrollmentId} /><Field label="Category" value={record.category} /><Field label="Facility" value={record.healthFacility.name} /><Field label="Ward" value={record.ward.name} /><Field label="Facility LGA" value={record.ward.lga} /><Field label="Field worker" value={record.enrolledBy.name} /><Field label="Last updated" value={formatEnrollmentDate(record.updatedAt, true)} /></dl>
      </div>

      <div className={`${tabGroup} w-fit max-w-full overflow-x-auto`} role="tablist">{tabs.map((item) => <button aria-selected={tab === item} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${tab === item ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`} key={item} onClick={() => setTab(item)} role="tab" type="button">{item}</button>)}</div>

      {tab === 'Personal information' && <div className="grid gap-5 lg:grid-cols-2">
        <section className={`rounded-xl bg-card p-5 ${cardShadow}`}><h2 className="font-semibold">Personal details</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Date of birth" value={formatEnrollmentDate(record.dateOfBirth)} /><Field label="Gender" value={readableValue(record.gender)} /><Field label="NIN" value={readableValue(record.nin)} /><Field label="Marital status" value={readableValue(record.maritalStatus)} /><Field label="Blood group" value={readableValue(record.bloodGroup)} /><Field label="Genotype" value={readableValue(record.genotype)} /><Field label="Phone" value={record.phone} /><Field label="Email" value={readableValue(record.email)} /></dl></section>
        <section className={`rounded-xl bg-card p-5 ${cardShadow}`}><h2 className="font-semibold">Address and emergency contact</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="State of residence" value={record.stateOfResidence} /><Field label="LGA of residence" value={record.lgaOfResidence} /><div className="sm:col-span-2"><Field label="Residential address" value={record.residentialAddress} /></div><Field label="Next of kin" value={record.nextOfKinFullName} /><Field label="Relationship" value={readableValue(record.nextOfKinRelationship)} /><Field label="Emergency phone" value={record.emergencyPhone} /></dl></section>
      </div>}

      {tab === 'Enrollment information' && <div className="grid gap-5 lg:grid-cols-2">
        <section className={`rounded-xl bg-card p-5 ${cardShadow}`}><h2 className="font-semibold">Enrollment details</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Category" value={record.category} /><Field label="Status" value={statusLabel(record.status)} /><Field label="Health facility" value={record.healthFacility.name} /><Field label="Ward" value={`${record.ward.name}, ${record.ward.lga}`} /><Field label="Enrolled by" value={record.enrolledBy.name} /><Field label="Captured on device" value={formatEnrollmentDate(record.capturedAt, true)} /><Field label="Received by server" value={formatEnrollmentDate(record.createdAt, true)} /><Field label="Last updated" value={formatEnrollmentDate(record.updatedAt, true)} /></dl></section>
        <section className={`rounded-xl bg-card p-5 ${cardShadow}`}><h2 className="font-semibold">Documents and ID card</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="ID document type" value={readableValue(record.idType)} /><Field label="ID cards generated" value={String(record.printCount)} /><Field label="Most recent card" value={formatEnrollmentDate(record.printedAt, true)} /><Field label="File links expire after" value={`${Math.round(record.fileUrlExpiresInSeconds / 60)} minutes`} /></dl><a className={`${btnSecondary} mt-5 inline-flex`} href={record.idDocumentUrl} rel="noopener noreferrer" target="_blank">View ID document <ExternalLink className="size-4" aria-hidden="true" /></a><p className="mt-3 text-xs text-muted-foreground">If a document link expires, refresh this page to request a new temporary link.</p></section>
      </div>}

      {tab === 'Synchronization' && <section className={`rounded-xl bg-card p-5 ${cardShadow}`}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Server synchronization</h2><p className="mt-1 text-sm text-muted-foreground">Records shown in the admin app have already reached the server.</p></div><StatusBadge status="Synced" /></div><dl className="mt-6 grid gap-5 sm:grid-cols-3"><Field label="Sync status" value={readableValue(overview.syncStatus)} /><Field label="Captured on device" value={formatEnrollmentDate(record.capturedAt, true)} /><Field label="Received by server" value={formatEnrollmentDate(record.createdAt, true)} /></dl></section>}

      {tab === 'Activity history' && <section className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}><div className="border-b border-border px-5 py-4"><h2 className="font-semibold">Activity history</h2></div>{activityLog.length === 0 ? <p className="p-10 text-center text-sm text-muted-foreground">No activity has been recorded for this enrollment.</p> : <div className="divide-y divide-border">{activityLog.map((entry) => <div className="flex gap-3 px-5 py-4" key={entry.id}><div className="mt-1 size-2 shrink-0 rounded-full bg-primary" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{entry.summary}</p><p className="mt-1 text-xs text-muted-foreground">{entry.actor?.name ?? 'System'} · {formatEnrollmentDate(entry.occurredAt, true)} · {readableValue(entry.category)}</p></div></div>)}</div>}</section>}
      <EnrollmentStatusDialog action={statusAction} onOpenChange={(open) => !open && setStatusAction(null)} />
    </div>
  )
}
