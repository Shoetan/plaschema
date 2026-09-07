import { describe, expect, it } from 'vitest'

import appLayoutSource from './app-layout.tsx?raw'
import updatePromptSource from './update-prompt.tsx?raw'
import enrollmentViewSource from '../features/enrollment/components/enrollment-view.tsx?raw'

describe('mobile app layout', () => {
  it('reserves space for the application chrome instead of overlaying page content', () => {
    expect(appLayoutSource).toContain('shrink-0 items-center justify-between')
    expect(appLayoutSource).toContain("isEnrollmentRoute ? 'overflow-hidden' : 'overflow-y-auto'")
    expect(appLayoutSource).toContain('shrink-0 items-end')
    expect(appLayoutSource).not.toContain('fixed inset-x-0 bottom-0')
    expect(appLayoutSource).not.toContain('overflow-y-auto pb-24')
  })

  it('keeps enrollment actions outside the scrollable fields area', () => {
    expect(enrollmentViewSource).toContain('flex h-full min-h-0 flex-col overflow-hidden')
    expect(enrollmentViewSource).toContain('min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain')
    expect(enrollmentViewSource).toContain('fieldsScrollRef.current?.scrollTo')
    expect(enrollmentViewSource).toContain('<footer className="flex shrink-0')
    expect(enrollmentViewSource).not.toContain('sticky bottom-[69px]')
    expect(enrollmentViewSource).not.toContain('pb-28')
  })

  it('renders the update notice in flow', () => {
    expect(updatePromptSource).toContain('relative mx-4 my-2 shrink-0')
    expect(updatePromptSource).not.toContain('fixed inset-x-4 bottom-24')
  })
})
