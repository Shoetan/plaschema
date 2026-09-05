import { ChevronLeft, ChevronRight, Download, IdCard, LoaderCircle, RefreshCw, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/api'
import { StatusBadge } from '@/components/admin/status-badge'
import { btnPrimary, btnSecondary, cardShadow, searchBar, tdCell, thCell } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useHealthFacilities } from '@/features/facilities/hooks'
import { useFieldWorkers } from '@/features/field-workers/hooks'
import { useWardOptions } from '@/features/wards/hooks'
import type { WardListItem } from '@/features/wards/types'

import { useExportEnrollments, useGenerateIdCards, useEnrollments } from '../hooks'
import type { EnrollmentListItem, EnrollmentStatus, ExportEnrollmentPayload, PrintedStatus } from '../types'
import { formatEnrollmentDate, PLATEAU_LGAS, statusLabel } from '../utils'
import { JobProgressPanel } from './job-progress-panel'

type StatusFilter = 'all' | EnrollmentStatus

export function EnrollmentsView() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [printedStatus, setPrintedStatus] = useState<PrintedStatus>('all')
  const [category, setCategory] = useState('')
  const [lga, setLga] = useState('')
  const [wardSearch, setWardSearch] = useState('')
  const [selectedWard, setSelectedWard] = useState<WardListItem | null>(null)
  const [facilitySearch, setFacilitySearch] = useState('')
  const [facilityId, setFacilityId] = useState('')
  const [workerSearch, setWorkerSearch] = useState('')
  const [workerId, setWorkerId] = useState('')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [ageMin, setAgeMin] = useState('')
  const [ageMax, setAgeMax] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined])
  const [pageIndex, setPageIndex] = useState(0)
  const [selected, setSelected] = useState<Map<string, EnrollmentListItem>>(new Map())
  const [exportOpen, setExportOpen] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setCursors([undefined])
      setPageIndex(0)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const wardsQuery = useWardOptions(wardSearch.trim())
  const wards = useMemo(() => {
    const values = new Map<string, WardListItem>()
    if (selectedWard) values.set(selectedWard.id, selectedWard)
    for (const ward of wardsQuery.data?.pages.flatMap((page) => page.items) ?? []) values.set(ward.id, ward)
    return [...values.values()]
  }, [selectedWard, wardsQuery.data])
  const facilitiesQuery = useHealthFacilities({ limit: 100, search: facilitySearch.trim() || undefined, wardId: selectedWard?.id })
  const workersQuery = useFieldWorkers({ limit: 100, search: workerSearch.trim() || undefined })

  const ageMinNumber = ageMin === '' ? undefined : Number(ageMin)
  const ageMaxNumber = ageMax === '' ? undefined : Number(ageMax)
  const filtersValid = (ageMinNumber === undefined || ageMaxNumber === undefined || ageMinNumber <= ageMaxNumber)
    && (!createdFrom || !createdTo || createdFrom <= createdTo)

  const params = {
    cursor: cursors[pageIndex], limit: 50,
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
    printedStatus,
    category: category.trim() || undefined,
    lga: lga || undefined,
    wardId: selectedWard?.id,
    healthFacilityId: facilityId || undefined,
    enrolledByUserId: workerId || undefined,
    createdFrom: createdFrom || undefined,
    createdTo: createdTo || undefined,
    ageMin: filtersValid ? ageMinNumber : undefined,
    ageMax: filtersValid ? ageMaxNumber : undefined,
  } as const
  const query = useEnrollments(params)
  const generateCards = useGenerateIdCards()
  const exportMutation = useExportEnrollments()
  const rows = query.data?.items ?? []
  const meta = query.data?.meta

  function resetPage() { setCursors([undefined]); setPageIndex(0) }
  function nextPage() {
    if (!meta?.hasMore || !meta.nextCursor) return
    setCursors((current) => { const next = current.slice(0, pageIndex + 1); next[pageIndex + 1] = meta.nextCursor ?? undefined; return next })
    setPageIndex((current) => current + 1)
  }
  function toggle(row: EnrollmentListItem) {
    setSelected((current) => {
      const next = new Map(current)
      if (next.has(row.id)) next.delete(row.id)
      else if (next.size < 9) next.set(row.id, row)
      else toast.error('You can generate up to 9 ID cards at a time.')
      return next
    })
  }
  function clearFilters() {
    setSearch(''); setDebouncedSearch(''); setStatus('all'); setPrintedStatus('all'); setCategory(''); setLga('')
    setWardSearch(''); setSelectedWard(null); setFacilitySearch(''); setFacilityId(''); setWorkerSearch(''); setWorkerId('')
    setCreatedFrom(''); setCreatedTo(''); setAgeMin(''); setAgeMax(''); resetPage()
  }
  async function handleCards() {
    try {
      const result = await generateCards.mutateAsync([...selected.keys()])
      setActiveJobId(result.jobId)
      setSelected(new Map())
      toast.success('ID-card PDF has been queued.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to generate ID cards.'))
    }
  }
  function exportPayload(): ExportEnrollmentPayload {
    return {
      format: 'xlsx', wardId: selectedWard?.id, healthFacilityId: facilityId || undefined,
      enrolledByUserId: workerId || undefined, status: status === 'all' ? undefined : status,
      category: category.trim() || undefined, lga: lga || undefined, createdFrom: createdFrom || undefined,
      createdTo: createdTo || undefined, ageMin: filtersValid ? ageMinNumber : undefined, ageMax: filtersValid ? ageMaxNumber : undefined,
    }
  }
  async function handleExport() {
    try {
      const result = await exportMutation.mutateAsync(exportPayload())
      setExportOpen(false)
      setActiveJobId(result.jobId)
      toast.success('Excel report has been queued.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to export enrollments.'))
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-[-0.48px]">CBHI Enrolments</h1><p className="mt-1 text-sm text-muted-foreground">Review beneficiary records, prepare ID cards and export reports.</p></div>
        <div className="flex flex-wrap gap-2"><button className={btnSecondary} onClick={() => navigate('/admin/files')} type="button"><Download className="size-4" aria-hidden="true" /> Files</button><button className={btnPrimary} disabled={!filtersValid} onClick={() => setExportOpen(true)} type="button"><Download className="size-4" aria-hidden="true" /> Export Excel</button></div>
      </div>

      {activeJobId && <JobProgressPanel jobId={activeJobId} onClose={() => setActiveJobId(null)} />}

      {selected.size > 0 && <div className="flex flex-wrap items-center gap-3 rounded-xl bg-foreground px-4 py-3 text-background"><IdCard className="size-5 text-primary" aria-hidden="true" /><p className="flex-1 text-sm font-semibold">{selected.size} of 9 beneficiaries selected</p><Button disabled={generateCards.isPending} onClick={() => void handleCards()} size="sm">{generateCards.isPending ? 'Queueing…' : 'Generate ID cards'}</Button><button className="text-xs text-muted-foreground hover:text-background" onClick={() => setSelected(new Map())} type="button">Clear selection</button></div>}

      <div className={`rounded-xl bg-card p-4 ${cardShadow}`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className={`${searchBar} min-w-64 flex-1`}><svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" /><path d="M10.5 10.5L13 13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" /></svg><input aria-label="Search enrollments" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" maxLength={80} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, name, phone, NIN or category…" value={search} />{query.isFetching && <LoaderCircle className="size-4 animate-spin" aria-label="Updating enrollments" />}</div>
          <select aria-label="Filter enrollment status" className="h-10 rounded-full border border-border bg-card px-3 text-sm" onChange={(event) => { setStatus(event.target.value as StatusFilter); resetPage() }} value={status}><option value="all">All statuses</option><option value="pending">Pending</option><option value="active">Active</option><option value="disabled">Disabled</option><option value="deceased">Deceased</option></select>
          <select aria-label="Filter printed status" className="h-10 rounded-full border border-border bg-card px-3 text-sm" onChange={(event) => { setPrintedStatus(event.target.value as PrintedStatus); resetPage() }} value={printedStatus}><option value="all">All print states</option><option value="printed">Printed</option><option value="not_printed">Not printed</option></select>
          <Button onClick={() => setAdvancedOpen((open) => !open)} variant="outline"><SlidersHorizontal aria-hidden="true" /> {advancedOpen ? 'Hide filters' : 'More filters'}</Button>
          <button className="text-sm font-medium text-muted-foreground hover:text-foreground" onClick={clearFilters} type="button">Clear</button>
        </div>

        {advancedOpen && <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">Category<input className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground" maxLength={120} onBlur={resetPage} onChange={(event) => setCategory(event.target.value)} placeholder="Exact category" value={category} /></label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">LGA<select className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground" onChange={(event) => { setLga(event.target.value); resetPage() }} value={lga}><option value="">All LGAs</option>{PLATEAU_LGAS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">Search ward<input className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground" onChange={(event) => setWardSearch(event.target.value)} placeholder="Type a ward name" value={wardSearch} /></label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">Ward<select className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground" onChange={(event) => { setSelectedWard(wards.find((item) => item.id === event.target.value) ?? null); setFacilityId(''); resetPage() }} value={selectedWard?.id ?? ''}><option value="">All wards</option>{wards.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.lga}</option>)}</select></label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">Search facilities<input className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground" onChange={(event) => setFacilitySearch(event.target.value)} placeholder="Type a facility name" value={facilitySearch} /></label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">Facility<select className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground" onChange={(event) => { setFacilityId(event.target.value); resetPage() }} value={facilityId}><option value="">All facilities</option>{facilitiesQuery.data?.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">Search field workers<input className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground" onChange={(event) => setWorkerSearch(event.target.value)} placeholder="Type a worker name" value={workerSearch} /></label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">Field worker<select className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground" onChange={(event) => { setWorkerId(event.target.value); resetPage() }} value={workerId}><option value="">All field workers</option>{workersQuery.data?.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">Created from<input className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground" onChange={(event) => { setCreatedFrom(event.target.value); resetPage() }} type="date" value={createdFrom} /></label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">Created to<input className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground" onChange={(event) => { setCreatedTo(event.target.value); resetPage() }} type="date" value={createdTo} /></label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">Minimum age<input className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground" max="120" min="0" onChange={(event) => { setAgeMin(event.target.value); resetPage() }} type="number" value={ageMin} /></label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">Maximum age<input className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground" max="120" min="0" onChange={(event) => { setAgeMax(event.target.value); resetPage() }} type="number" value={ageMax} /></label>
          {!filtersValid && <p className="text-sm text-destructive sm:col-span-2 xl:col-span-4">The starting date/age must not be greater than the ending date/age.</p>}
        </div>}
      </div>

      <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}>
        {query.isError && !query.data ? <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center" role="alert"><p className="font-semibold">Unable to load enrollments.</p><p className="text-sm text-muted-foreground">{getApiErrorMessage(query.error, 'Check your connection and try again.')}</p><Button onClick={() => void query.refetch()} variant="outline"><RefreshCw aria-hidden="true" /> Retry</Button></div> : <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className={`${thCell} w-12`}>Select</th>{['Enrollment ID', 'Beneficiary', 'Category', 'Facility', 'Ward / LGA', 'Enrolled', 'Printed', 'Status'].map((heading) => <th className={thCell} key={heading}>{heading}</th>)}</tr></thead><tbody>{query.isPending ? Array.from({ length: 7 }, (_, row) => <tr key={row}>{Array.from({ length: 9 }, (__, cell) => <td className={tdCell} key={cell}><Skeleton className="h-5 w-full" /></td>)}</tr>) : rows.map((row) => <tr className="cursor-pointer hover:bg-muted/40" key={row.id} onClick={() => navigate(`/admin/beneficiaries/${row.id}`)}><td className={tdCell} onClick={(event) => event.stopPropagation()}><input aria-label={`Select ${row.beneficiaryName}`} checked={selected.has(row.id)} disabled={!selected.has(row.id) && selected.size >= 9} onChange={() => toggle(row)} type="checkbox" /></td><td className={`${tdCell} whitespace-nowrap font-mono text-xs text-muted-foreground`}>{row.enrollmentId}</td><td className={`${tdCell} font-semibold`}>{row.beneficiaryName}</td><td className={`${tdCell} text-muted-foreground`}>{row.category}</td><td className={`${tdCell} text-muted-foreground`}>{row.healthFacility.name}</td><td className={`${tdCell} text-muted-foreground`}>{row.healthFacility.ward.name}<br /><span className="text-xs">{row.healthFacility.ward.lga}</span></td><td className={`${tdCell} whitespace-nowrap text-muted-foreground`}>{formatEnrollmentDate(row.createdAt)}</td><td className={`${tdCell} whitespace-nowrap text-muted-foreground`}>{row.hasPrinted ? `${row.printCount} time${row.printCount === 1 ? '' : 's'}` : 'Not printed'}</td><td className={tdCell}><StatusBadge status={statusLabel(row.status)} /></td></tr>)}{!query.isPending && rows.length === 0 && <tr><td className="px-6 py-16 text-center" colSpan={9}><p className="font-semibold">No enrollments match these filters.</p><p className="mt-1 text-sm text-muted-foreground">Clear some filters and try again.</p></td></tr>}</tbody></table></div>}
        {!query.isError && <div className="flex items-center justify-between border-t border-border px-4 py-3"><p className="text-sm text-muted-foreground">Page {pageIndex + 1} · Showing {rows.length} records</p><div className="flex gap-2"><Button disabled={pageIndex === 0 || query.isFetching} onClick={() => setPageIndex((current) => Math.max(0, current - 1))} variant="outline"><ChevronLeft aria-hidden="true" /> Previous</Button><Button disabled={!meta?.hasMore || !meta.nextCursor || query.isFetching} onClick={nextPage} variant="outline">Next <ChevronRight aria-hidden="true" /></Button></div></div>}
      </div>

      {exportOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="export-title"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold" id="export-title">Export enrollment report</h2><p className="mt-1 text-sm text-muted-foreground">The Excel report will be prepared in the background and appear under Files.</p></div><button aria-label="Close export dialog" onClick={() => setExportOpen(false)} type="button"><X className="size-5" /></button></div>{(debouncedSearch || printedStatus !== 'all') && <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><p className="font-semibold">Some visible filters cannot be used for export.</p><p className="mt-1">{[debouncedSearch ? 'The broad search' : '', printedStatus !== 'all' ? 'the printed status' : ''].filter(Boolean).join(' and ')} will not be applied because the export API does not accept {debouncedSearch && printedStatus !== 'all' ? 'them' : 'that filter'}.</p></div>}<p className="mt-4 text-sm text-muted-foreground">Ward, facility, field worker, status, category, LGA, dates and age filters will be included when selected.</p><div className="mt-6 flex justify-end gap-2"><button className={btnSecondary} onClick={() => setExportOpen(false)} type="button">Cancel</button><button className={btnPrimary} disabled={exportMutation.isPending || !filtersValid} onClick={() => void handleExport()} type="button">{exportMutation.isPending ? 'Queueing…' : 'Create Excel file'}</button></div></div></div>}
    </div>
  )
}
