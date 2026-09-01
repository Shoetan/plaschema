import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, Search, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { getApiErrorMessage } from '@/api'
import { btnPrimary, btnSecondary } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useWardOptions } from '@/features/wards/hooks'

import { useUpdateFieldWorker } from '../hooks'
import type { FieldWorkerDetail, FieldWorkerWard } from '../types'

const schema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters.').max(120),
  phone: z.string().trim().min(7, 'Enter at least 7 characters.').max(32),
  status: z.enum(['active', 'inactive']),
  assignedWardIds: z.array(z.string()),
})

type Values = z.infer<typeof schema>

interface EditFieldWorkerDialogProps {
  detail: FieldWorkerDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditFieldWorkerDialog({ detail, open, onOpenChange }: EditFieldWorkerDialogProps) {
  const [wardSearch, setWardSearch] = useState('')
  const [debouncedWardSearch, setDebouncedWardSearch] = useState('')
  const mutation = useUpdateFieldWorker()
  const wardsQuery = useWardOptions(debouncedWardSearch)
  const { control, register, handleSubmit, setValue, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: detail.fieldWorker.name, phone: detail.fieldWorker.phone ?? '', status: detail.fieldWorker.status, assignedWardIds: detail.wards.map((ward) => ward.id) },
  })
  const selectedWardIds = useWatch({ control, name: 'assignedWardIds', defaultValue: [] })
  const wards = useMemo(() => {
    const byId = new Map<string, FieldWorkerWard>(detail.wards.map((ward) => [ward.id, ward]))
    for (const ward of wardsQuery.data?.pages.flatMap((page) => page.items) ?? []) byId.set(ward.id, ward)
    return [...byId.values()]
  }, [detail.wards, wardsQuery.data])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedWardSearch(wardSearch.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [wardSearch])

  function changeOpen(nextOpen: boolean) { if (!nextOpen && mutation.isPending) return; onOpenChange(nextOpen) }
  function toggleWard(id: string, checked: boolean) {
    const next = checked ? [...new Set([...selectedWardIds, id])] : selectedWardIds.filter((wardId) => wardId !== id)
    setValue('assignedWardIds', next, { shouldDirty: true })
  }
  function submit(values: Values) {
    const currentIds = detail.wards.map((ward) => ward.id).sort().join(',')
    const nextIds = [...values.assignedWardIds].sort().join(',')
    const payload = {
      ...(values.name.trim() !== detail.fieldWorker.name ? { name: values.name.trim() } : {}),
      ...(values.phone.trim() !== (detail.fieldWorker.phone ?? '') ? { phone: values.phone.trim() } : {}),
      ...(values.status !== detail.fieldWorker.status ? { status: values.status } : {}),
      ...(nextIds !== currentIds ? { assignedWardIds: values.assignedWardIds } : {}),
    }
    if (Object.keys(payload).length === 0) { toast.info('No field-worker changes to save.'); changeOpen(false); return }
    mutation.mutate({ id: detail.fieldWorker.id, payload }, { onSuccess: () => onOpenChange(false) })
  }

  return <Dialog.Root onOpenChange={changeOpen} open={open}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/20" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-card shadow-2xl outline-none" onEscapeKeyDown={(event) => mutation.isPending && event.preventDefault()} onInteractOutside={(event) => mutation.isPending && event.preventDefault()}>
    <div className="flex items-start justify-between border-b border-border px-6 py-5"><div><Dialog.Title className="text-lg font-semibold">Edit Field Worker</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Update account details and ward access.</Dialog.Description></div><Button aria-label="Close edit field worker dialog" disabled={mutation.isPending} onClick={() => changeOpen(false)} size="icon" variant="ghost"><X aria-hidden="true" /></Button></div>
    <form onSubmit={handleSubmit(submit)}><div className="grid gap-5 px-6 py-5">
      {mutation.isError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{getApiErrorMessage(mutation.error, 'Unable to update the field worker.')}</div>}
      <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-worker-name">Full Name</label><Input {...register('name', { onChange: () => mutation.reset() })} aria-invalid={Boolean(errors.name)} id="edit-worker-name" />{errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}</div><div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-worker-phone">Phone Number</label><Input {...register('phone', { onChange: () => mutation.reset() })} aria-invalid={Boolean(errors.phone)} id="edit-worker-phone" />{errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}</div><div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-worker-email">Email</label><Input id="edit-worker-email" readOnly value={detail.fieldWorker.email} /></div><div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-worker-status">Status</label><select {...register('status')} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" id="edit-worker-status"><option value="active">Active</option><option value="inactive">Inactive</option></select></div></div>
      <fieldset className="space-y-3"><div><legend className="text-sm font-semibold">Ward access <span className="font-normal text-muted-foreground">(optional)</span></legend><p className="mt-1 text-xs text-muted-foreground">Clearing every ward grants access to all wards.</p></div><div className="relative"><Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" onChange={(event) => setWardSearch(event.target.value)} placeholder="Search wards..." value={wardSearch} /></div><div className="max-h-52 overflow-y-auto rounded-xl border border-border">{wardsQuery.isPending ? <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground"><LoaderCircle className="animate-spin" /> Loading wards…</div> : wards.map((ward) => { const selected = selectedWardIds.includes(ward.id); return <label className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5 last:border-0 hover:bg-muted/40" key={ward.id}><Checkbox checked={selected} onCheckedChange={(checked) => toggleWard(ward.id, checked === true)} /><span className="flex-1 text-sm"><span className="font-medium">{ward.name}</span><span className="ml-2 text-muted-foreground">{ward.lga}</span></span></label> })}</div>{wardsQuery.hasNextPage && <Button disabled={wardsQuery.isFetchingNextPage} onClick={() => void wardsQuery.fetchNextPage()} type="button" variant="outline">{wardsQuery.isFetchingNextPage ? 'Loading…' : 'Load more wards'}</Button>}{selectedWardIds.length === 0 && <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">All-ward access will be enabled for this worker.</div>}</fieldset>
    </div><div className="flex gap-3 px-6 pb-6"><Button className={`${btnSecondary} flex-1`} disabled={mutation.isPending} onClick={() => changeOpen(false)} type="button" variant="outline">Cancel</Button><Button className={`${btnPrimary} flex-1`} disabled={mutation.isPending} type="submit">{mutation.isPending ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> Saving…</> : 'Save Changes'}</Button></div></form>
  </Dialog.Content></Dialog.Portal></Dialog.Root>
}
