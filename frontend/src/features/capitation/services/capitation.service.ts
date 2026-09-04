import { _get, _post, type ApiResponse, type CursorPaginationMeta } from '@/api'

import type {
  CapitationListParams,
  CapitationListResult,
  CapitationPreview,
  CapitationRecord,
  CapitationSummary,
  GenerateCapitationPayload,
  GenerateCapitationResult,
} from '../types'

type CapitationListResponse = ApiResponse<CapitationRecord[], CursorPaginationMeta> & {
  summary?: CapitationSummary | null
}

export async function fetchCapitations(
  params: CapitationListParams,
): Promise<CapitationListResult> {
  const response = await _get<CapitationListResponse>('/capitations', {
    month: params.month,
    year: params.year,
    cursor: params.cursor,
    limit: params.limit,
    lga: params.lga,
    healthFacilityId: params.healthFacilityId,
    search: params.search,
  })

  return {
    items: response.data.data,
    meta: response.data.meta,
    summary: response.data.summary,
  }
}

export async function fetchCapitationPreview(
  month: number,
  year: number,
): Promise<CapitationPreview> {
  const response = await _get<ApiResponse<CapitationPreview>>(
    '/capitations/preview',
    { month, year },
  )
  return response.data.data
}

export async function generateCapitation(
  payload: GenerateCapitationPayload,
): Promise<GenerateCapitationResult> {
  const response = await _post<
    ApiResponse<GenerateCapitationResult>,
    GenerateCapitationPayload
  >('/capitations/generate', payload)
  return response.data.data
}
