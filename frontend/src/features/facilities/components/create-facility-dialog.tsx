import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, Search, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useEffect, useMemo, useState } from 'react'
import { type FieldErrors, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { getApiErrorMessage } from '@/api'
import { btnPrimary, btnSecondary } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useWardOptions } from '@/features/wards/hooks'
import type { WardListItem } from '@/features/wards/types'

import { useCreateHealthFacility } from '../hooks'

interface CreateFacilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CreateFacilityFormValues {
  name: string
  wardId: string
}

const schema = z.object({
  name: z.string().trim().min(2, 'Facility name must be at least 2 characters.').max(160, 'Facility name must be 160 characters or fewer.'),
  wardId: z.string().min(1, 'Select a ward.'),
})

export function CreateFacilityDialog({ open, onOpenChange }: CreateFacilityDialogProps) {
  const [wardSearch, setWardSearch] = useState('')
  const [debouncedWardSearch, setDebouncedWardSearch] = useState('')
  const wardsQuery = useWardOptions(debouncedWardSearch)
  const mutation = useCreateHealthFacility()
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<CreateFacilityFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', wardId: '' },
  })

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedWardSearch(wardSearch.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [wardSearch])

  const selectedWardId = useWatch({ control, name: 'wardId' })
  const wards: WardListItem[] = useMemo(() => wardsQuery.data?.pages.flatMap((page) => page.items) ?? [], [wardsQuery.data])
  const selectedWard = wards.find((ward) => ward.id === selectedWardId)

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen && mutation.isPending) return
    if (!nextOpen) {
      reset()
      setWardSearch('')
      mutation.reset()
    }
    onOpenChange(nextOpen)
  }

  function submit(values: CreateFacilityFormValues) {
    const lga = selectedWard?.lga.trim()
    if (!lga || lga.length < 2 || lga.length > 120) {
      toast.error('Select a ward with a valid LGA.')
      return
    }

    mutation.mutate({
      name: values.name,
      wardId: values.wardId,
      lga,
    }, {
      onSuccess: () => {
        reset()
        setWardSearch('')
        onOpenChange(false)
      },
    })
  }

  function invalid(formErrors: FieldErrors<CreateFacilityFormValues>) {
    toast.error(formErrors.name?.message ?? formErrors.wardId?.message ?? 'Check the facility details and try again.')
  }

  return (
    <Dialog.Root onOpenChange={changeOpen} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-card shadow-2xl outline-none" onEscapeKeyDown={(event) => mutation.isPending && event.preventDefault()} onInteractOutside={(event) => mutation.isPending && event.preventDefault()}>
          <div className="flex items-start justify-between border-b border-border px-6 py-5">
            <div><Dialog.Title className="text-lg font-semibold">Add Facility</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Add a health facility to a registered ward.</Dialog.Description></div>
            <Button aria-label="Close add facility dialog" disabled={mutation.isPending} onClick={() => changeOpen(false)} size="icon" variant="ghost"><X aria-hidden="true" /></Button>
          </div>
          <form onSubmit={handleSubmit(submit, invalid)}>
            <div className="flex flex-col gap-4 px-6 py-5">
              {mutation.isError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{getApiErrorMessage(mutation.error, 'Unable to create the facility.')}</div>}
              <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold" htmlFor="facility-name">Facility Name</label><Input {...register('name', { onChange: () => mutation.reset() })} aria-invalid={Boolean(errors.name)} autoFocus id="facility-name" placeholder="e.g. Tudun Wada PHC" />{errors.name?.message && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" htmlFor="facility-ward-search">Ward</label>
                <div className="relative"><Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" id="facility-ward-search" onChange={(event) => setWardSearch(event.target.value)} placeholder="Search wards..." value={wardSearch} /></div>
                <select {...register('wardId', { onChange: () => mutation.reset() })} aria-invalid={Boolean(errors.wardId)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" disabled={wardsQuery.isPending}>
                  <option value="">{wardsQuery.isPending ? 'Loading wards…' : 'Select a ward'}</option>
                  {wards.map((ward) => <option key={ward.id} value={ward.id}>{ward.name} — {ward.lga}</option>)}
                </select>
                {errors.wardId?.message && <p className="text-xs text-destructive">{errors.wardId.message}</p>}
                {wardsQuery.hasNextPage && <Button disabled={wardsQuery.isFetchingNextPage} onClick={() => void wardsQuery.fetchNextPage()} type="button" variant="outline">{wardsQuery.isFetchingNextPage ? 'Loading…' : 'Load more wards'}</Button>}
                {wardsQuery.isError && <p className="text-sm text-destructive" role="alert">Unable to load wards. <button className="underline" onClick={() => void wardsQuery.refetch()} type="button">Retry</button></p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold" htmlFor="facility-state">State</label><Input id="facility-state" readOnly value="Plateau" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold" htmlFor="facility-lga">LGA</label><Input id="facility-lga" placeholder="Select a ward" readOnly value={selectedWard?.lga ?? ''} /></div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6"><Button className={`${btnSecondary} flex-1`} disabled={mutation.isPending} onClick={() => changeOpen(false)} type="button" variant="outline">Cancel</Button><Button className={`${btnPrimary} flex-1`} disabled={mutation.isPending || wardsQuery.isError} type="submit">{mutation.isPending ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> Creating…</> : 'Add Facility'}</Button></div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
