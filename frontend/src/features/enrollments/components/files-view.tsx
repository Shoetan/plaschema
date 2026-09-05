import { ChevronLeft, ChevronRight, Download, FileSpreadsheet, IdCard, LoaderCircle, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/api'
import { StatusBadge } from '@/components/admin/status-badge'
import { cardShadow, tabGroup, tdCell, thCell } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { useFileJobDownload, useFileJobs, useGenerateIdCards } from '../hooks'
import type { FileJobStatus } from '../types'
import { downloadFromUrl, formatEnrollmentDate, statusLabel } from '../utils'

type StatusFilter = 'all' | FileJobStatus

export function FilesView() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<StatusFilter>('all')
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined])
  const [pageIndex, setPageIndex] = useState(0)
  const query = useFileJobs({ cursor: cursors[pageIndex], limit: 50, status: status === 'all' ? undefined : status })
  const download = useFileJobDownload()
  const generate = useGenerateIdCards()
  const jobs = query.data?.items ?? []
  const meta = query.data?.meta

  function resetPage() { setCursors([undefined]); setPageIndex(0) }
  function nextPage() {
    if (!meta?.hasMore || !meta.nextCursor) return
    setCursors((current) => { const next = current.slice(0, pageIndex + 1); next[pageIndex + 1] = meta.nextCursor ?? undefined; return next })
    setPageIndex((current) => current + 1)
  }
  async function handleDownload(id: string) {
    try {
      const result = await download.mutateAsync(id)
      downloadFromUrl(result.downloadUrl, result.filename)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to get a download link.'))
    }
  }
  async function retryCards(ids: string[]) {
    try {
      await generate.mutateAsync(ids)
      toast.success('A new ID-card job has been queued.')
      void query.refetch()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to retry the ID-card job.'))
    }
  }

  return <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight">Files</h1><p className="mt-1 text-sm text-muted-foreground">Track and download generated ID-card PDFs and enrollment reports.</p></div><div className="flex gap-2"><Button onClick={() => navigate('/admin/beneficiaries')} variant="outline">CBHI Enrolments</Button><Button onClick={() => navigate('/admin/id-cards')}>Generate ID cards</Button></div></div>
    <div className="flex flex-wrap items-center gap-3"><div className={tabGroup}>{(['all', 'queued', 'processing', 'completed', 'failed'] as const).map((item) => <button aria-pressed={status === item} className={`h-10 rounded-full px-4 text-xs font-semibold capitalize ${status === item ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`} key={item} onClick={() => { setStatus(item); resetPage() }} type="button">{item}</button>)}</div>{query.isFetching && <span className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Refreshing jobs</span>}</div>
    <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}>
      {query.isError && !query.data ? <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center" role="alert"><p className="font-semibold">Unable to load generated files.</p><p className="text-sm text-muted-foreground">{getApiErrorMessage(query.error)}</p><Button onClick={() => void query.refetch()} variant="outline"><RefreshCw aria-hidden="true" /> Retry</Button></div> : <div className="overflow-x-auto"><table className="w-full"><thead><tr>{['File', 'Type', 'Created', 'Completed', 'Status', 'Action'].map((heading) => <th className={thCell} key={heading}>{heading}</th>)}</tr></thead><tbody>{query.isPending ? Array.from({ length: 6 }, (_, row) => <tr key={row}>{Array.from({ length: 6 }, (__, cell) => <td className={tdCell} key={cell}><Skeleton className="h-5 w-full" /></td>)}</tr>) : jobs.map((job) => {
        const retryIds = job.kind === 'id_card' ? job.metadata?.enrollmentIds : undefined
        return <tr key={job.id}><td className={tdCell}><div className="flex items-center gap-3">{job.kind === 'id_card' ? <IdCard className="size-5 text-muted-foreground" /> : <FileSpreadsheet className="size-5 text-muted-foreground" />}<div><p className="max-w-md truncate font-semibold">{job.title}</p>{job.error && <p className="mt-1 max-w-md text-xs text-destructive">{job.error}</p>}</div></div></td><td className={`${tdCell} text-muted-foreground`}>{job.kind === 'id_card' ? 'ID cards' : 'Enrollment report'} · {job.format.toUpperCase()}</td><td className={`${tdCell} whitespace-nowrap text-muted-foreground`}>{formatEnrollmentDate(job.createdAt, true)}</td><td className={`${tdCell} whitespace-nowrap text-muted-foreground`}>{formatEnrollmentDate(job.completedAt, true)}</td><td className={tdCell}><StatusBadge status={statusLabel(job.status)} /></td><td className={tdCell}>{job.canDownload ? <Button disabled={download.isPending && download.variables === job.id} onClick={() => void handleDownload(job.id)} size="sm"><Download aria-hidden="true" /> Download</Button> : job.status === 'failed' && retryIds?.length ? <Button disabled={generate.isPending} onClick={() => void retryCards(retryIds)} size="sm" variant="outline"><RefreshCw aria-hidden="true" /> Retry cards</Button> : job.status === 'failed' && job.kind === 'enrollment_report' ? <Button onClick={() => navigate('/admin/beneficiaries')} size="sm" variant="outline">Run export again</Button> : <span className="text-xs text-muted-foreground">{job.status === 'queued' ? 'Waiting' : job.status === 'processing' ? 'Generating' : 'Unavailable'}</span>}</td></tr>
      })}{!query.isPending && jobs.length === 0 && <tr><td className="px-6 py-16 text-center" colSpan={6}><p className="font-semibold">No files in this view.</p><p className="mt-1 text-sm text-muted-foreground">Generated ID cards and enrollment reports will appear here.</p></td></tr>}</tbody></table></div>}
      {!query.isError && <div className="flex items-center justify-between border-t border-border px-4 py-3"><p className="text-sm text-muted-foreground">Page {pageIndex + 1} · Showing {jobs.length} jobs</p><div className="flex gap-2"><Button disabled={pageIndex === 0 || query.isFetching} onClick={() => setPageIndex((current) => Math.max(0, current - 1))} variant="outline"><ChevronLeft aria-hidden="true" /> Previous</Button><Button disabled={!meta?.hasMore || !meta.nextCursor || query.isFetching} onClick={nextPage} variant="outline">Next <ChevronRight aria-hidden="true" /></Button></div></div>}
    </div>
  </div>
}
