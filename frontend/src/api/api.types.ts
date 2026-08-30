import type { AxiosRequestConfig } from 'axios'

export type QueryParamValue = string | number | boolean | null | undefined

export type QueryParams = Record<string, QueryParamValue | QueryParamValue[]>

export type RequestConfig<D = unknown> = Omit<
  AxiosRequestConfig<D>,
  'url' | 'method' | 'data'
>

export interface ApiResponse<T> {
  success: true
  data: T
  meta: PaginationMeta | null
}

export interface PaginationMeta {
  total: number
  page: number
  pageSize: number
}

export interface ApiErrorBody {
  success: false
  error: {
    code: string
    message: string
    details: unknown
  }
}
