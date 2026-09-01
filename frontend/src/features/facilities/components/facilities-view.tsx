import { ChevronLeft, ChevronRight, LoaderCircle, Plus, RefreshCw, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { StatusBadge } from '@/components/admin/status-badge'
import { btnPrimary, btnSecondary, cardShadow, searchBar, tabGroup, tdCell, thCell } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useWardOptions } from '@/features/wards/hooks'
import type { WardListItem } from '@/features/wards/types'

import { useHealthFacilities } from '../hooks'
import type { HealthFacilityLevel, HealthFacilityStatus } from '../types'
import { BatchUploadFacilitiesDialog } from './batch-upload-facilities-dialog'
import { CreateFacilityDialog } from './create-facility-dialog'

const PLATEAU_LGAS = ['Barkin Ladi', 'Bassa', 'Bokkos', 'Jos East', 'Jos North', 'Jos South', 'Kanam', 'Kanke', 'Langtang North', 'Langtang South', 'Mangu', 'Mikang', 'Pankshin', "Qua'an Pan", 'Riyom', 'Shendam', 'Wase']
type StatusFilter = 'all' | HealthFacilityStatus
type LevelFilter = '' | HealthFacilityLevel
type Modal = 'create' | 'upload' | null

function statusLabel(status: HealthFacilityStatus) { return status === 'active' ? 'Active' : 'Inactive' }

