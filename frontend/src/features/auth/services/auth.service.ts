import { _get, _post, type ApiResponse } from '@/api'

import type {
  AdminLoginResult,
  AuthUserApi,
  LoginPayload,
  LoginResponseApi,
} from '../types/auth.types'
import { mapAdminUser } from '../utils/map-auth-user'

/** POST /auth/login */
export async function loginAdmin(
  payload: LoginPayload,
): Promise<AdminLoginResult> {
  const response = await _post<ApiResponse<LoginResponseApi>, LoginPayload>(
    '/auth/login',
    payload,
  )
  const result = response.data.data

  return {
    accessToken: result.accessToken,
    tokenType: result.tokenType,
    expiresIn: result.expiresIn,
    user: mapAdminUser(result.user),
  }
}

/** GET /auth/me */
export async function fetchCurrentAdmin() {
  const response = await _get<ApiResponse<AuthUserApi>>('/auth/me')
  return mapAdminUser(response.data.data)
}
