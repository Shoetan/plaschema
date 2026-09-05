import { Download, FileClock, LoaderCircle, RefreshCw, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import { getApiErrorMessage } from '@/api'
import { Button } from '@/components/ui/button'

import { useFileJob, useFileJobDownload } from '../hooks'
import { downloadFromUrl } from '../utils'

interface JobProgressPanelProps {
  jobId: string
  onClose: () => void
}

export function JobProgressPanel({ jobId, onClose }: JobProgressPanelProps) {
  const query = useFileJob(jobId)
  const download = useFileJobDownload()
  const job = query.data

  async function handleDownload() {
    const result = await download.mutateAsync(jobId)
    downloadFromUrl(result.downloadUrl, result.filename)
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-card" role="status">
      {(!job || job.status === 'queued' || job.status === 'processing') && <LoaderCircle className="size-5 animate-spin text-primary-foreground" aria-hidden="true" />}
      {job?.status === 'completed' && <Download className="size-5 text-success-foreground" aria-hidden="true" />}
      {job?.status === 'failed' && <FileClock className="size-5 text-destructive" aria-hidden="true" />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{job?.title ?? 'Preparing your file…'}</p>
        <p className="text-xs text-muted-foreground">
          {query.isError
            ? getApiErrorMessage(query.error, 'Unable to check file progress.')
            : job?.status === 'completed'
              ? 'Your file is ready to download.'
              : job?.status === 'failed'
                ? (job.error ?? 'File generation failed.')
                : job?.status === 'processing'
                  ? 'Generating your file…'
                  : 'Your request is waiting to be processed.'}
        </p>
      </div>
      {query.isError && <Button onClick={() => void query.refetch()} size="sm" variant="outline"><RefreshCw aria-hidden="true" /> Retry check</Button>}
      {job?.status === 'completed' && <Button disabled={download.isPending} onClick={() => void handleDownload()} size="sm">{download.isPending ? 'Getting link…' : 'Download'}</Button>}
      <Button asChild size="sm" variant="outline"><Link to="/admin/files">View Files</Link></Button>
      <button aria-label="Dismiss file progress" className="rounded-md p-1 text-muted-foreground hover:bg-muted" onClick={onClose} type="button"><X className="size-4" /></button>
      {download.isError && <p className="w-full text-xs text-destructive">{getApiErrorMessage(download.error, 'Unable to get a download link.')}</p>}
    </div>
  )
}
