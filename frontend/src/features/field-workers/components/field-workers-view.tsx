import { ChevronLeft, ChevronRight, LoaderCircle, Plus, RefreshCw, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { StatusBadge } from '@/components/admin/status-badge'
import { btnPrimary, btnSecondary, cardShadow, searchBar, tabGroup, tdCell, thCell } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { useFieldWorkers } from '../hooks'
import type { FieldWorkerStatus } from '../types'
import { CreateFieldWorkerDialog } from './create-field-worker-dialog'
import { CredentialResultDialog, type CredentialResult } from './credential-result-dialog'

type StatusFilter = 'all' | FieldWorkerStatus

function statusLabel(status: FieldWorkerStatus) {
  return status === 'active' ? 'Active' : 'Inactive'
}

function formatDate(value: string | null) {
  if (!value) return 'Never'
  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function wardAccess(wards: Array<{ name: string }>) {
  if (wards.length === 0) return 'All wards'
  if (wards.length <= 2) return wards.map((ward) => ward.name).join(', ')
  return `${wards[0].name}, ${wards[1].name} +${wards.length - 2}`
}

export function FieldWorkersView() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined])
  const [pageIndex, setPageIndex] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [credentials, setCredentials] = useState<CredentialResult | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setCursors([undefined])
      setPageIndex(0)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const query = useFieldWorkers({ cursor: cursors[pageIndex], limit: 50, search: debouncedSearch || undefined, status: status === 'all' ? undefined : status })
  const workers = query.data?.items ?? []
  const meta = query.data?.meta
  const activeCount = workers.filter((worker) => worker.status === 'active').length
  const enrolledCount = workers.reduce((total, worker) => total + worker.beneficiariesEnrolled, 0)

  function resetPage() { setCursors([undefined]); setPageIndex(0) }
  function nextPage() {
    const nextCursor = meta?.nextCursor
    if (!meta?.hasMore || !nextCursor) return
    setCursors((current) => { const next = current.slice(0, pageIndex + 1); next[pageIndex + 1] = nextCursor; return next })
    setPageIndex((current) => current + 1)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-[-0.48px]">Field Workers</h1><p className="mt-0.5 text-sm text-muted-foreground">Manage field-worker accounts, ward access and enrollment activity.</p></div><div className="flex gap-2"><button className={btnSecondary} disabled title="Field-worker batch upload is not supported by the API" type="button"><Upload aria-hidden="true" className="size-4" /> Bulk Upload</button><button className={btnPrimary} onClick={() => setCreateOpen(true)} type="button"><Plus aria-hidden="true" className="size-4" /> Add Field Worker</button></div></div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{[{ label: 'Field workers · Current page', value: workers.length }, { label: 'Active · Current page', value: activeCount }, { label: 'Beneficiaries enrolled · Current page', value: enrolledCount.toLocaleString() }].map((item) => <div className={`flex flex-col gap-1 rounded-xl bg-card p-5 ${cardShadow}`} key={item.label}><p className="text-xs font-medium text-muted-foreground">{item.label}</p>{query.isPending ? <Skeleton className="mt-1 h-8 w-24" /> : <p className="text-[28px] font-semibold tracking-[-0.56px]">{item.value}</p>}</div>)}</div>

      <div className="flex flex-wrap items-center gap-3"><div className={searchBar} style={{ flex: '1 1 0', maxWidth: '340px' }}><svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" /><path d="M10.5 10.5L13 13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" /></svg><input aria-label="Search field workers" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" maxLength={160} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email or phone..." value={search} />{query.isFetching && <LoaderCircle aria-label="Updating field workers" className="size-4 animate-spin" />}</div><div className={tabGroup}>{(['all', 'active', 'inactive'] as const).map((item) => <button aria-pressed={status === item} className={`h-10 rounded-full px-4 text-xs font-semibold capitalize ${status === item ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`} key={item} onClick={() => { setStatus(item); resetPage() }} type="button">{item}</button>)}</div><span className="ml-auto text-sm text-muted-foreground">{query.isPending ? 'Loading field workers…' : `Showing ${workers.length} field workers`}</span></div>

      <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}>
        {query.isError && !query.data ? <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center" role="alert"><p className="font-semibold">Unable to load field workers.</p><p className="text-sm text-muted-foreground">Check your connection and try again.</p><Button onClick={() => void query.refetch()} variant="outline"><RefreshCw aria-hidden="true" /> Retry</Button></div> : <div className="overflow-x-auto"><table className="w-full"><thead><tr>{['Field Worker', 'Phone / Email', 'Ward Access', 'Beneficiaries Enrolled', 'Last Enrollment', 'Last Sync', 'Status', 'Actions'].map((heading) => <th className={thCell} key={heading}>{heading}</th>)}</tr></thead><tbody>{query.isPending ? Array.from({ length: 6 }, (_, row) => <tr key={row}>{Array.from({ length: 8 }, (__, cell) => <td className={tdCell} key={cell}><Skeleton className="h-5 w-full" /></td>)}</tr>) : workers.map((worker) => <tr className="cursor-pointer hover:bg-muted/40" key={worker.id} onClick={() => navigate(`/admin/field-workers/${worker.id}`)}><td className={tdCell}><div className="flex items-center gap-2"><div aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary-foreground">{worker.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><span className="font-semibold">{worker.name}</span></div></td><td className={tdCell}><p>{worker.phone ?? 'Not provided'}</p><p className="text-xs text-muted-foreground">{worker.email}</p></td><td className={`${tdCell} max-w-64 text-muted-foreground`}>{wardAccess(worker.wards)}</td><td className={`${tdCell} font-semibold`}>{worker.beneficiariesEnrolled.toLocaleString()}</td><td className={`${tdCell} whitespace-nowrap text-muted-foreground`}>{formatDate(worker.lastEnrollmentAt)}</td><td className={`${tdCell} whitespace-nowrap text-muted-foreground`}>{formatDate(worker.lastSyncedAt)}</td><td className={tdCell}><StatusBadge status={statusLabel(worker.status)} /></td><td className={tdCell}><button aria-label={`View ${worker.name}`} className="text-muted-foreground hover:text-foreground" onClick={(event) => { event.stopPropagation(); navigate(`/admin/field-workers/${worker.id}`) }} type="button">•••</button></td></tr>)}{!query.isPending && workers.length === 0 && <tr><td className="px-6 py-14 text-center text-sm text-muted-foreground" colSpan={8}>No field workers match your search and filters.</td></tr>}</tbody></table></div>}
        {!query.isError && <div className="flex items-center justify-between border-t border-border px-4 py-3"><p className="text-sm text-muted-foreground">Page {pageIndex + 1}</p><div className="flex gap-2"><Button disabled={pageIndex === 0 || query.isFetching} onClick={() => setPageIndex((current) => Math.max(0, current - 1))} variant="outline"><ChevronLeft aria-hidden="true" /> Previous</Button><Button disabled={!meta?.hasMore || !meta.nextCursor || query.isFetching} onClick={nextPage} variant="outline">Next <ChevronRight aria-hidden="true" /></Button></div></div>}
      </div>

      {createOpen && <CreateFieldWorkerDialog onCreated={setCredentials} onOpenChange={setCreateOpen} open />}
      {credentials && <CredentialResultDialog onOpenChange={(nextOpen) => { if (!nextOpen) setCredentials(null) }} open result={credentials} title="Field worker created" />}
    </div>
  )
}
