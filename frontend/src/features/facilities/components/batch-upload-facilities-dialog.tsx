import { CircleCheck, FileSpreadsheet, LoaderCircle, Upload, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/api'
import { btnPrimary, btnSecondary } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { useUploadHealthFacilitiesBatch } from '../hooks'

const MAX_SIZE = 2 * 1024 * 1024
const EXTENSIONS = ['.csv', '.xlsx', '.xls']

interface BatchUploadFacilitiesDialogProps { open: boolean; onOpenChange: (open: boolean) => void }

function validateFile(file: File) {
  const name = file.name.toLowerCase()
  if (!EXTENSIONS.some((extension) => name.endsWith(extension))) return 'Choose a CSV or Excel (.xlsx/.xls) file.'
  if (file.size > MAX_SIZE) return 'The file must be 2 MB or smaller.'
  if (file.size === 0) return 'The selected file is empty.'
  return null
}

export function BatchUploadFacilitiesDialog({ open, onOpenChange }: BatchUploadFacilitiesDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const mutation = useUploadHealthFacilitiesBatch()
  const result = mutation.data
  const activeStep = result ? 3 : mutation.isPending ? 2 : 1

  function reset() { setFile(null); setDragActive(false); mutation.reset(); if (inputRef.current) inputRef.current.value = '' }
  function changeOpen(nextOpen: boolean) { if (!nextOpen && mutation.isPending) return; if (!nextOpen) reset(); onOpenChange(nextOpen) }
  function choose(nextFile: File | null) {
    mutation.reset()
    if (!nextFile) {
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    const error = validateFile(nextFile)
    if (error) {
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      toast.error(error)
      return
    }
    setFile(nextFile)
  }
  function fileChange(event: ChangeEvent<HTMLInputElement>) { choose(event.target.files?.[0] ?? null) }
  function drop(event: DragEvent<HTMLLabelElement>) { event.preventDefault(); setDragActive(false); choose(event.dataTransfer.files[0] ?? null) }

  return (
    <Dialog.Root onOpenChange={changeOpen} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-card shadow-2xl outline-none" onEscapeKeyDown={(event) => mutation.isPending && event.preventDefault()} onInteractOutside={(event) => mutation.isPending && event.preventDefault()}>
          <div className="flex items-start justify-between border-b border-border px-6 py-5"><div><Dialog.Title className="text-lg font-semibold">Upload Facilities</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Upload CSV or Excel with required columns: name, ward.</Dialog.Description></div><Button aria-label="Close facility upload dialog" disabled={mutation.isPending} onClick={() => changeOpen(false)} size="icon" variant="ghost"><X aria-hidden="true" /></Button></div>
          <ol
            aria-label="Upload progress"
            className="flex items-center justify-center gap-2 border-b border-border px-4 py-4 sm:gap-4 sm:px-6"
          >
            {['Choose File', 'Uploading', 'Results'].map((label, index) => {
              const step = index + 1
              const complete = activeStep > step
              const active = activeStep === step

              return (
                <li className="flex items-center gap-2" key={label}>
                  <span
                    aria-current={active ? 'step' : undefined}
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground',
                      complete && 'bg-primary text-primary-foreground',
                      active && 'bg-foreground text-background',
                    )}
                  >
                    {complete ? '✓' : step}
                  </span>
                  <span
                    className={cn(
                      'hidden text-xs font-medium text-muted-foreground sm:inline',
                      active && 'text-foreground',
                    )}
                  >
                    {label}
                  </span>
                  {step < 3 && <span className="h-px w-5 bg-border sm:w-8" />}
                </li>
              )
            })}
          </ol>
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {mutation.isError && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{getApiErrorMessage(mutation.error, 'Unable to upload the facilities file.')}</div>}
            {!mutation.isPending && !result && <div className="flex flex-col gap-4">
              <label className={cn('flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border p-8 text-center hover:bg-muted/30 focus-within:ring-2 focus-within:ring-ring', dragActive && 'border-primary bg-accent/50')} htmlFor="facilities-upload-file" onDragEnter={(event) => { event.preventDefault(); setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDragOver={(event) => event.preventDefault()} onDrop={drop}>
                <span className="flex size-12 items-center justify-center rounded-full bg-accent"><Upload aria-hidden="true" /></span><span><span className="block text-sm font-semibold">Drag and drop your facilities file here</span><span className="mt-1 block text-sm text-muted-foreground">or click to browse CSV or Excel files up to 2 MB</span></span><input accept=".csv,.xlsx,.xls" className="sr-only" id="facilities-upload-file" onChange={fileChange} ref={inputRef} type="file" />
              </label>
              {file && <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"><FileSpreadsheet aria-hidden="true" className="size-5" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div><Button aria-label={`Remove ${file.name}`} onClick={() => choose(null)} size="icon-sm" variant="ghost"><X aria-hidden="true" /></Button></div>}
              <p className="text-xs text-muted-foreground">The ward column must match an existing ward name. LGA is taken from that ward.</p>
            </div>}
            {mutation.isPending && <div aria-live="polite" className="flex flex-col items-center gap-3 py-10 text-center"><LoaderCircle aria-hidden="true" className="size-8 animate-spin" /><p className="font-semibold">Uploading and validating facilities…</p><p className="text-sm text-muted-foreground">{file?.name}</p></div>}
            {result && <div aria-live="polite" className="flex flex-col gap-4"><div className="flex items-center gap-2 font-semibold text-success-foreground"><CircleCheck aria-hidden="true" /> Import complete</div><div className="grid gap-3 sm:grid-cols-3">{[{ label: 'Created', value: result.created }, { label: 'Failed', value: result.failed }, { label: 'Processed', value: result.created + result.failed }].map((item) => <div className="rounded-lg border border-border bg-muted/40 p-3" key={item.label}><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-2xl font-semibold">{item.value}</p></div>)}</div>{result.errors.length > 0 && <div><p className="mb-2 text-sm font-semibold">Rows not imported</p><div className="max-h-52 space-y-2 overflow-y-auto">{result.errors.map((error, index) => <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive" key={`${error.row}-${index}`}><span className="shrink-0 text-xs font-semibold">Row {error.row}</span><span className="text-sm">{error.message}</span></div>)}</div></div>}</div>}
          </div>
          <div className="flex justify-end gap-3 border-t border-border px-6 py-4"><Button className={btnSecondary} disabled={mutation.isPending} onClick={() => changeOpen(false)} variant="outline">{result ? 'Close' : 'Cancel'}</Button>{!result && <Button className={btnPrimary} disabled={!file || mutation.isPending} onClick={() => file && mutation.mutate(file)}>{mutation.isPending ? 'Uploading…' : 'Upload Facilities'}</Button>}{result && <Button onClick={reset}>Upload Another File</Button>}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
