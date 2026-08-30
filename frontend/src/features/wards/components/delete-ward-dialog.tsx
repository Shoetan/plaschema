import { LoaderCircle } from 'lucide-react'

import { getApiErrorMessage } from '@/api'
import { btnSecondary } from '@/components/admin/styles'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

import { useDeleteWard } from '../hooks'

interface DeleteWardDialogProps {
  open: boolean
  wardId: string
  wardName: string
  onDeleted: () => void
  onOpenChange: (open: boolean) => void
}

export function DeleteWardDialog({ open, wardId, wardName, onDeleted, onOpenChange }: DeleteWardDialogProps) {
  const mutation = useDeleteWard()

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen && mutation.isPending) return
    if (nextOpen) mutation.reset()
    onOpenChange(nextOpen)
  }

  return (
    <AlertDialog onOpenChange={changeOpen} open={open}>
      <AlertDialogContent>
        <AlertDialogTitle className="text-lg font-semibold">Delete {wardName}?</AlertDialogTitle>
        <AlertDialogDescription className="mt-2 text-sm text-muted-foreground">This permanently removes the ward. The server will refuse deletion if field workers are still assigned.</AlertDialogDescription>
        {mutation.isError && <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{getApiErrorMessage(mutation.error, 'The ward could not be deleted. Remove its field-worker assignments or try again.')}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <AlertDialogCancel asChild><Button className={btnSecondary} disabled={mutation.isPending} variant="outline">Cancel</Button></AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button disabled={mutation.isPending} onClick={(event) => { event.preventDefault(); mutation.mutate(wardId, { onSuccess: onDeleted }) }} variant="destructive">
              {mutation.isPending ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> Deleting…</> : 'Delete Ward'}
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
