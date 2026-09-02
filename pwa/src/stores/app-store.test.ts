import { beforeEach, describe, expect, it } from 'vitest'

import { initialBeneficiaries } from '@/data/mock-data'
import { useAppStore } from '@/stores/app-store'

describe('app store', () => {
  beforeEach(() => {
    useAppStore.setState({ beneficiaries: initialBeneficiaries, lastSyncAt: null })
  })

  it('adds an enrollment to the mock beneficiary list', () => {
    const first = initialBeneficiaries[0]
    useAppStore.getState().addEnrollment({ ...first, id: 'new-record', syncStatus: 'Pending' })
    expect(useAppStore.getState().beneficiaries[0].id).toBe('new-record')
    expect(useAppStore.getState().beneficiaries[0].beneficiaryCode).toMatch(/^LOCAL-/)
  })
})