export function FacilitiesView() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [debouncedType, setDebouncedType] = useState('')
  const [lga, setLga] = useState('')
  const [wardSearch, setWardSearch] = useState('')
  const [debouncedWardSearch, setDebouncedWardSearch] = useState('')
  const [selectedWard, setSelectedWard] = useState<WardListItem | null>(null)
  const [level, setLevel] = useState<LevelFilter>('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined])
  const [pageIndex, setPageIndex] = useState(0)
  const [modal, setModal] = useState<Modal>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setDebouncedType(typeFilter.trim())
      setCursors([undefined])
      setPageIndex(0)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search, typeFilter])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedWardSearch(wardSearch.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [wardSearch])

  const wardsQuery = useWardOptions(debouncedWardSearch)
  const wards = useMemo(() => {
    const byId = new Map<string, WardListItem>()
    if (selectedWard) byId.set(selectedWard.id, selectedWard)
    for (const ward of wardsQuery.data?.pages.flatMap((page) => page.items) ?? []) byId.set(ward.id, ward)
    return [...byId.values()]
  }, [selectedWard, wardsQuery.data])

  const query = useHealthFacilities({
    cursor: cursors[pageIndex], limit: 50,
    search: debouncedSearch || undefined,
    wardId: selectedWard?.id,
    type: debouncedType || undefined,
    lga: lga || undefined,
    level: level || undefined,
    status: status === 'all' ? undefined : status,
  })
  const facilities = query.data?.items ?? []
  const meta = query.data?.meta
  const activeCount = facilities.filter((facility) => facility.status === 'active').length
  const beneficiaryCount = facilities.reduce((total, facility) => total + facility.beneficiaries, 0)

  function resetPage() { setCursors([undefined]); setPageIndex(0) }
  function nextPage() {
    const nextCursor = meta?.nextCursor
    if (!meta?.hasMore || !nextCursor) return
    setCursors((current) => { const next = current.slice(0, pageIndex + 1); next[pageIndex + 1] = nextCursor; return next })
    setPageIndex((current) => current + 1)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-[-0.48px]">Facilities</h1><p className="mt-0.5 text-sm text-muted-foreground">Manage healthcare facilities participating in the programme.</p></div><div className="flex gap-2"><button className={btnSecondary} onClick={() => setModal('upload')} type="button"><Upload aria-hidden="true" className="size-4" /> Upload Facilities</button><button className={btnPrimary} onClick={() => setModal('create')} type="button"><Plus aria-hidden="true" className="size-4" /> Add Facility</button></div></div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[{ label: 'Facilities · Current page', value: facilities.length }, { label: 'Active · Current page', value: activeCount }, { label: 'Beneficiaries · Current page', value: beneficiaryCount.toLocaleString() }].map((item) => <div className={`flex flex-col gap-1 rounded-xl bg-card p-5 ${cardShadow}`} key={item.label}><p className="text-xs font-medium text-muted-foreground">{item.label}</p>{query.isPending ? <Skeleton className="mt-1 h-8 w-24" /> : <p className="text-[28px] font-semibold tracking-[-0.56px]">{item.value}</p>}</div>)}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className={searchBar} style={{ flex: '1 1 0', maxWidth: '280px' }}><svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" /><path d="M10.5 10.5L13 13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" /></svg><input aria-label="Search facilities" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" maxLength={160} onChange={(event) => setSearch(event.target.value)} placeholder="Search facilities..." value={search} />{query.isFetching && <LoaderCircle aria-label="Updating facilities" className="size-4 animate-spin" />}</div>
        <select aria-label="Filter by LGA" className="h-10 rounded-full border border-border bg-card px-3 text-sm" onChange={(event) => { setLga(event.target.value); resetPage() }} value={lga}><option value="">All LGAs</option>{PLATEAU_LGAS.map((item) => <option key={item}>{item}</option>)}</select>
        <input aria-label="Search ward filter options" className="h-10 w-40 rounded-full border border-border bg-card px-3 text-sm outline-none" onChange={(event) => setWardSearch(event.target.value)} placeholder="Search wards" value={wardSearch} />
        <select aria-label="Filter by ward" className="h-10 max-w-56 rounded-full border border-border bg-card px-3 text-sm" disabled={wardsQuery.isPending} onChange={(event) => { setSelectedWard(wards.find((ward) => ward.id === event.target.value) ?? null); resetPage() }} value={selectedWard?.id ?? ''}><option value="">{wardsQuery.isPending ? 'Loading wards…' : 'All wards'}</option>{wards.map((ward) => <option key={ward.id} value={ward.id}>{ward.name} — {ward.lga}</option>)}</select>
        {wardsQuery.hasNextPage && <Button disabled={wardsQuery.isFetchingNextPage} onClick={() => void wardsQuery.fetchNextPage()} variant="outline">{wardsQuery.isFetchingNextPage ? 'Loading…' : 'More wards'}</Button>}
        <input aria-label="Filter by facility type" className="h-10 w-44 rounded-full border border-border bg-card px-3 text-sm outline-none" maxLength={120} onChange={(event) => setTypeFilter(event.target.value)} placeholder="All facility types" value={typeFilter} />
        <select aria-label="Filter by level" className="h-10 rounded-full border border-border bg-card px-3 text-sm" onChange={(event) => { setLevel(event.target.value as LevelFilter); resetPage() }} value={level}><option value="">All levels</option><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="tertiary">Tertiary</option></select>
        <div className={tabGroup}>{(['all', 'active', 'inactive'] as const).map((item) => <button aria-pressed={status === item} className={`h-10 rounded-full px-4 text-xs font-semibold capitalize ${status === item ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`} key={item} onClick={() => { setStatus(item); resetPage() }} type="button">{item}</button>)}</div>
        <span className="ml-auto text-sm text-muted-foreground">{query.isPending ? 'Loading facilities…' : `Showing ${facilities.length} facilities`}</span>
      </div>

      <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}>
        {query.isError && !query.data ? <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center" role="alert"><p className="font-semibold">Unable to load facilities.</p><p className="text-sm text-muted-foreground">Check your connection and try again.</p><Button onClick={() => void query.refetch()} variant="outline"><RefreshCw aria-hidden="true" /> Retry</Button></div> : <div className="overflow-x-auto"><table className="w-full"><thead><tr>{['Facility Name', 'Type', 'Level', 'Ward', 'LGA', 'Beneficiaries', 'Status', 'Actions'].map((heading) => <th className={thCell} key={heading}>{heading}</th>)}</tr></thead><tbody>{query.isPending ? Array.from({ length: 6 }, (_, row) => <tr key={row}>{Array.from({ length: 8 }, (__, cell) => <td className={tdCell} key={cell}><Skeleton className="h-5 w-full" /></td>)}</tr>) : facilities.map((facility) => <tr className="cursor-pointer hover:bg-muted/40" key={facility.id} onClick={() => navigate(`/admin/facilities/${facility.id}`)}><td className={`${tdCell} font-semibold`}>{facility.name}</td><td className={`${tdCell} text-muted-foreground`}>{facility.type}</td><td className={`${tdCell} capitalize text-muted-foreground`}>{facility.level}</td><td className={`${tdCell} text-muted-foreground`}>{facility.ward.name}</td><td className={`${tdCell} text-muted-foreground`}>{facility.ward.lga}</td><td className={`${tdCell} font-semibold`}>{facility.beneficiaries.toLocaleString()}</td><td className={tdCell}><StatusBadge status={statusLabel(facility.status)} /></td><td className={tdCell}><button aria-label={`View ${facility.name}`} className="text-muted-foreground hover:text-foreground" onClick={(event) => { event.stopPropagation(); navigate(`/admin/facilities/${facility.id}`) }} type="button">•••</button></td></tr>)}{!query.isPending && facilities.length === 0 && <tr><td className="px-6 py-14 text-center text-sm text-muted-foreground" colSpan={8}>No facilities match your search and filters.</td></tr>}</tbody></table></div>}
        {!query.isError && <div className="flex items-center justify-between border-t border-border px-4 py-3"><p className="text-sm text-muted-foreground">Page {pageIndex + 1}</p><div className="flex gap-2"><Button disabled={pageIndex === 0 || query.isFetching} onClick={() => setPageIndex((current) => Math.max(0, current - 1))} variant="outline"><ChevronLeft aria-hidden="true" /> Previous</Button><Button disabled={!meta?.hasMore || !meta.nextCursor || query.isFetching} onClick={nextPage} variant="outline">Next <ChevronRight aria-hidden="true" /></Button></div></div>}
      </div>

      <CreateFacilityDialog onOpenChange={(open) => setModal(open ? 'create' : null)} open={modal === 'create'} />
      <BatchUploadFacilitiesDialog onOpenChange={(open) => setModal(open ? 'upload' : null)} open={modal === 'upload'} />
    </div>
  )
}
