import { ChevronLeft, ChevronRight, Eye, LoaderCircle, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getApiErrorMessage } from '@/api'
import { SearchableFilterSelect } from '@/components/admin/searchable-filter-select'
import { cardShadow, searchBar, tdCell, thCell } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PLATEAU_LGAS } from '@/features/enrollments/utils'
import { useWardOptions } from '@/features/wards/hooks'
import type { WardListItem } from '@/features/wards/types'

import { useHouseholds } from '../hooks'
import { formatHouseholdDate, householdSize } from '../utils'

export function HouseholdsTableView() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [lga, setLga] = useState('')
  const [wardSearch, setWardSearch] = useState('')
  const [selectedWard, setSelectedWard] = useState<WardListItem | null>(null)
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined])
  const [pageIndex, setPageIndex] = useState(0)

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

  const query = useHouseholds({
    cursor: cursors[pageIndex],
    limit: 50,
    search: debouncedSearch || undefined,
    lga: lga || undefined,
    wardId: selectedWard?.id,
  })
  const rows = query.data?.items ?? []
  const meta = query.data?.meta

  function resetPage() {
    setCursors([undefined])
    setPageIndex(0)
  }

  function nextPage() {
    if (!meta?.hasMore || !meta.nextCursor) return
    setCursors((current) => {
      const next = current.slice(0, pageIndex + 1)
      next[pageIndex + 1] = meta.nextCursor ?? undefined
      return next
    })
    setPageIndex((current) => current + 1)
  }

  function clearFilters() {
    setSearch('')
    setDebouncedSearch('')
    setLga('')
    setWardSearch('')
    setSelectedWard(null)
    resetPage()
  }

  return (
    <>
      <div className={`rounded-xl bg-card p-4 ${cardShadow}`}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_11rem_minmax(12rem,16rem)_auto]">
          <label className="grid gap-1 text-xs font-medium text-muted-foreground sm:col-span-2 xl:col-span-1">
            Search
            <div className={`${searchBar} w-full min-w-0`}>
              <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" /><path d="M10.5 10.5L13 13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" /></svg>
              <input aria-label="Search households" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" maxLength={120} onChange={(event) => setSearch(event.target.value)} placeholder="Search household ID, head name or address…" value={search} />
              {query.isFetching && <LoaderCircle aria-label="Updating households" className="size-4 shrink-0 animate-spin" />}
            </div>
          </label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">LGA<select className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground" onChange={(event) => { setLga(event.target.value); resetPage() }} value={lga}><option value="">All LGAs</option>{PLATEAU_LGAS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <SearchableFilterSelect allLabel="All wards" emptyText="No wards found." label="Ward" loading={wardsQuery.isFetching} onSearchChange={setWardSearch} onSelect={(option) => { setSelectedWard(option ? wards.find((item) => item.id === option.id) ?? null : null); resetPage() }} options={wards.map((item) => ({ id: item.id, label: item.name, description: item.lga }))} search={wardSearch} searchPlaceholder="Search wards…" value={selectedWard ? { id: selectedWard.id, label: selectedWard.name, description: selectedWard.lga } : null} />
          <div className="grid gap-1 text-xs font-medium text-muted-foreground sm:col-span-2 xl:col-span-1">
            <span className="invisible select-none" aria-hidden="true">Clear</span>
            <button className="h-10 text-sm font-medium text-muted-foreground hover:text-foreground" onClick={clearFilters} type="button">Clear</button>
          </div>
        </div>
      </div>

      <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}>
        {query.isError && !query.data ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center" role="alert">
            <p className="font-semibold">Unable to load households.</p>
            <p className="text-sm text-muted-foreground">{getApiErrorMessage(query.error, 'Check your connection and try again.')}</p>
            <Button onClick={() => void query.refetch()} variant="outline"><RefreshCw aria-hidden="true" /> Retry</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Household head', 'Household ID', 'LGA', 'Household size', 'Ward', 'Registered', 'Actions'].map((heading) => (
                    <th className={thCell} key={heading}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {query.isPending
                  ? Array.from({ length: 6 }, (_, row) => (
                    <tr key={row}>{Array.from({ length: 7 }, (__, cell) => <td className={tdCell} key={cell}><Skeleton className="h-5 w-full" /></td>)}</tr>
                  ))
                  : rows.map((row) => (
                    <tr className="cursor-pointer hover:bg-muted/40" key={row.id} onClick={() => navigate(`/admin/beneficiaries/households/${row.id}`)}>
                      <td className={`${tdCell} font-semibold`}>{row.headName ?? 'Head pending'}</td>
                      <td className={`${tdCell} font-mono text-xs text-muted-foreground`}>{row.householdCode}</td>
                      <td className={`${tdCell} text-muted-foreground`}>{row.ward.lga}</td>
                      <td className={tdCell}>{householdSize(row)}</td>
                      <td className={`${tdCell} text-muted-foreground`}>{row.ward.name}</td>
                      <td className={`${tdCell} whitespace-nowrap text-muted-foreground`}>{formatHouseholdDate(row.createdAt)}</td>
                      <td className={tdCell} onClick={(event) => event.stopPropagation()}>
                        <button aria-label={`View household ${row.householdCode}`} className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => navigate(`/admin/beneficiaries/households/${row.id}`)} type="button">
                          <Eye aria-hidden="true" size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                {!query.isPending && rows.length === 0 && (
                  <tr>
                    <td className="px-6 py-16 text-center" colSpan={7}>
                      <p className="font-semibold">No households match these filters.</p>
                      <p className="mt-1 text-sm text-muted-foreground">Clear some filters and try again.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!query.isError && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">Page {pageIndex + 1} · Showing {rows.length} households</p>
            <div className="flex gap-2">
              <Button disabled={pageIndex === 0 || query.isFetching} onClick={() => setPageIndex((current) => Math.max(0, current - 1))} variant="outline"><ChevronLeft aria-hidden="true" /> Previous</Button>
              <Button disabled={!meta?.hasMore || !meta.nextCursor || query.isFetching} onClick={nextPage} variant="outline">Next <ChevronRight aria-hidden="true" /></Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
