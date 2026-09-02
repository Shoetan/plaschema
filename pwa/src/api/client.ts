import axios from 'axios'

import { useAuthStore } from '@/features/auth/stores/auth.store'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const requestUrl = error.config?.url ?? ''
      if (!requestUrl.includes('/auth/login')) {
        useAuthStore.getState().clearSession('expired')
      }
    }
    return Promise.reject(error)
  },
)
