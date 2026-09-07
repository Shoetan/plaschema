import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/api'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

import { useUpdateEnrollmentStatus, useUpdateEnrollmentStatuses } from '../hooks'
import type { EnrollmentStatusResult, EnrollmentStatusSkipReason, EnrollmentStatusTarget } from '../types'

export interface EnrollmentStatusAction {
  bulk: boolean
  enrollmentIds: string[]
  subject: string
  target: EnrollmentStatusTarget
}

interface EnrollmentStatusDialogProps {
  action: EnrollmentStatusAction | null
  onCompleted?: (result: EnrollmentStatusResult) => void
  onOpenChange: (open: boolean) => void
}

const reasonLabels: Record<EnrollmentStatusSkipReason, string> = {
  not_found: 'No longer found',
  unchanged: 'Already had this status',
  invalid_transition: 'Cannot be changed',
}

export function EnrollmentStatusDialog({ action, onCompleted, onOpenChange }: EnrollmentStatusDialogProps) {
  const singleMutation = useUpdateEnrollmentStatus()
  const bulkMutation = useUpdateEnrollmentStatuses()
  const [result, setResult] = useState<EnrollmentStatusResult | null>(null)
  const isPending = singleMutation.isPending || bulkMutation.isPending
  const error = singleMutation.error ?? bulkMutation.error

  function changeOpen(open: boolean) {
    if (isPending) return
    if (!open) {
      setResult(null)
      singleMutation.reset()
      bulkMutation.reset()
    }
    onOpenChange(open)
  }

  async function submit() {
    if (!action) return
    const id = action.enrollmentIds[0]
    if (!id) return
    try {
      const response = action.bulk
        ? await bulkMutation.mutateAsync({ enrollmentIds: action.enrollmentIds, status: action.target })
        : await singleMutation.mutateAsync({ id, status: action.target })
      onCompleted?.(response)
      if (response.skipped.length > 0) setResult(response)
      else {
        toast.success(`${response.updated} enrollment${response.updated === 1 ? '' : 's'} ${action.target === 'active' ? 'activated' : 'deactivated'}.`)
        changeOpen(false)
      }
    } catch {
      // The mutation exposes the normalized API error inside the confirmation dialog.
    }
  }

  const verb = action?.target === 'active' ? 'Activate' : 'Deactivate'
  const counts = result?.skipped.reduce<Record<EnrollmentStatusSkipReason, number>>((summary, item) => {
    summary[item.reason] += 1
    return summary
  }, { not_found: 0, unchanged: 0, invalid_transition: 0 })

  return (
    <AlertDialog onOpenChange={changeOpen} open={Boolean(action)}>
      <AlertDialogContent>
        {result ? <>
          <AlertDialogTitle>Status update complete</AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-sm text-muted-foreground">{result.updated} enrollment{result.updated === 1 ? '' : 's'} {result.status === 'active' ? 'activated' : 'deactivated'}. {result.skipped.length} skipped.</AlertDialogDescription>
          <div className="mt-4 space-y-2 rounded-xl bg-muted p-4">{counts && (Object.entries(counts) as Array<[EnrollmentStatusSkipReason, number]>).filter(([, count]) => count > 0).map(([reason, count]) => <div className="flex justify-between gap-4 text-sm" key={reason}><span>{reasonLabels[reason]}</span><strong>{count}</strong></div>)}</div>
          <div className="mt-6 flex justify-end"><Button onClick={() => changeOpen(false)}>Done</Button></div>
        </> : <>
          <AlertDialogTitle>{verb} enrollment{action?.bulk ? 's' : ''}?</AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-sm text-muted-foreground">This will {verb.toLowerCase()} {action?.subject}. Deceased records and records already in the requested status will be skipped.</AlertDialogDescription>
          {error && <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{getApiErrorMessage(error, `Unable to ${verb.toLowerCase()} the enrollment${action?.bulk ? 's' : ''}.`)}</p>}
          <div className="mt-6 flex justify-end gap-3"><AlertDialogCancel asChild><Button disabled={isPending} variant="outline">Cancel</Button></AlertDialogCancel><Button disabled={isPending} onClick={() => void submit()} variant={action?.target === 'disabled' ? 'destructive' : 'default'}>{isPending ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> Saving…</> : verb}</Button></div>
        </>}
      </AlertDialogContent>
    </AlertDialog>
  )
}
