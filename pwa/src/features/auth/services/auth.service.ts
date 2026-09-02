import { _get, _post, type ApiResponse } from '@/api'

import type { AuthUserApi, FieldWorkerLoginResult, LoginPayload, LoginResponseApi } from '../types'
import { getTokenExpiresAt, mapFieldWorkerUser } from '../utils'

export async function loginFieldWorker(payload: LoginPayload): Promise<FieldWorkerLoginResult> {
  const response = await _post<ApiResponse<LoginResponseApi>, LoginPayload>('/auth/login', payload)
  const result = response.data.data
  const expiresAt = getTokenExpiresAt(result.accessToken)
  if (!expiresAt || expiresAt <= Date.now()) throw new Error('The server returned an invalid session. Please try again.')
  return { accessToken: result.accessToken, expiresAt, user: mapFieldWorkerUser(result.user) }
}

export async function fetchCurrentFieldWorker(signal?: AbortSignal) {
  const response = await _get<ApiResponse<AuthUserApi>>('/auth/me', undefined, { signal })
  return mapFieldWorkerUser(response.data.data)
}
