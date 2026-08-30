import { LoaderCircle } from 'lucide-react'

import { getApiErrorMessage } from '@/api'
import { btnSecondary } from '@/components/admin/styles'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

import { useDeleteHealthFacility } from '../hooks'

interface DeleteFacilityDialogProps { open: boolean; facilityId: string; facilityName: string; onDeleted: () => void; onOpenChange: (open: boolean) => void }

export function DeleteFacilityDialog({ open, facilityId, facilityName, onDeleted, onOpenChange }: DeleteFacilityDialogProps) {
  const mutation = useDeleteHealthFacility()
  function changeOpen(nextOpen: boolean) { if (!nextOpen && mutation.isPending) return; if (nextOpen) mutation.reset(); onOpenChange(nextOpen) }
  return <AlertDialog onOpenChange={changeOpen} open={open}><AlertDialogContent><AlertDialogTitle className="text-lg font-semibold">Delete {facilityName}?</AlertDialogTitle><AlertDialogDescription className="mt-2 text-sm text-muted-foreground">This permanently removes the facility. Records linked to it may prevent deletion.</AlertDialogDescription>{mutation.isError && <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{getApiErrorMessage(mutation.error, 'Unable to delete the facility.')}</p>}<div className="mt-6 flex justify-end gap-3"><AlertDialogCancel asChild><Button className={btnSecondary} disabled={mutation.isPending} variant="outline">Cancel</Button></AlertDialogCancel><AlertDialogAction asChild><Button disabled={mutation.isPending} onClick={(event) => { event.preventDefault(); mutation.mutate(facilityId, { onSuccess: onDeleted }) }} variant="destructive">{mutation.isPending ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> Deleting…</> : 'Delete Facility'}</Button></AlertDialogAction></div></AlertDialogContent></AlertDialog>
}
