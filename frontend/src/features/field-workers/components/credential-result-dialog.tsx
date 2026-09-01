import { Check, Copy, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useState } from 'react'
import { toast } from 'sonner'

import { btnPrimary } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'

export interface CredentialResult {
  name: string
  email: string
  password: string
}

interface CredentialResultDialogProps {
  open: boolean
  result: CredentialResult | null
  title: string
  onOpenChange: (open: boolean) => void
}

export function CredentialResultDialog({
  open,
  result,
  title,
  onOpenChange,
}: CredentialResultDialogProps) {
  const [copied, setCopied] = useState(false)

  async function copyCredentials() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(
        `Email: ${result.email}\nPassword: ${result.password}`,
      )
      setCopied(true)
      toast.success('Credentials copied.')
    } catch {
      toast.error('Unable to copy automatically. Select and copy the credentials manually.')
    }
  }

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen) setCopied(false)
    onOpenChange(nextOpen)
  }

  return (
    <Dialog.Root onOpenChange={changeOpen} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card shadow-2xl outline-none">
          <div className="flex items-start justify-between border-b border-border px-6 py-5">
            <div>
              <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Copy these credentials now. The password will not be shown again.
              </Dialog.Description>
            </div>
            <Button aria-label="Close credentials" onClick={() => changeOpen(false)} size="icon" variant="ghost">
              <X aria-hidden="true" />
            </Button>
          </div>
          {result && (
            <div className="space-y-4 px-6 py-5">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground">Field worker</p>
                <p className="mt-1 font-semibold">{result.name}</p>
                <div className="mt-4 grid gap-3">
                  <div><p className="text-xs text-muted-foreground">Email</p><p className="break-all font-mono text-sm">{result.email}</p></div>
                  <div><p className="text-xs text-muted-foreground">Password</p><p className="break-all font-mono text-sm font-semibold">{result.password}</p></div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Share these credentials securely with the field worker. Closing this dialog clears the password from the screen.</p>
            </div>
          )}
          <div className="flex gap-3 px-6 pb-6">
            <Button className="flex-1" onClick={() => changeOpen(false)} variant="outline">Done</Button>
            <Button className={`${btnPrimary} flex-1`} onClick={() => void copyCredentials()}>
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy credentials'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
