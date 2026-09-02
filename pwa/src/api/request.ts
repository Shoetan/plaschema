import { api } from './client'
import type { QueryParams, RequestConfig } from './api.types'

export function _get<T = unknown>(url: string, params?: QueryParams, config?: RequestConfig) {
  return api.get<T>(url, { ...config, params })
}

export function _post<TResponse = unknown, TBody = unknown>(url: string, data?: TBody, config?: RequestConfig<TBody>) {
  return api.post<TResponse>(url, data, config)
}
