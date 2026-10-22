import axios, { type AxiosError } from 'axios'

import { getApiBearerToken } from './auth-header'
import type { ApiErrorBody, RequestConfig } from './api.types'
import { getApiErrorCode } from './errors'
import { useAuthStore } from '@/features/auth/stores/auth.store'

function requestHadBearerToken(error: AxiosError<ApiErrorBody>): boolean {
  const header = error.config?.headers?.Authorization ?? error.config?.headers?.authorization
  return typeof header === 'string' && header.startsWith('Bearer ') && header.length > 'Bearer '.length
}

function shouldClearSessionOn401(error: AxiosError<ApiErrorBody>): boolean {
  const config = error.config as RequestConfig | undefined
  if (config?.skipSessionClearOn401) return false

  const requestUrl = error.config?.url ?? ''
  if (requestUrl.includes('/auth/login')) return false

  if (!requestHadBearerToken(error)) return false

  const code = getApiErrorCode(error)
  const message = error.response?.data?.error?.message ?? ''

  if (code === 'TOKEN_EXPIRED') return true
  if (code === 'UNAUTHORIZED' && message === 'User account is inactive') return true
  if (code === 'UNAUTHORIZED' && message === 'Invalid access token') return true
  if (code === 'UNAUTHORIZED' && message === 'Access token has expired') return true

  return false
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const requestConfig = config as RequestConfig
  const token = requestConfig.accessToken ?? getApiBearerToken() ?? useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401 && shouldClearSessionOn401(error)) {
        useAuthStore.getState().clearSession('expired')
      }
      if (getApiErrorCode(error) === 'PASSWORD_CHANGE_REQUIRED') {
        const user = useAuthStore.getState().user
        if (user && !user.isPasswordChangeRequired) {
          useAuthStore.getState().updateUser({ ...user, isPasswordChangeRequired: true })
        }
      }
    }
    return Promise.reject(error)
  },
)
