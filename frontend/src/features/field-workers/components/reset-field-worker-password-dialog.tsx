import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LoaderCircle, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { getApiErrorMessage } from '@/api'
import { btnPrimary, btnSecondary } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useResetFieldWorkerPassword } from '../hooks'
import { generatePassword } from '../utils'
import type { CredentialResult } from './credential-result-dialog'

const schema = z.object({ mode: z.enum(['generated', 'manual']), password: z.string().max(128), confirmPassword: z.string().max(128) }).superRefine((values, context) => {
  if (values.mode !== 'manual') return
  if (values.password.length < 8) context.addIssue({ code: 'custom', path: ['password'], message: 'Use at least 8 characters.' })
  if (values.password !== values.confirmPassword) context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match.' })
})
type Values = z.infer<typeof schema>

interface ResetFieldWorkerPasswordDialogProps {
  worker: { id: string; name: string; email: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  onReset: (credentials: CredentialResult) => void
}

export function ResetFieldWorkerPasswordDialog({ worker, open, onOpenChange, onReset }: ResetFieldWorkerPasswordDialogProps) {
  const [showPassword, setShowPassword] = useState(false)
  const mutation = useResetFieldWorkerPassword()
  const { control, register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { mode: 'generated', password: '', confirmPassword: '' } })
  const mode = useWatch({ control, name: 'mode' })

  function changeOpen(nextOpen: boolean) { if (!nextOpen && mutation.isPending) return; onOpenChange(nextOpen) }
  function submit(values: Values) {
    const password = values.mode === 'generated' ? generatePassword() : values.password
    mutation.mutate({ id: worker.id, password }, { onSuccess: () => { onOpenChange(false); onReset({ name: worker.name, email: worker.email, password }) } })
  }

  return <Dialog.Root onOpenChange={changeOpen} open={open}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/20" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card shadow-2xl outline-none" onEscapeKeyDown={(event) => mutation.isPending && event.preventDefault()} onInteractOutside={(event) => mutation.isPending && event.preventDefault()}>
    <div className="flex items-start justify-between border-b border-border px-6 py-5"><div><Dialog.Title className="text-lg font-semibold">Reset Password</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Set a replacement password for {worker.name}.</Dialog.Description></div><Button aria-label="Close reset password dialog" disabled={mutation.isPending} onClick={() => changeOpen(false)} size="icon" variant="ghost"><X aria-hidden="true" /></Button></div>
    <form onSubmit={handleSubmit(submit)}><div className="space-y-5 px-6 py-5">{mutation.isError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{getApiErrorMessage(mutation.error, 'Unable to reset the password.')}</div>}<fieldset className="space-y-3"><legend className="text-sm font-semibold">Replacement password</legend><label className="flex cursor-pointer gap-3 rounded-xl border border-border p-3"><input {...register('mode')} type="radio" value="generated" /><span><span className="block text-sm font-semibold">Generate automatically</span><span className="text-xs text-muted-foreground">A secure password will be shown once.</span></span></label><label className="flex cursor-pointer gap-3 rounded-xl border border-border p-3"><input {...register('mode')} type="radio" value="manual" /><span><span className="block text-sm font-semibold">Enter manually</span><span className="text-xs text-muted-foreground">Use at least 8 characters.</span></span></label></fieldset>{mode === 'manual' && <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-semibold" htmlFor="reset-worker-password">Password</label><div className="relative"><Input {...register('password')} aria-invalid={Boolean(errors.password)} id="reset-worker-password" maxLength={128} type={showPassword ? 'text' : 'password'} /><button aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword((current) => !current)} type="button">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>{errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}</div><div><label className="mb-1.5 block text-sm font-semibold" htmlFor="reset-worker-confirm">Confirm password</label><Input {...register('confirmPassword')} aria-invalid={Boolean(errors.confirmPassword)} id="reset-worker-confirm" maxLength={128} type={showPassword ? 'text' : 'password'} />{errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}</div></div>}<p className="text-xs text-muted-foreground">Existing password access is replaced immediately. Share the new credentials securely.</p></div><div className="flex gap-3 px-6 pb-6"><Button className={`${btnSecondary} flex-1`} disabled={mutation.isPending} onClick={() => changeOpen(false)} type="button" variant="outline">Cancel</Button><Button className={`${btnPrimary} flex-1`} disabled={mutation.isPending} type="submit">{mutation.isPending ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> Resetting…</> : 'Reset Password'}</Button></div></form>
  </Dialog.Content></Dialog.Portal></Dialog.Root>
}
