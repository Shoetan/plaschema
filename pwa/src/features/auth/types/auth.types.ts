export interface AssignedWardApi {
  id: string
  name: string
  lga: string
}

export interface AuthUserApi {
  id: string
  name: string
  email: string
  role: 'admin' | 'field_worker'
  status: 'active' | 'inactive'
  phone?: string | null
  lastSyncedAt?: string | null
  assignedWards: AssignedWardApi[]
  createdAt: string
  updatedAt: string
}

export interface FieldWorkerUser extends Omit<AuthUserApi, 'role' | 'status' | 'phone' | 'lastSyncedAt'> {
  role: 'field_worker'
  status: 'active'
  phone: string | null
  lastSyncedAt: string | null
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponseApi {
  accessToken: string
  tokenType: string
  expiresIn: string
  user: AuthUserApi
}

export interface FieldWorkerLoginResult {
  accessToken: string
  expiresAt: number
  user: FieldWorkerUser
}

export type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated'
export type SessionValidation = 'verified' | 'offline' | null
export type SessionNotice = 'expired' | null
