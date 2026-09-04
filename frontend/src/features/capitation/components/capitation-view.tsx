import { ChevronLeft, ChevronRight, LoaderCircle, Plus, RefreshCw, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { btnPrimary, cardShadow, searchBar, tdCell, thCell } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { useCapitations } from '../hooks'
import type { GenerateCapitationResult } from '../types'
import { CAPITATION_MONTHS, PLATEAU_LGAS, currentLagosPeriod, formatLagosDate, formatNaira } from '../utils'
import { GenerateCapitationDialog } from './generate-capitation-dialog'

const YEARS = Array.from({ length: 101 }, (_, index) => 2100 - index)
const PAGE_SIZE = 50

export function CapitationView() {
  const navigate = useNavigate()
  const initialPeriod = useMemo(() => currentLagosPeriod(), [])
  const [month, setMonth] = useState(initialPeriod.month)
  const [year, setYear] = useState(initialPeriod.year)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [lga, setLga] = useState('')
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined])
  const [pageIndex, setPageIndex] = useState(0)
  const [showGenerate, setShowGenerate] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setCursors([undefined])
      setPageIndex(0)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const query = useCapitations({
    month,
    year,
    cursor: cursors[pageIndex],
    limit: PAGE_SIZE,
    lga: lga || undefined,
    search: debouncedSearch || undefined,
  })
  const records = query.data?.items ?? []
  const meta = query.data?.meta
  const summary = query.data?.summary
  const hasRun = Boolean(summary || records.length)
  const totalsAreRunWide = Boolean(summary)
  const totals = summary ?? {
    totalFacilities: records.length,
    totalBeneficiaries: records.reduce((total, record) => total + record.beneficiaryCount, 0),
    totalCapitation: records.reduce((total, record) => total + record.amount, 0),
  }
  const displayedRate = summary?.rate ?? records[0]?.rate

  function resetPage() {
    setCursors([undefined])
    setPageIndex(0)
  }

  function nextPage() {
    const nextCursor = meta?.nextCursor
    if (!meta?.hasMore || !nextCursor) return
    setCursors((current) => {
      const next = current.slice(0, pageIndex + 1)
      next[pageIndex + 1] = nextCursor
      return next
    })
    setPageIndex((current) => current + 1)
  }

  function generated(result: GenerateCapitationResult) {
    setMonth(result.month)
    setYear(result.year)
    resetPage()
  }

  const periodLabel = `${CAPITATION_MONTHS[month - 1]} ${year}`

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-[-0.48px]">Capitation</h1><p className="mt-0.5 text-sm text-muted-foreground">Calculate and review monthly capitation for active healthcare facilities.</p></div><Button className={btnPrimary} onClick={() => setShowGenerate(true)}><Plus aria-hidden="true" /> {hasRun ? 'Regenerate capitation' : 'Generate capitation'}</Button></div>

      <div className="flex w-fit flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-5 py-4"><span className="shrink-0 text-sm font-semibold">Capitation period:</span><select aria-label="Capitation month" className="h-10 rounded-lg border border-border bg-card px-3 text-sm" onChange={(event) => { setMonth(Number(event.target.value)); resetPage() }} value={month}>{CAPITATION_MONTHS.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}</select><select aria-label="Capitation year" className="h-10 rounded-lg border border-border bg-card px-3 text-sm" onChange={(event) => { setYear(Number(event.target.value)); resetPage() }} value={year}>{YEARS.map((value) => <option key={value}>{value}</option>)}</select>{query.isFetching && <LoaderCircle aria-label="Updating capitation" className="size-4 animate-spin text-muted-foreground" />}</div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{[[`Facilities · ${totalsAreRunWide ? 'Run total' : 'Current page'}`, totals.totalFacilities.toLocaleString()], [`Beneficiaries · ${totalsAreRunWide ? 'Run total' : 'Current page'}`, totals.totalBeneficiaries.toLocaleString()], ['Capitation rate', displayedRate === undefined ? '—' : formatNaira(displayedRate)], [`Capitation · ${totalsAreRunWide ? 'Run total' : 'Current page'}`, formatNaira(totals.totalCapitation)]].map(([label, value]) => <div className={`rounded-xl bg-card p-5 ${cardShadow}`} key={label}><p className="text-xs font-medium text-muted-foreground">{label}</p>{query.isPending ? <Skeleton className="mt-2 h-7 w-28" /> : <p className="mt-1 text-xl font-semibold">{value}</p>}</div>)}</div>

      {summary && <p className="-mt-3 text-xs text-muted-foreground">Latest run generated {formatLagosDate(summary.generatedAt)}</p>}
      {records.length > 0 && summary === undefined && <p className="-mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">Full run totals were not included by the API, so the cards show totals for this page only.</p>}
      {query.isError && query.data && <p className="-mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">The latest capitation update failed. The previous results remain visible. <button className="font-semibold underline" onClick={() => void query.refetch()} type="button">Retry</button></p>}

      <div className="flex flex-wrap items-center gap-3"><div className={searchBar} style={{ flex: '1 1 0', maxWidth: '300px' }}><Search aria-hidden="true" className="size-4" /><input aria-label="Search capitation facilities" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" maxLength={120} onChange={(event) => setSearch(event.target.value)} placeholder="Search facility or LGA..." value={search} /></div><select aria-label="Filter capitation by LGA" className="h-10 rounded-full border border-border bg-card px-3 text-sm" onChange={(event) => { setLga(event.target.value); resetPage() }} value={lga}><option value="">All LGAs</option>{PLATEAU_LGAS.map((item) => <option key={item}>{item}</option>)}</select><span className="ml-auto text-sm text-muted-foreground">{query.isPending ? 'Loading records…' : `${records.length} facilities on this page`}</span></div>

      <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}>
        {query.isError && !query.data ? <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center" role="alert"><p className="font-semibold">Unable to load capitation.</p><p className="text-sm text-muted-foreground">Check your connection and try again.</p><Button onClick={() => void query.refetch()} variant="outline"><RefreshCw aria-hidden="true" /> Retry</Button></div> : <div className="overflow-x-auto"><table className="w-full"><thead><tr>{['Facility', 'LGA', 'Period', 'Beneficiaries', 'Rate', 'Amount', 'Action'].map((heading) => <th className={thCell} key={heading}>{heading}</th>)}</tr></thead><tbody>{query.isPending ? Array.from({ length: 6 }, (_, row) => <tr key={row}>{Array.from({ length: 7 }, (__, cell) => <td className={tdCell} key={cell}><Skeleton className="h-5 w-full" /></td>)}</tr>) : records.map((record) => <tr className="hover:bg-muted/40" key={record.id}><td className={`${tdCell} font-semibold`}>{record.facilityName}</td><td className={`${tdCell} text-muted-foreground`}>{record.lga}</td><td className={`${tdCell} text-muted-foreground`}>{record.period}</td><td className={tdCell}>{record.beneficiaryCount.toLocaleString()}</td><td className={tdCell}>{formatNaira(record.rate)}</td><td className={`${tdCell} font-semibold`}>{formatNaira(record.amount)}</td><td className={tdCell}><Button onClick={() => navigate(`/admin/facilities/${record.healthFacilityId}`)} size="sm" variant="ghost">View facility</Button></td></tr>)}{!query.isPending && records.length === 0 && <tr><td className="px-6 py-16 text-center" colSpan={7}><p className="font-semibold">{debouncedSearch || lga ? 'No facilities match these filters.' : `No capitation run is available for ${periodLabel}.`}</p><p className="mt-1 text-sm text-muted-foreground">{debouncedSearch || lga ? 'Change the search or LGA filter and try again.' : 'Generate a run to calculate capitation for active facilities.'}</p>{!debouncedSearch && !lga && <Button className={`${btnPrimary} mt-4`} onClick={() => setShowGenerate(true)}><Plus aria-hidden="true" /> Generate capitation</Button>}</td></tr>}</tbody></table></div>}
        {!query.isError && <div className="flex items-center justify-between border-t border-border px-4 py-3"><p className="text-sm text-muted-foreground">Page {pageIndex + 1}</p><div className="flex gap-2"><Button disabled={pageIndex === 0 || query.isFetching} onClick={() => setPageIndex((current) => Math.max(0, current - 1))} variant="outline"><ChevronLeft aria-hidden="true" /> Previous</Button><Button disabled={!meta?.hasMore || !meta.nextCursor || query.isFetching} onClick={nextPage} variant="outline">Next <ChevronRight aria-hidden="true" /></Button></div></div>}
      </div>

      {showGenerate && <GenerateCapitationDialog initialPeriod={{ month, year }} onGenerated={generated} onOpenChange={setShowGenerate} open={showGenerate} />}
    </div>
  )
}
