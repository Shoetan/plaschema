import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { type FieldErrors, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { getApiErrorMessage } from '@/api'
import { btnPrimary, btnSecondary } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useUpdateWard } from '../hooks'
import type { UpdateWardPayload, WardRecord, WardStatus } from '../types'

interface EditWardDialogProps {
  open: boolean
  ward: WardRecord
  onOpenChange: (open: boolean) => void
}

interface EditWardFormValues {
  name: string
  lga: string
  status: WardStatus
}

const editWardSchema = z.object({
  name: z.string().trim().min(2, 'Ward name must be at least 2 characters.').max(120, 'Ward name must be 120 characters or fewer.'),
  lga: z.string().trim().min(2, 'LGA must be at least 2 characters.').max(120, 'LGA must be 120 characters or fewer.'),
  status: z.enum(['active', 'inactive']),
})

export function EditWardDialog({ open, ward, onOpenChange }: EditWardDialogProps) {
  const mutation = useUpdateWard()
  const { register, handleSubmit, formState: { errors } } = useForm<EditWardFormValues>({
    resolver: zodResolver(editWardSchema),
    defaultValues: { name: ward.name, lga: ward.lga, status: ward.status },
  })

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen && mutation.isPending) return
    onOpenChange(nextOpen)
  }

  function submit(values: EditWardFormValues) {
    const payload: UpdateWardPayload = {}
    if (values.name !== ward.name) payload.name = values.name
    if (values.lga !== ward.lga) payload.lga = values.lga
    if (values.status !== ward.status) payload.status = values.status

    if (Object.keys(payload).length === 0) {
      toast.info('No ward changes to save.')
      onOpenChange(false)
      return
    }

    mutation.mutate({ id: ward.id, payload }, { onSuccess: () => onOpenChange(false) })
  }

  function invalid(formErrors: FieldErrors<EditWardFormValues>) {
    toast.error(formErrors.name?.message ?? formErrors.lga?.message ?? 'Check the ward details and try again.')
  }

  return (
    <Dialog.Root onOpenChange={changeOpen} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-card shadow-2xl outline-none" onEscapeKeyDown={(event) => mutation.isPending && event.preventDefault()} onInteractOutside={(event) => mutation.isPending && event.preventDefault()}>
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <div>
              <Dialog.Title className="text-lg font-semibold text-foreground">Edit Ward</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">Update this ward’s name, LGA, or status.</Dialog.Description>
            </div>
            <Button aria-label="Close edit ward dialog" disabled={mutation.isPending} onClick={() => changeOpen(false)} size="icon" type="button" variant="ghost"><X aria-hidden="true" /></Button>
          </div>
          <form onSubmit={handleSubmit(submit, invalid)}>
            <div className="flex flex-col gap-4 px-6 py-5">
              {mutation.isError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{getApiErrorMessage(mutation.error, 'Unable to update the ward.')}</div>}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" htmlFor="edit-ward-name">Ward Name</label>
                <Input {...register('name', { onChange: () => mutation.reset() })} aria-describedby={errors.name ? 'edit-ward-name-error' : undefined} aria-invalid={Boolean(errors.name)} autoFocus id="edit-ward-name" />
                {errors.name?.message && <p className="text-xs text-destructive" id="edit-ward-name-error">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" htmlFor="edit-ward-lga">LGA</label>
                <Input {...register('lga', { onChange: () => mutation.reset() })} aria-describedby={errors.lga ? 'edit-ward-lga-error' : undefined} aria-invalid={Boolean(errors.lga)} id="edit-ward-lga" />
                {errors.lga?.message && <p className="text-xs text-destructive" id="edit-ward-lga-error">{errors.lga.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" htmlFor="edit-ward-status">Status</label>
                <select {...register('status', { onChange: () => mutation.reset() })} className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id="edit-ward-status">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <Button className={`${btnSecondary} flex-1`} disabled={mutation.isPending} onClick={() => changeOpen(false)} type="button" variant="outline">Cancel</Button>
              <Button className={`${btnPrimary} flex-1`} disabled={mutation.isPending} type="submit">
                {mutation.isPending ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> Saving…</> : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
