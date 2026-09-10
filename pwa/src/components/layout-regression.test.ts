import { describe, expect, it } from 'vitest'

import appLayoutSource from './app-layout.tsx?raw'
import updatePromptSource from './update-prompt.tsx?raw'
import enrollmentFormStepsSource from '../features/enrollment/components/enrollment-form-steps.tsx?raw'
import householdEnrollmentViewSource from '../features/household-enrollment/components/household-enrollment-view.tsx?raw'

describe('mobile app layout', () => {
  it('reserves space for the application chrome instead of overlaying page content', () => {
    expect(appLayoutSource).toContain('shrink-0 items-center justify-between')
    expect(appLayoutSource).toContain('isEnrollmentRoute')
    expect(appLayoutSource).toContain('!isEnrollmentRoute ? (')
    expect(appLayoutSource).toContain('shrink-0 items-end')
    expect(appLayoutSource).not.toContain('fixed inset-x-0 bottom-0')
    expect(appLayoutSource).not.toContain('overflow-y-auto pb-24')
  })

  it('keeps enrollment actions outside the scrollable fields area', () => {
    expect(appLayoutSource).toContain('isEnrollmentRoute ? <div className="h-full min-h-0"><Outlet /></div>')
    expect(householdEnrollmentViewSource).toContain('flex h-full min-h-0 flex-col overflow-hidden')
    expect(householdEnrollmentViewSource).toContain('min-h-0 flex-1 space-y-4 overflow-y-auto')
    expect(householdEnrollmentViewSource).toContain('Save household on this device')
    expect(householdEnrollmentViewSource).toContain('<footer className="relative z-10 shrink-0 space-y-3 border-t')
    expect(householdEnrollmentViewSource).toContain("draft.phase === 'review'")
  })

  it('constrains enrollment fields and native date inputs to the mobile frame', () => {
    expect(enrollmentFormStepsSource).toContain('type="date" className="field"')
  })

  it('renders the update notice in flow', () => {
    expect(updatePromptSource).toContain('relative mx-4 my-2 shrink-0')
    expect(updatePromptSource).not.toContain('fixed inset-x-4 bottom-24')
  })
})
