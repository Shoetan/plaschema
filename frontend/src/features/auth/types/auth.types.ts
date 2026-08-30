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
  phone: string | null
  createdAt: string
  updatedAt: string
  assignedWards: AssignedWardApi[]
}

export interface AdminWard {
  id: string
  name: string
  lga: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin'
  status: 'active' | 'inactive'
  phone: string | null
  createdAt: string
  updatedAt: string
  assignedWards: AdminWard[]
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

export interface AdminLoginResult {
  accessToken: string
  tokenType: string
  expiresIn: string
  user: AdminUser
}

export type AuthStatus =
  | 'restoring'
  | 'authenticated'
  | 'unauthenticated'

export type SessionNotice = 'expired' | null
