import type { AuthUserApi, FieldWorkerUser } from '../types'

export class FieldWorkerAccessError extends Error {
  constructor(message = 'A field-worker account is required to use this app.') {
    super(message)
    this.name = 'FieldWorkerAccessError'
  }
}

export function mapFieldWorkerUser(user: AuthUserApi): FieldWorkerUser {
  if (user.role !== 'field_worker') throw new FieldWorkerAccessError()
  if (user.status !== 'active') throw new FieldWorkerAccessError('This field-worker account is inactive. Contact an administrator.')
  return { ...user, role: 'field_worker', status: 'active', phone: user.phone ?? null, lastSyncedAt: user.lastSyncedAt ?? null }
}

export function getTokenExpiresAt(token: string): number | null {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padding = '='.repeat((4 - normalized.length % 4) % 4)
    const payload = JSON.parse(atob(normalized + padding)) as { exp?: unknown }
    return typeof payload.exp === 'number' && Number.isFinite(payload.exp) ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

export function isFieldWorkerUser(value: unknown): value is FieldWorkerUser {
  if (typeof value !== 'object' || value === null) return false
  const user = value as Partial<FieldWorkerUser>
  return typeof user.id === 'string' && typeof user.name === 'string' && typeof user.email === 'string' && user.role === 'field_worker' && user.status === 'active' && Array.isArray(user.assignedWards)
}
