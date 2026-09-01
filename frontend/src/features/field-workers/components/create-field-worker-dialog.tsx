import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LoaderCircle, Search, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { getApiErrorMessage } from '@/api'
import { btnPrimary, btnSecondary } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useWardOptions } from '@/features/wards/hooks'

import { useCreateFieldWorker } from '../hooks'
import { generatePassword } from '../utils'
import type { CredentialResult } from './credential-result-dialog'

const schema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters.').max(120),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z.string().trim().min(7, 'Enter at least 7 characters.').max(32),
  status: z.enum(['active', 'inactive']),
  passwordMode: z.enum(['generated', 'manual']),
  password: z.string().max(128),
  confirmPassword: z.string().max(128),
  assignedWardIds: z.array(z.string()),
}).superRefine((values, context) => {
  if (values.passwordMode !== 'manual') return
  if (values.password.length < 8) context.addIssue({ code: 'custom', path: ['password'], message: 'Use at least 8 characters.' })
  if (values.password !== values.confirmPassword) context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match.' })
})

type Values = z.infer<typeof schema>

interface CreateFieldWorkerDialogProps {
  open: boolean
  onCreated: (credentials: CredentialResult) => void
  onOpenChange: (open: boolean) => void
}

const defaultValues: Values = {
  name: '', email: '', phone: '', status: 'active', passwordMode: 'generated',
  password: '', confirmPassword: '', assignedWardIds: [],
}

