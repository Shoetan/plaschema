import { _get, type ApiResponse, type CursorPaginationMeta } from '@/api'

import type { HouseholdDetail, HouseholdListItem, HouseholdListParams, HouseholdListResult } from '../types'

export async function fetchHouseholds(params: HouseholdListParams): Promise<HouseholdListResult> {
  const response = await _get<ApiResponse<HouseholdListItem[], CursorPaginationMeta>>('/households', {
    cursor: params.cursor,
    limit: params.limit,
    wardId: params.wardId,
    lga: params.lga,
    search: params.search,
    householdCode: params.householdCode,
  })
  return { items: response.data.data, meta: response.data.meta }
}

export async function fetchHouseholdDetail(id: string): Promise<HouseholdDetail> {
  const response = await _get<ApiResponse<HouseholdDetail>>(`/households/${id}`)
  return response.data.data
}
