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
import { Input } from '@/components/ui/input'
import { useWardOptions } from '@/features/wards/hooks'
import type { WardListItem } from '@/features/wards/types'

import { useUpdateHealthFacility } from '../hooks'
import type { HealthFacilityLevel, HealthFacilityRecord, HealthFacilityStatus, UpdateHealthFacilityPayload } from '../types'

interface EditFacilityDialogProps { open: boolean; facility: HealthFacilityRecord; onOpenChange: (open: boolean) => void }
interface Values { name: string; wardId: string; type: string; level: HealthFacilityLevel; status: HealthFacilityStatus }
const schema = z.object({ name: z.string().trim().min(2).max(160), wardId: z.string().min(1, 'Select a ward.'), type: z.string().trim().min(1).max(120), level: z.enum(['primary', 'secondary', 'tertiary']), status: z.enum(['active', 'inactive']) })

export function EditFacilityDialog({ open, facility, onOpenChange }: EditFacilityDialogProps) {
  const [wardSearch, setWardSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const wardsQuery = useWardOptions(debouncedSearch)
  const mutation = useUpdateHealthFacility()
  const { control, register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: facility.name, wardId: facility.wardId, type: facility.type, level: facility.level, status: facility.status } })

  useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(wardSearch.trim()), 300); return () => window.clearTimeout(timer) }, [wardSearch])
  const selectedWardId = useWatch({ control, name: 'wardId' })
  const wards = useMemo(() => {
    const byId = new Map<string, WardListItem>([[facility.ward.id, { ...facility.ward, state: 'Plateau', fieldWorkers: 0, beneficiaries: 0, newEnrollments: 0, status: 'active' }]])
    for (const ward of wardsQuery.data?.pages.flatMap((page) => page.items) ?? []) byId.set(ward.id, ward)
    return [...byId.values()]
  }, [facility.ward, wardsQuery.data])
  const selectedWard = wards.find((ward) => ward.id === selectedWardId)

  function changeOpen(nextOpen: boolean) { if (!nextOpen && mutation.isPending) return; onOpenChange(nextOpen) }
  function submit(values: Values) {
    const payload: UpdateHealthFacilityPayload = {}
    if (values.name !== facility.name) payload.name = values.name
    if (values.wardId !== facility.wardId) payload.wardId = values.wardId
    if (values.type !== facility.type) payload.type = values.type
    if (values.level !== facility.level) payload.level = values.level
    if (values.status !== facility.status) payload.status = values.status
    if (Object.keys(payload).length === 0) { toast.info('No facility changes to save.'); onOpenChange(false); return }
    mutation.mutate({ id: facility.id, payload }, { onSuccess: () => onOpenChange(false) })
  }

  return <Dialog.Root onOpenChange={changeOpen} open={open}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/20" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-card shadow-2xl outline-none" onEscapeKeyDown={(event) => mutation.isPending && event.preventDefault()} onInteractOutside={(event) => mutation.isPending && event.preventDefault()}>
    <div className="flex items-start justify-between border-b border-border px-6 py-5"><div><Dialog.Title className="text-lg font-semibold">Edit Facility</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Update supported facility information.</Dialog.Description></div><Button aria-label="Close edit facility dialog" disabled={mutation.isPending} onClick={() => changeOpen(false)} size="icon" variant="ghost"><X aria-hidden="true" /></Button></div>
    <form onSubmit={handleSubmit(submit)}><div className="flex flex-col gap-4 px-6 py-5">
      {mutation.isError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{getApiErrorMessage(mutation.error, 'Unable to update the facility.')}</div>}
      <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold" htmlFor="edit-facility-name">Facility Name</label><Input {...register('name', { onChange: () => mutation.reset() })} aria-invalid={Boolean(errors.name)} autoFocus id="edit-facility-name" />{errors.name && <p className="text-xs text-destructive">Enter a name between 2 and 160 characters.</p>}</div>
      <div className="flex flex-col gap-2"><label className="text-sm font-semibold" htmlFor="edit-facility-ward-search">Ward</label><div className="relative"><Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" id="edit-facility-ward-search" onChange={(event) => setWardSearch(event.target.value)} placeholder="Search wards..." value={wardSearch} /></div><select {...register('wardId', { onChange: () => mutation.reset() })} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">{wards.map((ward) => <option key={ward.id} value={ward.id}>{ward.name} — {ward.lga}</option>)}</select>{wardsQuery.hasNextPage && <Button disabled={wardsQuery.isFetchingNextPage} onClick={() => void wardsQuery.fetchNextPage()} type="button" variant="outline">{wardsQuery.isFetchingNextPage ? 'Loading…' : 'Load more wards'}</Button>}</div>
      <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-facility-state">State</label><Input id="edit-facility-state" readOnly value="Plateau" /></div><div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-facility-lga">LGA</label><Input id="edit-facility-lga" readOnly value={selectedWard?.lga ?? facility.lga} /></div></div>
      <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-facility-type">Facility Type</label><Input {...register('type', { onChange: () => mutation.reset() })} id="edit-facility-type" />{errors.type && <p className="text-xs text-destructive">Enter a facility type up to 120 characters.</p>}</div>
      <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-facility-level">Level</label><select {...register('level')} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" id="edit-facility-level"><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="tertiary">Tertiary</option></select></div><div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-facility-status">Status</label><select {...register('status')} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" id="edit-facility-status"><option value="active">Active</option><option value="inactive">Inactive</option></select></div></div>
    </div><div className="flex gap-3 px-6 pb-6"><Button className={`${btnSecondary} flex-1`} disabled={mutation.isPending} onClick={() => changeOpen(false)} type="button" variant="outline">Cancel</Button><Button className={`${btnPrimary} flex-1`} disabled={mutation.isPending} type="submit">{mutation.isPending ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> Saving…</> : 'Save Changes'}</Button></div></form>
  </Dialog.Content></Dialog.Portal></Dialog.Root>
}
