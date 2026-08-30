import axios from 'axios'

import { useAuthStore } from '@/features/auth/stores/auth.store'

const UNAUTHENTICATED_PATHS = ['/auth/login']

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const requestUrl = error.config?.url ?? ''
      const isPublicRequest = UNAUTHENTICATED_PATHS.some((path) =>
        requestUrl.includes(path),
      )

      if (!isPublicRequest) {
        useAuthStore.getState().clearSession('expired')
      }
    }

    return Promise.reject(error)
  },
)
