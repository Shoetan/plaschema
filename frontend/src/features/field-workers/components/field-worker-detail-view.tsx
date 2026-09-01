import { ChevronLeft, ChevronRight, KeyRound, LoaderCircle, Pencil, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getApiErrorStatus } from '@/api'
import { StatusBadge } from '@/components/admin/status-badge'
import { btnPrimary, btnSecondary, cardShadow, tdCell, thCell } from '@/components/admin/styles'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { useFieldWorkerBeneficiaries, useFieldWorkerDetail, useUpdateFieldWorker } from '../hooks'
import type { FieldWorkerActivityEntry, FieldWorkerStatus } from '../types'
import { CredentialResultDialog, type CredentialResult } from './credential-result-dialog'
import { EditFieldWorkerDialog } from './edit-field-worker-dialog'
import { ResetFieldWorkerPasswordDialog } from './reset-field-worker-password-dialog'

const tabs = ['Overview', 'Wards', 'Enrollment Activity', 'Beneficiaries Enrolled', 'Sync Activity'] as const
type Tab = (typeof tabs)[number]

interface FieldWorkerDetailViewProps { fieldWorkerId: string }

function statusLabel(status: FieldWorkerStatus) { return status === 'active' ? 'Active' : 'Inactive' }
function formatDate(value: string | null, withTime = false) {
  if (!value) return 'Never'
  return new Intl.DateTimeFormat('en-NG', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(new Date(value))
}

function ActivityList({ entries, emptyMessage }: { entries: FieldWorkerActivityEntry[]; emptyMessage: string }) {
  if (entries.length === 0) return <p className="px-6 py-12 text-center text-sm text-muted-foreground">{emptyMessage}</p>
  return <div>{entries.map((entry) => <div className="flex gap-3 border-b border-border px-5 py-4 last:border-0" key={entry.id}><div aria-hidden="true" className="mt-1 size-2 shrink-0 rounded-full bg-accent" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{entry.summary}</p><p className="mt-1 text-xs text-muted-foreground">{entry.actor ? `By ${entry.actor.name} · ` : ''}{formatDate(entry.occurredAt, true)}</p></div><span className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium capitalize text-muted-foreground">{entry.action.replace('_', ' ')}</span></div>)}</div>
}

export function FieldWorkerDetailView({ fieldWorkerId }: FieldWorkerDetailViewProps) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('Overview')
  const [editOpen, setEditOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [credentials, setCredentials] = useState<CredentialResult | null>(null)
  const [beneficiaryCursors, setBeneficiaryCursors] = useState<Array<string | undefined>>([undefined])
  const [beneficiaryPage, setBeneficiaryPage] = useState(0)
  const detailQuery = useFieldWorkerDetail(fieldWorkerId)
  const beneficiaryQuery = useFieldWorkerBeneficiaries(fieldWorkerId, { cursor: beneficiaryCursors[beneficiaryPage], limit: 25 }, tab === 'Beneficiaries Enrolled')
  const statusMutation = useUpdateFieldWorker()

  if (detailQuery.isPending) return <div className="flex flex-1 flex-col gap-6 overflow-auto p-6"><Skeleton className="h-6 w-64" /><div className="flex items-center gap-4"><Skeleton className="size-16 rounded-full" /><div className="space-y-2"><Skeleton className="h-7 w-56" /><Skeleton className="h-4 w-80" /></div></div><div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton className="h-24 rounded-xl" key={index} />)}</div><Skeleton className="h-72 rounded-xl" /></div>
  if (detailQuery.isError || !detailQuery.data) {
    const missing = getApiErrorStatus(detailQuery.error) === 404
    return <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center" role="alert"><p className="text-lg font-semibold">{missing ? 'Field worker not found' : 'Unable to load this field worker'}</p><p className="max-w-md text-sm text-muted-foreground">{missing ? 'This account may have been removed or is not a field-worker account.' : 'Check your connection and try again.'}</p><div className="flex gap-2"><Button onClick={() => navigate('/admin/field-workers')} variant="outline">Back to Field Workers</Button>{!missing && <Button onClick={() => void detailQuery.refetch()}><RefreshCw aria-hidden="true" /> Retry</Button>}</div></div>
  }

  const detail = detailQuery.data
  const worker = detail.fieldWorker
  const enrollmentActivity = detail.activityLog.filter((entry) => entry.category === 'enrollment')
  const syncActivity = detail.activityLog.filter((entry) => entry.category === 'sync')
  const beneficiaries = beneficiaryQuery.data?.items ?? []
  const beneficiaryMeta = beneficiaryQuery.data?.meta

  function nextBeneficiaryPage() {
    const nextCursor = beneficiaryMeta?.nextCursor
    if (!beneficiaryMeta?.hasMore || !nextCursor) return
    setBeneficiaryCursors((current) => { const next = current.slice(0, beneficiaryPage + 1); next[beneficiaryPage + 1] = nextCursor; return next })
    setBeneficiaryPage((current) => current + 1)
  }

  function changeStatus() {
    const status = worker.status === 'active' ? 'inactive' : 'active'
    statusMutation.mutate({ id: worker.id, payload: { status } }, { onSuccess: () => setStatusOpen(false) })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 sm:p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><button className="hover:text-foreground" onClick={() => navigate('/admin/field-workers')} type="button">Field Workers</button><span>/</span><span className="font-medium text-foreground">{worker.name}</span></div>

      <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-4"><div aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-accent text-xl font-semibold text-primary-foreground">{worker.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div><div className="flex items-center gap-3"><h1 className="text-2xl font-semibold tracking-[-0.48px]">{worker.name}</h1><StatusBadge status={statusLabel(worker.status)} /></div><p className="mt-1 text-sm text-muted-foreground">{worker.email} · {detail.wards.length === 0 ? 'All wards' : `${detail.wards.length} ward${detail.wards.length === 1 ? '' : 's'}`}</p></div></div><div className="flex flex-wrap gap-2"><button className={btnSecondary} onClick={() => setEditOpen(true)} type="button"><Pencil aria-hidden="true" className="size-4" /> Edit & Ward Access</button><button className={btnSecondary} onClick={() => setResetOpen(true)} type="button"><KeyRound aria-hidden="true" className="size-4" /> Reset Password</button><button className={worker.status === 'active' ? btnSecondary : btnPrimary} onClick={() => setStatusOpen(true)} type="button">{worker.status === 'active' ? 'Deactivate' : 'Activate'}</button></div></div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[{ label: 'Total Enrolled', value: detail.stats.totalEnrolled.toLocaleString() }, { label: 'Enrollments This Month', value: detail.stats.enrollmentsThisMonth.toLocaleString() }, { label: 'Last Enrollment', value: formatDate(detail.stats.lastEnrollmentAt) }, { label: 'Last Sync', value: formatDate(detail.stats.lastSyncedAt, true) }].map((item) => <div className={`rounded-xl bg-card p-4 ${cardShadow}`} key={item.label}><p className="text-sm font-medium text-muted-foreground">{item.label}</p><p className="mt-1 text-xl font-semibold tracking-[-0.4px]">{item.value}</p></div>)}</div>

      <div className="overflow-x-auto border-b border-border"><div className="flex min-w-max items-center gap-1">{tabs.map((item) => <button aria-pressed={tab === item} className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${tab === item ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`} key={item} onClick={() => setTab(item)} type="button">{item}</button>)}</div></div>

      {tab === 'Overview' && <div className={`rounded-xl bg-card p-5 ${cardShadow}`}><p className="mb-4 text-sm font-semibold">Worker Information</p>{[{ label: 'Full Name', value: worker.name }, { label: 'Worker ID', value: worker.id }, { label: 'Phone', value: worker.phone ?? 'Not provided' }, { label: 'Email', value: worker.email }, { label: 'Ward Access', value: detail.wards.length === 0 ? 'All wards' : detail.wards.map((ward) => ward.name).join(', ') }, { label: 'Date Created', value: formatDate(worker.createdAt) }, { label: 'Last Updated', value: formatDate(worker.updatedAt, true) }].map((item) => <div className="flex flex-wrap justify-between gap-2 border-b border-border py-2.5 last:border-0" key={item.label}><span className="text-sm text-muted-foreground">{item.label}</span><span className="max-w-xl break-all text-right text-sm font-medium">{item.value}</span></div>)}</div>}

      {tab === 'Wards' && <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}>{detail.wards.length === 0 ? <div className="p-8 text-center"><p className="font-semibold">Access to all wards</p><p className="mt-1 text-sm text-muted-foreground">No ward restrictions are assigned to this field worker.</p><Button className="mt-4" onClick={() => setEditOpen(true)} variant="outline">Change ward access</Button></div> : <div>{detail.wards.map((ward) => <div className="flex items-center justify-between border-b border-border px-5 py-4 last:border-0" key={ward.id}><div><p className="text-sm font-semibold">{ward.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{ward.lga}{ward.state ? `, ${ward.state}` : ''}</p></div><StatusBadge status="Active" /></div>)}</div>}</div>}

      {tab === 'Enrollment Activity' && <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}><ActivityList emptyMessage="No enrollment activity has been recorded for this worker." entries={enrollmentActivity} /></div>}
      {tab === 'Sync Activity' && <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}><ActivityList emptyMessage="No sync activity has been recorded for this worker." entries={syncActivity} /></div>}

      {tab === 'Beneficiaries Enrolled' && <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}>{beneficiaryQuery.isError && !beneficiaryQuery.data ? <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center" role="alert"><p className="font-semibold">Unable to load beneficiary enrollments.</p><Button onClick={() => void beneficiaryQuery.refetch()} variant="outline"><RefreshCw aria-hidden="true" /> Retry</Button></div> : <div className="overflow-x-auto"><table className="w-full"><thead><tr>{['Beneficiary', 'Enrollment ID', 'Category', 'Ward', 'Date Enrolled', 'Status'].map((heading) => <th className={thCell} key={heading}>{heading}</th>)}</tr></thead><tbody>{beneficiaryQuery.isPending ? Array.from({ length: 5 }, (_, row) => <tr key={row}>{Array.from({ length: 6 }, (__, cell) => <td className={tdCell} key={cell}><Skeleton className="h-5 w-full" /></td>)}</tr>) : beneficiaries.map((beneficiary) => <tr key={beneficiary.id}><td className={`${tdCell} font-semibold`}>{beneficiary.beneficiaryName}</td><td className={`${tdCell} font-mono text-xs text-muted-foreground`}>{beneficiary.enrollmentId}</td><td className={`${tdCell} text-muted-foreground`}>{beneficiary.category}</td><td className={`${tdCell} text-muted-foreground`}>{beneficiary.healthFacility.ward.name}</td><td className={`${tdCell} whitespace-nowrap text-muted-foreground`}>{formatDate(beneficiary.createdAt)}</td><td className={tdCell}><StatusBadge status={beneficiary.status[0].toUpperCase() + beneficiary.status.slice(1)} /></td></tr>)}{!beneficiaryQuery.isPending && beneficiaries.length === 0 && <tr><td className="px-6 py-12 text-center text-sm text-muted-foreground" colSpan={6}>No beneficiaries have been enrolled by this field worker.</td></tr>}</tbody></table></div>}{!beneficiaryQuery.isError && <div className="flex items-center justify-between border-t border-border px-4 py-3"><p className="text-sm text-muted-foreground">Page {beneficiaryPage + 1}</p><div className="flex gap-2"><Button disabled={beneficiaryPage === 0 || beneficiaryQuery.isFetching} onClick={() => setBeneficiaryPage((current) => Math.max(0, current - 1))} variant="outline"><ChevronLeft aria-hidden="true" /> Previous</Button><Button disabled={!beneficiaryMeta?.hasMore || !beneficiaryMeta.nextCursor || beneficiaryQuery.isFetching} onClick={nextBeneficiaryPage} variant="outline">Next <ChevronRight aria-hidden="true" /></Button></div></div>}</div>}

      {editOpen && <EditFieldWorkerDialog detail={detail} onOpenChange={setEditOpen} open />}
      {resetOpen && <ResetFieldWorkerPasswordDialog onOpenChange={setResetOpen} onReset={setCredentials} open worker={worker} />}
      {credentials && <CredentialResultDialog onOpenChange={(nextOpen) => { if (!nextOpen) setCredentials(null) }} open result={credentials} title="Password reset complete" />}

      <AlertDialog onOpenChange={(nextOpen) => !statusMutation.isPending && setStatusOpen(nextOpen)} open={statusOpen}><AlertDialogContent><AlertDialogTitle>{worker.status === 'active' ? 'Deactivate field worker?' : 'Activate field worker?'}</AlertDialogTitle><AlertDialogDescription className="mt-2 text-sm text-muted-foreground">{worker.status === 'active' ? `${worker.name} will no longer be able to use an active field-worker account.` : `${worker.name} will regain access according to the assigned ward rules.`}</AlertDialogDescription><div className="mt-6 flex justify-end gap-3"><AlertDialogCancel asChild><Button disabled={statusMutation.isPending} variant="outline">Cancel</Button></AlertDialogCancel><AlertDialogAction asChild><Button disabled={statusMutation.isPending} onClick={changeStatus} variant={worker.status === 'active' ? 'destructive' : 'default'}>{statusMutation.isPending ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> Saving…</> : worker.status === 'active' ? 'Deactivate' : 'Activate'}</Button></AlertDialogAction></div></AlertDialogContent></AlertDialog>
    </div>
  )
}
