import { LoaderCircle, RefreshCw, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { type FormEvent, useState } from 'react'

import { getApiErrorMessage } from '@/api'
import { btnPrimary, btnSecondary, tdCell, thCell } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'

import { useCapitationPreview, useCapitations, useGenerateCapitation } from '../hooks'
import type { CapitationPeriod, GenerateCapitationResult } from '../types'
import { CAPITATION_MONTHS, formatLagosDate, formatNaira } from '../utils'

type Stage = 'select' | 'preview' | 'confirm' | 'success'

interface GenerateCapitationDialogProps {
  initialPeriod: CapitationPeriod
  onGenerated: (result: GenerateCapitationResult) => void
  onOpenChange: (open: boolean) => void
  open: boolean
}

const YEARS = Array.from({ length: 101 }, (_, index) => 2100 - index)

export function GenerateCapitationDialog({ initialPeriod, onGenerated, onOpenChange, open }: GenerateCapitationDialogProps) {
  const [month, setMonth] = useState(initialPeriod.month)
  const [year, setYear] = useState(initialPeriod.year)
  const [previewPeriod, setPreviewPeriod] = useState<CapitationPeriod | null>(null)
  const [stage, setStage] = useState<Stage>('select')
  const activePeriod = previewPeriod ?? { month, year }
  const previewQuery = useCapitationPreview(activePeriod.month, activePeriod.year, previewPeriod !== null)
  const existingRunQuery = useCapitations({ ...activePeriod, limit: 1 }, previewPeriod !== null)
  const mutation = useGenerateCapitation()
  const preview = previewQuery.data
  const hasExistingRun = Boolean(existingRunQuery.data?.summary || existingRunQuery.data?.items.length)

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen && mutation.isPending) return
    onOpenChange(nextOpen)
  }

  function loadPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPreviewPeriod({ month, year })
    setStage('preview')
  }

  function submitGeneration() {
    if (!previewPeriod) return
    mutation.mutate(previewPeriod, { onSuccess: (result) => { onGenerated(result); setStage('success') } })
  }

  function closeAndReset() {
    if (mutation.isPending) return
    mutation.reset()
    setMonth(initialPeriod.month)
    setYear(initialPeriod.year)
    setPreviewPeriod(null)
    setStage('select')
    onOpenChange(false)
  }

  return (
    <Dialog.Root onOpenChange={changeOpen} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/25" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-card shadow-2xl outline-none" onEscapeKeyDown={(event) => mutation.isPending && event.preventDefault()} onInteractOutside={(event) => mutation.isPending && event.preventDefault()}>
          <div className="flex shrink-0 items-start justify-between border-b border-border px-6 py-5">
            <div><Dialog.Title className="text-lg font-semibold">{stage === 'success' ? 'Capitation generated' : 'Generate capitation'}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">{stage === 'select' && 'Choose the period to calculate using the server rate.'}{stage === 'preview' && 'Review the server calculation before generating the run.'}{stage === 'confirm' && 'Confirm this financial calculation.'}{stage === 'success' && 'The newest run is now available on the capitation page.'}</Dialog.Description></div>
            <Button aria-label="Close capitation dialog" disabled={mutation.isPending} onClick={closeAndReset} size="icon" variant="ghost"><X aria-hidden="true" /></Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {stage === 'select' && <form className="space-y-5" id="capitation-period-form" onSubmit={loadPreview}><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><label className="text-sm font-semibold" htmlFor="generation-month">Month</label><select className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm" id="generation-month" onChange={(event) => setMonth(Number(event.target.value))} value={month}>{CAPITATION_MONTHS.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}</select></div><div className="space-y-1.5"><label className="text-sm font-semibold" htmlFor="generation-year">Year</label><select className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm" id="generation-year" onChange={(event) => setYear(Number(event.target.value))} value={year}>{YEARS.map((value) => <option key={value}>{value}</option>)}</select></div></div><div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">The backend will use its configured capitation rate and include every active facility and active enrollment.</div></form>}

            {stage === 'preview' && <div>{(previewQuery.isPending || existingRunQuery.isPending) && <div className="flex min-h-56 items-center justify-center gap-2 text-sm font-medium text-muted-foreground"><LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> Calculating preview…</div>}{previewQuery.isError && <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-center" role="alert"><p className="font-semibold">Unable to calculate this preview.</p><p className="text-sm text-muted-foreground">{getApiErrorMessage(previewQuery.error, 'Check your connection and try again.')}</p><Button onClick={() => void previewQuery.refetch()} variant="outline"><RefreshCw aria-hidden="true" /> Retry</Button></div>}{preview && !existingRunQuery.isPending && <div className="space-y-5">{hasExistingRun && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><strong>A run already exists for this period.</strong> Generating again creates a new run, and the newest run becomes the one displayed.</div>}<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[['Facilities', preview.totalFacilities.toLocaleString()], ['Beneficiaries', preview.totalBeneficiaries.toLocaleString()], ['Rate', formatNaira(preview.rate)], ['Total capitation', formatNaira(preview.totalCapitation)]].map(([label, value]) => <div className="rounded-xl bg-muted p-4" key={label}><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>)}</div><div className="overflow-hidden rounded-xl border border-border"><div className="overflow-x-auto"><table className="w-full"><thead><tr>{['Facility', 'LGA', 'Beneficiaries', 'Rate', 'Amount'].map((heading) => <th className={thCell} key={heading}>{heading}</th>)}</tr></thead><tbody>{preview.records.slice(0, 5).map((record) => <tr key={record.healthFacilityId}><td className={`${tdCell} font-semibold`}>{record.facilityName}</td><td className={`${tdCell} text-muted-foreground`}>{record.lga}</td><td className={tdCell}>{record.beneficiaryCount.toLocaleString()}</td><td className={tdCell}>{formatNaira(record.rate)}</td><td className={`${tdCell} font-semibold`}>{formatNaira(record.amount)}</td></tr>)}{preview.records.length === 0 && <tr><td className="px-5 py-10 text-center text-sm text-muted-foreground" colSpan={5}>No active facilities are available for this preview.</td></tr>}</tbody></table></div>{preview.records.length > 5 && <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">Showing 5 of {preview.records.length.toLocaleString()} facilities in this preview.</p>}</div></div>}</div>}

            {stage === 'confirm' && preview && <div className="space-y-4"><div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950"><p className="font-semibold">{hasExistingRun ? 'Generate a newer run?' : 'Generate this capitation run?'}</p><p className="mt-1 text-sm">This will calculate {formatNaira(preview.totalCapitation)} for {preview.totalBeneficiaries.toLocaleString()} beneficiaries across {preview.totalFacilities.toLocaleString()} facilities for {CAPITATION_MONTHS[preview.month - 1]} {preview.year}.</p></div>{mutation.isError && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{getApiErrorMessage(mutation.error, 'Unable to generate capitation.')}</p>}</div>}

            {stage === 'success' && mutation.data && <div className="space-y-5 text-center"><div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-800">✓</div><div><p className="text-lg font-semibold">Capitation generated successfully</p><p className="mt-1 text-sm text-muted-foreground">Generated {formatLagosDate(mutation.data.generatedAt)}</p></div><div className="grid grid-cols-2 gap-3 text-left lg:grid-cols-4">{[['Facilities', mutation.data.totalFacilities.toLocaleString()], ['Beneficiaries', mutation.data.totalBeneficiaries.toLocaleString()], ['Rate', formatNaira(mutation.data.rate)], ['Total capitation', formatNaira(mutation.data.totalCapitation)]].map(([label, value]) => <div className="rounded-xl bg-muted p-4" key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}</div></div>}
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-border px-6 py-4">{stage === 'select' && <><Button className={btnSecondary} onClick={closeAndReset} type="button" variant="outline">Cancel</Button><Button className={btnPrimary} form="capitation-period-form" type="submit">Preview</Button></>}{stage === 'preview' && <><Button className={btnSecondary} onClick={() => { setPreviewPeriod(null); setStage('select') }} type="button" variant="outline">Back</Button><Button className={btnPrimary} disabled={!preview || previewQuery.isError || existingRunQuery.isPending} onClick={() => setStage('confirm')} type="button">{hasExistingRun ? 'Review regeneration' : 'Continue'}</Button></>}{stage === 'confirm' && <><Button className={btnSecondary} disabled={mutation.isPending} onClick={() => { mutation.reset(); setStage('preview') }} type="button" variant="outline">Back</Button><Button className={btnPrimary} disabled={mutation.isPending} onClick={submitGeneration} type="button">{mutation.isPending ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> Generating…</> : hasExistingRun ? 'Regenerate capitation' : 'Generate capitation'}</Button></>}{stage === 'success' && <Button className={btnPrimary} onClick={closeAndReset} type="button">View capitation</Button>}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
