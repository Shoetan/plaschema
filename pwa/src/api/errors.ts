import axios, { type AxiosError } from 'axios'

import type { ApiErrorBody } from './api.types'

export const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.'

export function isApiError(error: unknown): error is AxiosError<ApiErrorBody> {
  return axios.isAxiosError<ApiErrorBody>(error)
}

export function getApiErrorMessage(error: unknown, fallback = DEFAULT_ERROR_MESSAGE) {
  if (isApiError(error)) return error.response?.data.error.message ?? fallback
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function getApiErrorStatus(error: unknown) {
  return isApiError(error) ? error.response?.status : undefined
}

export function getApiErrorCode(error: unknown) {
  return isApiError(error) ? error.response?.data.error.code : undefined
}

export function getApiErrorDetails(error: unknown) {
  return isApiError(error) ? error.response?.data.error.details : undefined
}