export function CreateFieldWorkerDialog({ open, onCreated, onOpenChange }: CreateFieldWorkerDialogProps) {
  const [wardSearch, setWardSearch] = useState('')
  const [debouncedWardSearch, setDebouncedWardSearch] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const mutation = useCreateFieldWorker()
  const wardsQuery = useWardOptions(debouncedWardSearch)
  const { control, register, handleSubmit, setValue, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues })
  const passwordMode = useWatch({ control, name: 'passwordMode' })
  const selectedWardIds = useWatch({ control, name: 'assignedWardIds' })
  const wards = useMemo(() => wardsQuery.data?.pages.flatMap((page) => page.items) ?? [], [wardsQuery.data])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedWardSearch(wardSearch.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [wardSearch])

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen && mutation.isPending) return
    onOpenChange(nextOpen)
  }

  function toggleWard(id: string, checked: boolean) {
    const next = checked
      ? [...new Set([...selectedWardIds, id])]
      : selectedWardIds.filter((wardId) => wardId !== id)
    setValue('assignedWardIds', next, { shouldDirty: true })
  }

  function submit(values: Values) {
    const password = values.passwordMode === 'generated' ? generatePassword() : values.password
    mutation.mutate({
      name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim(),
      password, role: 'field_worker', assignedWardIds: values.assignedWardIds, status: values.status,
    }, {
      onSuccess: (worker) => {
        onOpenChange(false)
        onCreated({ name: worker.name, email: worker.email, password })
      },
    })
  }

  return (
    <Dialog.Root onOpenChange={changeOpen} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-card shadow-2xl outline-none" onEscapeKeyDown={(event) => mutation.isPending && event.preventDefault()} onInteractOutside={(event) => mutation.isPending && event.preventDefault()}>
          <div className="flex items-start justify-between border-b border-border px-6 py-5"><div><Dialog.Title className="text-lg font-semibold">Add Field Worker</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Create an account and choose its ward access.</Dialog.Description></div><Button aria-label="Close create field worker dialog" disabled={mutation.isPending} onClick={() => changeOpen(false)} size="icon" variant="ghost"><X aria-hidden="true" /></Button></div>
          <form onSubmit={handleSubmit(submit)}>
            <div className="grid gap-5 px-6 py-5">
              {mutation.isError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{getApiErrorMessage(mutation.error, 'Unable to create the field worker.')}</div>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-semibold" htmlFor="create-worker-name">Full Name</label><Input {...register('name', { onChange: () => mutation.reset() })} aria-invalid={Boolean(errors.name)} autoFocus id="create-worker-name" placeholder="e.g. Amina Yusuf" />{errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}</div>
                <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="create-worker-phone">Phone Number</label><Input {...register('phone', { onChange: () => mutation.reset() })} aria-invalid={Boolean(errors.phone)} id="create-worker-phone" placeholder="e.g. +234 803 456 7890" />{errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}</div>
                <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="create-worker-email">Email</label><Input {...register('email', { onChange: () => mutation.reset() })} aria-invalid={Boolean(errors.email)} id="create-worker-email" placeholder="amina.yusuf@cbhi.ng" type="email" />{errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}</div>
              </div>

              <fieldset className="space-y-3"><legend className="text-sm font-semibold">Initial password</legend><div className="grid gap-2 sm:grid-cols-2"><label className="flex cursor-pointer gap-3 rounded-xl border border-border p-3"><input {...register('passwordMode')} type="radio" value="generated" /><span><span className="block text-sm font-semibold">Generate automatically</span><span className="text-xs text-muted-foreground">A secure password will be shown once.</span></span></label><label className="flex cursor-pointer gap-3 rounded-xl border border-border p-3"><input {...register('passwordMode')} type="radio" value="manual" /><span><span className="block text-sm font-semibold">Enter manually</span><span className="text-xs text-muted-foreground">Use a password you can share securely.</span></span></label></div>{passwordMode === 'manual' && <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-semibold" htmlFor="create-worker-password">Password</label><div className="relative"><Input {...register('password')} aria-invalid={Boolean(errors.password)} id="create-worker-password" maxLength={128} type={showPassword ? 'text' : 'password'} /><button aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword((current) => !current)} type="button">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>{errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}</div><div><label className="mb-1.5 block text-sm font-semibold" htmlFor="create-worker-confirm">Confirm password</label><Input {...register('confirmPassword')} aria-invalid={Boolean(errors.confirmPassword)} id="create-worker-confirm" maxLength={128} type={showPassword ? 'text' : 'password'} />{errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}</div></div>}</fieldset>

              <fieldset className="space-y-3"><div><legend className="text-sm font-semibold">Ward access <span className="font-normal text-muted-foreground">(optional)</span></legend><p className="mt-1 text-xs text-muted-foreground">If no ward is selected, this worker can access all wards.</p></div><div className="relative"><Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" onChange={(event) => setWardSearch(event.target.value)} placeholder="Search wards..." value={wardSearch} /></div><div className="max-h-48 overflow-y-auto rounded-xl border border-border">{wardsQuery.isPending ? <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground"><LoaderCircle className="animate-spin" /> Loading wards…</div> : wards.map((ward) => { const selected = selectedWardIds.includes(ward.id); return <label className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5 last:border-0 hover:bg-muted/40" key={ward.id}><Checkbox checked={selected} onCheckedChange={(checked) => toggleWard(ward.id, checked === true)} /><span className="flex-1 text-sm"><span className="font-medium">{ward.name}</span><span className="ml-2 text-muted-foreground">{ward.lga}</span></span></label> })}{!wardsQuery.isPending && wards.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No wards found.</p>}</div>{wardsQuery.hasNextPage && <Button disabled={wardsQuery.isFetchingNextPage} onClick={() => void wardsQuery.fetchNextPage()} type="button" variant="outline">{wardsQuery.isFetchingNextPage ? 'Loading…' : 'Load more wards'}</Button>}{selectedWardIds.length === 0 && <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">No wards selected: this account will have access to all wards.</div>}</fieldset>

              <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="create-worker-status">Account status</label><select {...register('status')} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" id="create-worker-status"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
            </div>
            <div className="flex gap-3 px-6 pb-6"><Button className={`${btnSecondary} flex-1`} disabled={mutation.isPending} onClick={() => changeOpen(false)} type="button" variant="outline">Cancel</Button><Button className={`${btnPrimary} flex-1`} disabled={mutation.isPending} type="submit">{mutation.isPending ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> Creating…</> : 'Create Field Worker'}</Button></div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
