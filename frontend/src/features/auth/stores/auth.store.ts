import { create } from 'zustand'

import type {
  AdminLoginResult,
  AdminUser,
  AuthStatus,
  SessionNotice,
} from '../types/auth.types'

const SESSION_STORAGE_KEY = 'plaschema-admin-session'

interface StoredSession {
  accessToken: string
  user: AdminUser
}

interface RestoredSession extends StoredSession {
  remember: boolean
}

interface AuthState {
  accessToken: string | null
  status: AuthStatus
  user: AdminUser | null
  remember: boolean
  notice: SessionNotice
  setSession: (session: AdminLoginResult, remember: boolean) => void
  completeRestore: (user: AdminUser) => void
  clearSession: (reason?: 'logout' | 'expired') => void
  consumeNotice: () => void
  logout: () => void
}

function isAdminUser(value: unknown): value is AdminUser {
  if (typeof value !== 'object' || value === null) return false

  const user = value as Partial<AdminUser>
  return (
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    user.role === 'admin'
  )
}

function parseStoredSession(value: string | null): StoredSession | null {
  if (!value) return null

  try {
    const session = JSON.parse(value) as Partial<StoredSession>
    if (
      typeof session.accessToken === 'string' &&
      isAdminUser(session.user)
    ) {
      return { accessToken: session.accessToken, user: session.user }
    }
  } catch {
    return null
  }

  return null
}

function removeStoredSessions() {
  localStorage.removeItem(SESSION_STORAGE_KEY)
  sessionStorage.removeItem(SESSION_STORAGE_KEY)
}

function readStoredSession(): RestoredSession | null {
  const remembered = parseStoredSession(
    localStorage.getItem(SESSION_STORAGE_KEY),
  )
  if (remembered) return { ...remembered, remember: true }

  const tabSession = parseStoredSession(
    sessionStorage.getItem(SESSION_STORAGE_KEY),
  )
  if (tabSession) return { ...tabSession, remember: false }

  removeStoredSessions()
  return null
}

function writeStoredSession(session: StoredSession, remember: boolean) {
  removeStoredSessions()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

const restoredSession = readStoredSession()

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: restoredSession?.accessToken ?? null,
  status: restoredSession ? 'restoring' : 'unauthenticated',
  user: restoredSession?.user ?? null,
  remember: restoredSession?.remember ?? false,
  notice: null,
  setSession: (session, remember) => {
    writeStoredSession(
      { accessToken: session.accessToken, user: session.user },
      remember,
    )
    set({
      accessToken: session.accessToken,
      status: 'authenticated',
      user: session.user,
      remember,
      notice: null,
    })
  },
  completeRestore: (user) => {
    const { accessToken, remember } = get()
    if (!accessToken) return

    writeStoredSession({ accessToken, user }, remember)
    set({ status: 'authenticated', user })
  },
  clearSession: (reason = 'logout') => {
    removeStoredSessions()
    set({
      accessToken: null,
      status: 'unauthenticated',
      user: null,
      remember: false,
      notice: reason === 'expired' ? 'expired' : null,
    })
  },
  consumeNotice: () => set({ notice: null }),
  logout: () => get().clearSession('logout'),
}))
