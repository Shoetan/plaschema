import { beforeEach, describe, expect, it } from 'vitest'

import { PWA_SESSION_STORAGE_KEY, useAuthStore } from './auth.store'
import type { FieldWorkerUser } from '../types'

const user: FieldWorkerUser = {
  id: '01900000-0000-7000-8000-000000000001',
  name: 'Amina Yusuf',
  email: 'amina@example.com',
  role: 'field_worker',
  status: 'active',
  phone: null,
  lastSyncedAt: null,
  assignedWards: [],
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
}

describe('PWA auth store', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ accessToken: null, expiresAt: null, user: null, status: 'unauthenticated', validation: null, notice: null })
  })

  it('persists a valid field-worker session', () => {
    useAuthStore.getState().setSession({ accessToken: 'token', expiresAt: Date.now() + 60_000, user })
    expect(useAuthStore.getState().status).toBe('authenticated')
    expect(localStorage.getItem(PWA_SESSION_STORAGE_KEY)).toContain('amina@example.com')
  })

  it('allows an unexpired saved session to continue offline', () => {
    useAuthStore.setState({ accessToken: 'token', expiresAt: Date.now() + 60_000, user, status: 'restoring' })
    useAuthStore.getState().continueOffline()
    expect(useAuthStore.getState().validation).toBe('offline')
    expect(useAuthStore.getState().status).toBe('authenticated')
  })

  it('clears an expired session instead of continuing offline', () => {
    useAuthStore.setState({ accessToken: 'token', expiresAt: Date.now() - 1, user, status: 'restoring' })
    useAuthStore.getState().continueOffline()
    expect(useAuthStore.getState().status).toBe('unauthenticated')
    expect(useAuthStore.getState().notice).toBe('expired')
  })
})
