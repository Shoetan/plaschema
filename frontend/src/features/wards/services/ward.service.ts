import {
  _delete,
  _get,
  _patch,
  _post,
  _put,
  type ApiResponse,
  type CursorPaginationMeta,
} from '@/api'

import type {
  CreateWardPayload,
  CreatedWard,
  CreatedWardApi,
  DeleteWardResult,
  AssignWardFieldWorkersResult,
  AssignWardFieldWorkersVariables,
  UpdateWardVariables,
  WardBatchResult,
  WardDetail,
  WardListItemApi,
  WardListParams,
  WardListResult,
  WardRecord,
} from '../types/ward.types'
import { isWardBatchResult, mapCreatedWard, mapWardListItem } from '../utils/map-ward'

/** POST /wards */
export async function createWard(
  payload: CreateWardPayload,
): Promise<CreatedWard> {
  const response = await _post<ApiResponse<CreatedWardApi>, CreateWardPayload>(
    '/wards',
    payload,
  )
  return mapCreatedWard(response.data.data)
}

/** POST /wards/batch */
export async function uploadWardsBatch(file: File): Promise<WardBatchResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await _post<
    ApiResponse<WardBatchResult> | WardBatchResult,
    FormData
  >('/wards/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  const responseBody = response.data
  const result = isWardBatchResult(responseBody)
    ? responseBody
    : responseBody.data

  if (!isWardBatchResult(result)) {
    throw new Error('The ward upload returned an unexpected response.')
  }

  return result
}

/** GET /wards */
export async function fetchWards(
  params: WardListParams,
): Promise<WardListResult> {
  const response = await _get<
    ApiResponse<WardListItemApi[], CursorPaginationMeta>
  >('/wards', {
    cursor: params.cursor,
    limit: params.limit,
    search: params.search,
    status: params.status,
  })

  return {
    items: response.data.data.map(mapWardListItem),
    meta: response.data.meta,
  }
}

/** GET /wards/:id/detail */
export async function fetchWardDetail(id: string): Promise<WardDetail> {
  const response = await _get<ApiResponse<WardDetail>>(`/wards/${id}/detail`)
  return response.data.data
}

/** PATCH /wards/:id */
export async function updateWard({
  id,
  payload,
}: UpdateWardVariables): Promise<WardRecord> {
  const response = await _patch<ApiResponse<WardRecord>, typeof payload>(
    `/wards/${id}`,
    payload,
  )
  return response.data.data
}

/** PUT /wards/:id/field-workers */
export async function assignWardFieldWorkers({
  id,
  fieldWorkerIds,
}: AssignWardFieldWorkersVariables): Promise<AssignWardFieldWorkersResult> {
  const response = await _put<
    ApiResponse<AssignWardFieldWorkersResult>,
    { fieldWorkerIds: string[] }
  >(`/wards/${id}/field-workers`, { fieldWorkerIds })
  return response.data.data
}

/** DELETE /wards/:id */
export async function deleteWard(id: string): Promise<DeleteWardResult> {
  const response = await _delete<ApiResponse<DeleteWardResult>>(`/wards/${id}`)
  return response.data.data
}
