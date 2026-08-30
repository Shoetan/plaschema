import axios, { type AxiosError } from 'axios'

import type { ApiErrorBody } from './api.types'

export const DEFAULT_ERROR_MESSAGE =
  'Something went wrong. Please try again.'

export function isApiError(error: unknown): error is AxiosError<ApiErrorBody> {
  return axios.isAxiosError<ApiErrorBody>(error)
}

export function getApiErrorMessage(
  error: unknown,
  fallback = DEFAULT_ERROR_MESSAGE,
): string {
  if (isApiError(error)) {
    return error.response?.data.error.message ?? fallback
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return isApiError(error) ? error.response?.status : undefined
}
