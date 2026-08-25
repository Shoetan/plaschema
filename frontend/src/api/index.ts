import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export function _get<T>(url: string, config?: AxiosRequestConfig) {
  return api.get<T, AxiosResponse<T>>(url, config)
}

export function _post<TResponse, TBody = unknown>(
  url: string,
  data?: TBody,
  config?: AxiosRequestConfig<TBody>,
) {
  return api.post<TResponse, AxiosResponse<TResponse>, TBody>(url, data, config)
}

export function _put<TResponse, TBody = unknown>(
  url: string,
  data?: TBody,
  config?: AxiosRequestConfig<TBody>,
) {
  return api.put<TResponse, AxiosResponse<TResponse>, TBody>(url, data, config)
}

export function _delete<T>(url: string, config?: AxiosRequestConfig) {
  return api.delete<T, AxiosResponse<T>>(url, config)
}
