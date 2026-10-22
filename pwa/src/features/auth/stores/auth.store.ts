import { create } from 'zustand'

import { setApiBearerToken } from '@/api/auth-header'

import type { AuthStatus, FieldWorkerLoginResult, FieldWorkerUser, SessionNotice, SessionValidation } from '../types'
import { isFieldWorkerUser, normalizeFieldWorkerUser } from '../utils'

export const PWA_SESSION_STORAGE_KEY = 'plaschema-field-worker-session'

interface StoredSession {
  accessToken: string
  expiresAt: number
  user: FieldWorkerUser
}

interface AuthState {
  accessToken: string | null
  expiresAt: number | null
  user: FieldWorkerUser | null
  status: AuthStatus
  validation: SessionValidation
  notice: SessionNotice
  setSession: (result: FieldWorkerLoginResult) => void
  updateUser: (user: FieldWorkerUser) => void
  completeRestore: (user: FieldWorkerUser, validation?: Exclude<SessionValidation, null>) => void
  continueOffline: () => void
  hydrateFromStorage: () => void
  clearSession: (reason?: 'logout' | 'expired') => void
  consumeNotice: () => void
  logout: () => void
}

function parseSession(value: string | null): StoredSession | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as Partial<StoredSession>
    if (
      typeof parsed.accessToken === 'string' &&
      typeof parsed.expiresAt === 'number' &&
      parsed.expiresAt > Date.now() &&
      isFieldWorkerUser(parsed.user)
    ) {
      return {
        ...parsed,
        user: normalizeFieldWorkerUser(parsed.user as FieldWorkerUser),
      } as StoredSession
    }
  } catch {
    return null
  }
  return null
}

function readInitialSession() {
  const raw = localStorage.getItem(PWA_SESSION_STORAGE_KEY)
  const session = parseSession(raw)
  if (!session) localStorage.removeItem(PWA_SESSION_STORAGE_KEY)
  return { session, expired: Boolean(raw) && !session }
}

function writeSession(session: StoredSession) {
  localStorage.setItem(PWA_SESSION_STORAGE_KEY, JSON.stringify(session))
}

const initial = readInitialSession()
if (initial.session?.accessToken) setApiBearerToken(initial.session.accessToken)

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: initial.session?.accessToken ?? null,
  expiresAt: initial.session?.expiresAt ?? null,
  user: initial.session?.user ?? null,
  status: initial.session ? 'restoring' : 'unauthenticated',
  validation: null,
  notice: initial.expired ? 'expired' : null,
  setSession: (result) => {
    setApiBearerToken(result.accessToken)
    const session = { ...result, user: normalizeFieldWorkerUser(result.user) }
    writeSession(session)
    set({ ...session, status: 'authenticated', validation: 'verified', notice: null })
  },
  updateUser: (user) => {
    const normalized = normalizeFieldWorkerUser(user)
    const { accessToken, expiresAt } = get()
    if (!accessToken || !expiresAt) return
    writeSession({ accessToken, expiresAt, user: normalized })
    set({ user: normalized })
  },
  completeRestore: (user, validation = 'verified') => {
    const { accessToken, expiresAt } = get()
    if (!accessToken || !expiresAt || expiresAt <= Date.now()) return
    const normalized = normalizeFieldWorkerUser(user)
    writeSession({ accessToken, expiresAt, user: normalized })
    set({ user: normalized, status: 'authenticated', validation, notice: null })
  },
  continueOffline: () => {
    const { accessToken, expiresAt, user } = get()
    if (user?.isPasswordChangeRequired) return
    if (!accessToken || !expiresAt || expiresAt <= Date.now() || !user) {
      get().clearSession('expired')
      return
    }
    set({ status: 'authenticated', validation: 'offline' })
  },
  hydrateFromStorage: () => {
    const session = parseSession(localStorage.getItem(PWA_SESSION_STORAGE_KEY))
    if (!session) {
      get().clearSession('logout')
      return
    }
    setApiBearerToken(session.accessToken)
    set({ ...session, status: 'restoring', validation: null, notice: null })
  },
  clearSession: (reason = 'logout') => {
    setApiBearerToken(null)
    localStorage.removeItem(PWA_SESSION_STORAGE_KEY)
    set({
      accessToken: null,
      expiresAt: null,
      user: null,
      status: 'unauthenticated',
      validation: null,
      notice: reason === 'expired' ? 'expired' : null,
    })
  },
  consumeNotice: () => set({ notice: null }),
  logout: () => get().clearSession('logout'),
}))
