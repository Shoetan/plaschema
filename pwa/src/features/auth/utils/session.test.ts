import { describe, expect, it } from 'vitest'

import type { AuthUserApi } from '../types'
import { FieldWorkerAccessError, getTokenExpiresAt, mapFieldWorkerUser } from './session'

function tokenWithExpiry(exp: number) {
  const payload = btoa(JSON.stringify({ exp })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `header.${payload}.signature`
}

const baseUser: AuthUserApi = {
  id: '01900000-0000-7000-8000-000000000001',
  name: 'Test User',
  email: 'test@example.com',
  role: 'field_worker',
  status: 'active',
  assignedWards: [],
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
}

describe('auth session utilities', () => {
  it('reads the JWT expiry timestamp', () => {
    expect(getTokenExpiresAt(tokenWithExpiry(2_000_000_000))).toBe(2_000_000_000_000)
  })

  it('rejects an administrator account', () => {
    expect(() => mapFieldWorkerUser({ ...baseUser, role: 'admin' })).toThrow(FieldWorkerAccessError)
  })

  it('normalizes optional profile fields', () => {
    expect(mapFieldWorkerUser(baseUser)).toMatchObject({ phone: null, lastSyncedAt: null })
  })
})
