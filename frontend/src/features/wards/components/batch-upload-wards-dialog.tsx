import {
  CircleCheck,
  FileSpreadsheet,
  LoaderCircle,
  Upload,
  X,
} from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/api'
import { btnPrimary, btnSecondary } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { useUploadWardsBatch } from '../hooks/useWardMutations'

const MAX_FILE_SIZE = 2 * 1024 * 1024
const SUPPORTED_EXTENSIONS = ['.csv', '.xlsx', '.xls']

interface BatchUploadWardsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function validateFile(file: File): string | null {
  const filename = file.name.toLowerCase()
  if (!SUPPORTED_EXTENSIONS.some((extension) => filename.endsWith(extension))) {
    return 'Choose a CSV or Excel (.xlsx/.xls) file.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'The file must be 2 MB or smaller.'
  }
  if (file.size === 0) return 'The selected file is empty.'
  return null
}

export function BatchUploadWardsDialog({
  open,
  onOpenChange,
}: BatchUploadWardsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const uploadMutation = useUploadWardsBatch()
  const result = uploadMutation.data
  const totalProcessed = result ? result.created + result.failed : 0

  function resetDialog() {
    setFile(null)
    setFileError(null)
    setDragActive(false)
    uploadMutation.reset()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleDialogChange(nextOpen: boolean) {
    if (!nextOpen && uploadMutation.isPending) return
    if (!nextOpen) resetDialog()
    onOpenChange(nextOpen)
  }

  function selectFile(nextFile: File | null) {
    uploadMutation.reset()
    if (!nextFile) {
      setFile(null)
      setFileError(null)
      return
    }

    const validationError = validateFile(nextFile)
    if (validationError) {
      setFile(null)
      setFileError(validationError)
      toast.error(validationError)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setFile(nextFile)
    setFileError(null)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0] ?? null)
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragActive(false)
    selectFile(event.dataTransfer.files[0] ?? null)
  }

  function removeFile() {
    selectFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleUpload() {
    if (file) uploadMutation.mutate(file)
  }

  const requestError = uploadMutation.isError
    ? getApiErrorMessage(
        uploadMutation.error,
        'Unable to upload the wards file.',
      )
    : null
  const activeStep = result ? 3 : uploadMutation.isPending ? 2 : 1

  return (
    <Dialog.Root onOpenChange={handleDialogChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-card shadow-2xl outline-none"
          onEscapeKeyDown={(event) => {
            if (uploadMutation.isPending) event.preventDefault()
          }}
          onInteractOutside={(event) => {
            if (uploadMutation.isPending) event.preventDefault()
          }}
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Upload Wards File
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Upload wards from a CSV or Excel file.
            </Dialog.Description>
            <Button
              aria-label="Close ward upload dialog"
              disabled={uploadMutation.isPending}
              onClick={() => handleDialogChange(false)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X aria-hidden="true" />
            </Button>
          </div>

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
            {!uploadMutation.isPending && !result && (
              <div className="flex flex-col gap-4">
                {requestError && (
                  <div
                    className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    role="alert"
                  >
                    {requestError}
                  </div>
                )}

                <label
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:bg-muted/30 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30',
                    dragActive && 'border-primary bg-accent/50',
                  )}
                  htmlFor="wards-upload-file"
                  onDragEnter={(event) => {
                    event.preventDefault()
                    setDragActive(true)
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop}
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Upload aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">
                      Drag and drop your wards file here
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      or click to browse CSV or Excel files up to 2 MB
                    </span>
                  </span>
                  <input
                    accept=".csv,.xlsx,.xls"
                    className="sr-only"
                    id="wards-upload-file"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    type="file"
                  />
                </label>

                {fileError && (
                  <p className="text-sm text-destructive" role="alert">
                    {fileError}
                  </p>
                )}

                {file && (
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                    <FileSpreadsheet
                      aria-hidden="true"
                      className="size-5 shrink-0 text-muted-foreground"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      aria-label={`Remove ${file.name}`}
                      onClick={removeFile}
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </div>
                )}

                <Button
                  className="self-start px-0 text-sm"
                  disabled
                  title="Template download is not available yet"
                  type="button"
                  variant="link"
                >
                  Download CSV Template
                </Button>
              </div>
            )}

            {uploadMutation.isPending && (
              <div
                aria-live="polite"
                className="flex flex-col items-center gap-4 py-8 text-center"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Uploading and validating wards…
                  </p>
                  <p className="mt-1 max-w-sm truncate text-sm text-muted-foreground">
                    {file?.name}
                  </p>
                </div>
              </div>
            )}

            {result && (
              <div aria-live="polite" className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-success-foreground">
                  <CircleCheck aria-hidden="true" className="size-5" />
                  <span className="font-semibold">Import complete</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    {
                      label: 'Created',
                      value: result.created,
                      valueClass: 'text-success-foreground',
                    },
                    {
                      label: 'Failed',
                      value: result.failed,
                      valueClass: 'text-destructive',
                    },
                    {
                      label: 'Total Processed',
                      value: totalProcessed,
                      valueClass: 'text-foreground',
                    },
                  ].map(({ label, value, valueClass }) => (
                    <div
                      className="rounded-lg border border-border bg-muted/40 p-3"
                      key={label}
                    >
                      <p className="text-xs font-medium text-muted-foreground">
                        {label}
                      </p>
                      <p className={cn('text-2xl font-semibold', valueClass)}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {result.errors.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      Rows that were not imported
                    </p>
                    <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                      {result.errors.map((error, index) => (
                        <div
                          className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2"
                          key={`${error.row}-${index}`}
                        >
                          <span className="shrink-0 text-xs font-semibold text-destructive">
                            Row {error.row}
                          </span>
                          <span className="text-sm text-destructive">
                            {error.message}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="self-start px-0 text-sm"
                      disabled
                      title="Error report download is not available yet"
                      type="button"
                      variant="link"
                    >
                      Download Error Report
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Every row in the file was imported successfully.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-6 pb-6">
            {result ? (
              <Button
                className={`${btnPrimary} flex-1 justify-center`}
                onClick={() => handleDialogChange(false)}
                type="button"
              >
                Done
              </Button>
            ) : (
              <>
                <Button
                  className={`${btnSecondary} flex-1 justify-center`}
                  disabled={uploadMutation.isPending}
                  onClick={() => handleDialogChange(false)}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  className={`${btnPrimary} flex-1 justify-center`}
                  disabled={!file || uploadMutation.isPending}
                  onClick={handleUpload}
                  type="button"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <LoaderCircle className="animate-spin" aria-hidden="true" />
                      Uploading…
                    </>
                  ) : (
                    'Upload File'
                  )}
                </Button>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
