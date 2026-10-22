import type { AxiosRequestConfig } from 'axios'

export type QueryParamValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryParamValue | QueryParamValue[]>
export type RequestConfig<D = unknown> = Omit<AxiosRequestConfig<D>, 'url' | 'method' | 'data'> & {
  /** Background sync calls should not sign the user out when the server returns 401. */
  skipSessionClearOn401?: boolean
  /** When set, used instead of the auth store (for calls that must not race after login). */
  accessToken?: string
}

export interface ApiResponse<T, TMeta = null> {
  success: true
  data: T
  meta: TMeta
}

export interface ApiErrorBody {
  success: false
  error: {
    code: string
    message: string
    details: unknown
  }
}
