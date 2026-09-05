import { ChevronLeft, ChevronRight, IdCard, LoaderCircle, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/api'
import { StatusBadge } from '@/components/admin/status-badge'
import { btnPrimary, btnSecondary, cardShadow, searchBar, tdCell, thCell } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { useEnrollments, useGenerateIdCards } from '../hooks'
import type { EnrollmentListItem, PrintedStatus } from '../types'
import { formatEnrollmentDate, statusLabel } from '../utils'
import { JobProgressPanel } from './job-progress-panel'

export function IdCardGenerationView() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [printedStatus, setPrintedStatus] = useState<PrintedStatus>('all')
  const [category, setCategory] = useState('')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined])
  const [pageIndex, setPageIndex] = useState(0)
  const [selected, setSelected] = useState<Map<string, EnrollmentListItem>>(new Map())
  const [jobId, setJobId] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedSearch(search.trim()); setCursors([undefined]); setPageIndex(0) }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const datesValid = !createdFrom || !createdTo || createdFrom <= createdTo
  const query = useEnrollments({
    cursor: cursors[pageIndex], limit: 50, search: debouncedSearch || undefined,
    printedStatus, category: category.trim() || undefined,
    createdFrom: datesValid && createdFrom ? createdFrom : undefined,
    createdTo: datesValid && createdTo ? createdTo : undefined,
  })
  const generate = useGenerateIdCards()
  const rows = query.data?.items ?? []
  const meta = query.data?.meta

  function resetPage() { setCursors([undefined]); setPageIndex(0) }
  function toggle(row: EnrollmentListItem) {
    setSelected((current) => {
      const next = new Map(current)
      if (next.has(row.id)) next.delete(row.id)
      else if (next.size < 9) next.set(row.id, row)
      else toast.error('You can generate up to 9 ID cards at a time.')
      return next
    })
  }
  function nextPage() {
    if (!meta?.hasMore || !meta.nextCursor) return
    setCursors((current) => { const next = current.slice(0, pageIndex + 1); next[pageIndex + 1] = meta.nextCursor ?? undefined; return next })
    setPageIndex((current) => current + 1)
  }
  async function handleGenerate() {
    try {
      const result = await generate.mutateAsync([...selected.keys()])
      setJobId(result.jobId)
      setSelected(new Map())
      toast.success('ID-card PDF has been queued.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to generate ID cards.'))
    }
  }

  return <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight">ID Card Generation</h1><p className="mt-1 text-sm text-muted-foreground">Select between one and nine beneficiaries for a ready-to-print A4 PDF.</p></div><div className="flex gap-2"><button className={btnSecondary} onClick={() => navigate('/admin/files')} type="button">View Files</button><button className={btnPrimary} disabled={selected.size === 0 || generate.isPending} onClick={() => void handleGenerate()} type="button"><IdCard className="size-4" aria-hidden="true" /> {generate.isPending ? 'Queueing…' : `Generate cards${selected.size ? ` (${selected.size})` : ''}`}</button></div></div>
    {jobId && <JobProgressPanel jobId={jobId} onClose={() => setJobId(null)} />}

    <div className={`rounded-xl bg-card p-4 ${cardShadow}`}>
      <div className="flex flex-wrap gap-3"><div className={`${searchBar} min-w-64 flex-1`}><svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" /><path d="M10.5 10.5L13 13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" /></svg><input aria-label="Search beneficiaries for cards" className="flex-1 bg-transparent text-sm outline-none" maxLength={80} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or enrollment ID…" value={search} />{query.isFetching && <LoaderCircle className="size-4 animate-spin" />}</div><select aria-label="Filter by printed status" className="h-10 rounded-full border border-border bg-card px-3 text-sm" onChange={(event) => { setPrintedStatus(event.target.value as PrintedStatus); resetPage() }} value={printedStatus}><option value="all">All print states</option><option value="not_printed">Not printed</option><option value="printed">Already printed</option></select><input aria-label="Filter by exact category" className="h-10 rounded-full border border-border bg-card px-3 text-sm" maxLength={120} onBlur={resetPage} onChange={(event) => setCategory(event.target.value)} placeholder="Exact category" value={category} /><input aria-label="Created from" className="h-10 rounded-full border border-border bg-card px-3 text-sm" onChange={(event) => { setCreatedFrom(event.target.value); resetPage() }} type="date" value={createdFrom} /><input aria-label="Created to" className="h-10 rounded-full border border-border bg-card px-3 text-sm" onChange={(event) => { setCreatedTo(event.target.value); resetPage() }} type="date" value={createdTo} /></div>
      {!datesValid && <p className="mt-3 text-sm text-destructive">The starting date must not be after the ending date.</p>}
      {selected.size > 0 && <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">{[...selected.values()].map((item) => <button className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold hover:bg-destructive/10" key={item.id} onClick={() => toggle(item)} title="Remove from selection" type="button">{item.beneficiaryName} ×</button>)}<button className="px-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => setSelected(new Map())} type="button">Clear all</button></div>}
    </div>

    <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}>
      {query.isError && !query.data ? <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center" role="alert"><p className="font-semibold">Unable to load enrollments.</p><p className="text-sm text-muted-foreground">{getApiErrorMessage(query.error)}</p><Button onClick={() => void query.refetch()} variant="outline"><RefreshCw aria-hidden="true" /> Retry</Button></div> : <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className={`${thCell} w-12`}>Select</th>{['Enrollment ID', 'Beneficiary', 'Category', 'Ward', 'Enrolled', 'Printed', 'Status'].map((heading) => <th className={thCell} key={heading}>{heading}</th>)}</tr></thead><tbody>{query.isPending ? Array.from({ length: 6 }, (_, row) => <tr key={row}>{Array.from({ length: 8 }, (__, cell) => <td className={tdCell} key={cell}><Skeleton className="h-5 w-full" /></td>)}</tr>) : rows.map((row) => <tr key={row.id} className={selected.has(row.id) ? 'bg-accent' : 'hover:bg-muted/40'}><td className={tdCell}><input aria-label={`Select ${row.beneficiaryName}`} checked={selected.has(row.id)} disabled={!selected.has(row.id) && selected.size >= 9} onChange={() => toggle(row)} type="checkbox" /></td><td className={`${tdCell} font-mono text-xs text-muted-foreground`}>{row.enrollmentId}</td><td className={`${tdCell} font-semibold`}>{row.beneficiaryName}</td><td className={`${tdCell} text-muted-foreground`}>{row.category}</td><td className={`${tdCell} text-muted-foreground`}>{row.healthFacility.ward.name}</td><td className={`${tdCell} whitespace-nowrap text-muted-foreground`}>{formatEnrollmentDate(row.createdAt)}</td><td className={`${tdCell} text-muted-foreground`}>{row.hasPrinted ? `${row.printCount} time${row.printCount === 1 ? '' : 's'}` : 'No'}</td><td className={tdCell}><StatusBadge status={statusLabel(row.status)} /></td></tr>)}{!query.isPending && rows.length === 0 && <tr><td className="px-6 py-16 text-center" colSpan={8}><p className="font-semibold">No beneficiaries match these filters.</p><p className="mt-1 text-sm text-muted-foreground">Try a different search or clear the filters.</p></td></tr>}</tbody></table></div>}
      {!query.isError && <div className="flex items-center justify-between border-t border-border px-4 py-3"><p className="text-sm text-muted-foreground">Page {pageIndex + 1} · {selected.size} of 9 selected</p><div className="flex gap-2"><Button disabled={pageIndex === 0 || query.isFetching} onClick={() => setPageIndex((current) => Math.max(0, current - 1))} variant="outline"><ChevronLeft aria-hidden="true" /> Previous</Button><Button disabled={!meta?.hasMore || !meta.nextCursor || query.isFetching} onClick={nextPage} variant="outline">Next <ChevronRight aria-hidden="true" /></Button></div></div>}
    </div>
  </div>
}
