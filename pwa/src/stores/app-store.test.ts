import { beforeEach, describe, expect, it } from 'vitest'

import { initialBeneficiaries } from '@/data/mock-data'
import { useAppStore } from '@/stores/app-store'

describe('app store', () => {
  beforeEach(() => {
    useAppStore.setState({ user: null, beneficiaries: initialBeneficiaries, lastSyncAt: null })
  })

  it('signs in with the entered demo email', () => {
    useAppStore.getState().signIn('field@example.com')
    expect(useAppStore.getState().user?.email).toBe('field@example.com')
  })

  it('adds an enrollment to the mock beneficiary list', () => {
    const first = initialBeneficiaries[0]
    useAppStore.getState().addEnrollment({ ...first, id: 'new-record', syncStatus: 'Pending' })
    expect(useAppStore.getState().beneficiaries[0].id).toBe('new-record')
    expect(useAppStore.getState().beneficiaries[0].beneficiaryCode).toMatch(/^LOCAL-/)
  })
})
