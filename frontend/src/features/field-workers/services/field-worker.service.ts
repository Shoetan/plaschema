import {
  _get,
  _patch,
  _post,
  type ApiResponse,
  type CursorPaginationMeta,
} from '@/api'

import type {
  CreateFieldWorkerPayload,
  FieldWorker,
  FieldWorkerDetail,
  FieldWorkerListParams,
  FieldWorkerListResult,
  FieldWorkerListSummary,
  FieldWorkerUserRecord,
  ResetFieldWorkerPasswordResult,
  ResetFieldWorkerPasswordVariables,
  UpdateFieldWorkerVariables,
} from '../types'

type FieldWorkerListResponse = ApiResponse<
  FieldWorker[],
  CursorPaginationMeta
> & {
  summary?: FieldWorkerListSummary
}

/** GET /users?role=field_worker */
export async function fetchFieldWorkers(
  params: FieldWorkerListParams,
): Promise<FieldWorkerListResult> {
  const response = await _get<FieldWorkerListResponse>('/users', {
    cursor: params.cursor,
    limit: params.limit,
    role: 'field_worker',
    search: params.search,
    status: params.status,
  })

  return {
    items: response.data.data,
    meta: response.data.meta,
    summary: response.data.summary,
  }
}

/** GET /users?role=field_worker (ward assignment picker) */
export async function fetchAssignableFieldWorkers(
  params: FieldWorkerListParams,
): Promise<FieldWorkerListResult> {
  return fetchFieldWorkers(params)
}

/** GET /users/:id/detail */
export async function fetchFieldWorkerDetail(
  id: string,
): Promise<FieldWorkerDetail> {
  const response = await _get<ApiResponse<FieldWorkerDetail>>(
    `/users/${id}/detail`,
  )
  return response.data.data
}

/** POST /users */
export async function createFieldWorker(
  payload: CreateFieldWorkerPayload,
): Promise<FieldWorkerUserRecord> {
  const response = await _post<
    ApiResponse<FieldWorkerUserRecord>,
    CreateFieldWorkerPayload
  >('/users', payload)
  return response.data.data
}

/** PATCH /users/:id */
export async function updateFieldWorker({
  id,
  payload,
}: UpdateFieldWorkerVariables): Promise<FieldWorkerUserRecord> {
  const response = await _patch<
    ApiResponse<FieldWorkerUserRecord>,
    typeof payload
  >(`/users/${id}`, payload)
  return response.data.data
}

/** POST /users/:id/reset-password */
export async function resetFieldWorkerPassword({
  id,
  password,
}: ResetFieldWorkerPasswordVariables): Promise<ResetFieldWorkerPasswordResult> {
  const response = await _post<
    ApiResponse<ResetFieldWorkerPasswordResult>,
    { newPassword: string }
  >(`/users/${id}/reset-password`, { newPassword: password })
  return response.data.data
}
