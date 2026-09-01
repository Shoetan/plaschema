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
  FieldWorkerBeneficiary,
  FieldWorkerBeneficiaryListParams,
  FieldWorkerBeneficiaryListResult,
  FieldWorkerDetail,
  FieldWorkerListParams,
  FieldWorkerListResult,
  FieldWorkerUserRecord,
  ResetFieldWorkerPasswordResult,
  ResetFieldWorkerPasswordVariables,
  UpdateFieldWorkerVariables,
} from '../types'

/** GET /users?role=field_worker */
export async function fetchFieldWorkers(
  params: FieldWorkerListParams,
): Promise<FieldWorkerListResult> {
  const response = await _get<
    ApiResponse<FieldWorker[], CursorPaginationMeta>
  >('/users', {
    cursor: params.cursor,
    limit: params.limit,
    role: 'field_worker',
    search: params.search,
    status: params.status,
  })

  return { items: response.data.data, meta: response.data.meta }
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

/** GET /enrollments?enrolledByUserId=:id */
export async function fetchFieldWorkerBeneficiaries(
  id: string,
  params: FieldWorkerBeneficiaryListParams,
): Promise<FieldWorkerBeneficiaryListResult> {
  const response = await _get<
    ApiResponse<FieldWorkerBeneficiary[], CursorPaginationMeta>
  >('/enrollments', {
    cursor: params.cursor,
    enrolledByUserId: id,
    limit: params.limit,
  })

  return { items: response.data.data, meta: response.data.meta }
}
