import { Ellipsis, Power, PowerOff } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'

import { Button } from '@/components/ui/button'

import type { EnrollmentListItem, EnrollmentStatusTarget } from '../types'
import { availableEnrollmentStatusTargets } from '../utils'

interface EnrollmentRowActionsProps {
  enrollment: EnrollmentListItem
  onAction: (target: EnrollmentStatusTarget) => void
}

export function EnrollmentRowActions({ enrollment, onAction }: EnrollmentRowActionsProps) {
  const targets = availableEnrollmentStatusTargets(enrollment.status)
  if (targets.length === 0) return <span className="text-xs text-muted-foreground">Unavailable</span>

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild><Button aria-label={`Actions for ${enrollment.beneficiaryName}`} size="icon-sm" variant="ghost"><Ellipsis aria-hidden="true" /></Button></DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" className="z-50 min-w-40 rounded-lg border border-border bg-card p-1 shadow-xl" sideOffset={5}>
          {targets.map((target) => <DropdownMenu.Item className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none data-[highlighted]:bg-muted ${target === 'disabled' ? 'text-destructive' : ''}`} key={target} onSelect={() => onAction(target)}>{target === 'active' ? <Power aria-hidden="true" className="size-4" /> : <PowerOff aria-hidden="true" className="size-4" />}{target === 'active' ? 'Activate' : 'Deactivate'}</DropdownMenu.Item>)}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
