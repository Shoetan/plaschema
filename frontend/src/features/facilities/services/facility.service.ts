import {
  _delete,
  _get,
  _patch,
  _post,
  type ApiResponse,
  type CursorPaginationMeta,
} from '@/api'

import type {
  CreateHealthFacilityPayload,
  DeleteHealthFacilityResult,
  HealthFacilityBatchResult,
  HealthFacilityDetail,
  HealthFacilityDetailApi,
  HealthFacilityListItemApi,
  HealthFacilityListParams,
  HealthFacilityListResult,
  HealthFacilityListSummary,
  HealthFacilityRecord,
  UpdateHealthFacilityVariables,
} from '../types'
import {
  isHealthFacilityBatchResult,
  mapHealthFacilityDetail,
  mapHealthFacilityListItem,
} from '../utils/map-facility'

type HealthFacilityListResponse = ApiResponse<
  HealthFacilityListItemApi[],
  CursorPaginationMeta
> & {
  summary?: HealthFacilityListSummary
}

export async function fetchHealthFacilities(
  params: HealthFacilityListParams,
): Promise<HealthFacilityListResult> {
  const response = await _get<HealthFacilityListResponse>('/health-facilities', {
    cursor: params.cursor,
    limit: params.limit,
    wardId: params.wardId,
    lga: params.lga,
    type: params.type,
    level: params.level,
    status: params.status,
    search: params.search,
  })
  return {
    items: response.data.data.map(mapHealthFacilityListItem),
    meta: response.data.meta,
    summary: response.data.summary,
  }
}

export async function createHealthFacility(
  payload: CreateHealthFacilityPayload,
): Promise<HealthFacilityRecord> {
  const body: CreateHealthFacilityPayload = {
    name: payload.name,
    wardId: payload.wardId,
    type: payload.type,
    level: payload.level,
    status: payload.status,
  }
  const response = await _post<
    ApiResponse<HealthFacilityRecord>,
    CreateHealthFacilityPayload
  >('/health-facilities', body)
  return response.data.data
}

export async function uploadHealthFacilitiesBatch(
  file: File,
): Promise<HealthFacilityBatchResult> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await _post<
    ApiResponse<HealthFacilityBatchResult> | HealthFacilityBatchResult,
    FormData
  >('/health-facilities/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  const body = response.data
  const result = isHealthFacilityBatchResult(body) ? body : body.data
  if (!isHealthFacilityBatchResult(result)) {
    throw new Error('The facility upload returned an unexpected response.')
  }
  return result
}

export async function fetchHealthFacilityDetail(
  id: string,
): Promise<HealthFacilityDetail> {
  const response = await _get<ApiResponse<HealthFacilityDetailApi>>(
    `/health-facilities/${id}/detail`,
  )
  return mapHealthFacilityDetail(response.data.data)
}

export async function updateHealthFacility({
  id,
  payload,
}: UpdateHealthFacilityVariables): Promise<HealthFacilityRecord> {
  const response = await _patch<
    ApiResponse<HealthFacilityRecord>,
    typeof payload
  >(`/health-facilities/${id}`, payload)
  return response.data.data
}

export async function deleteHealthFacility(
  id: string,
): Promise<DeleteHealthFacilityResult> {
  const response = await _delete<ApiResponse<DeleteHealthFacilityResult>>(
    `/health-facilities/${id}`,
  )
  return response.data.data
}
