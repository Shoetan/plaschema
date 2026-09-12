import { _get, _post, type ApiResponse } from '@/api'

import type {
  CachedHouseholdRecord,
  CreateHouseholdEnrollmentPayload,
  CreateHouseholdEnrollmentResponse,
} from '@/features/enrollment/types'

export interface HouseholdListItemApi {
  id: string
  householdLocalId: string
  householdCode: string
  wardId: string
  ward: { id: string; name: string; lga: string; code: string }
  headName: string | null
  memberCount: number
  residentialAddress: string | null
  createdAt: string
}

export interface HouseholdListResponse {
  data: HouseholdListItemApi[]
  meta: {
    nextCursor: string | null
    hasMore: boolean
    limit: number
    total: number
  }
}

export interface HouseholdCodeCounterApi {
  wardId: string
  lastSuffix: string | null
}

/** POST /household-enrollments */
export async function createHouseholdEnrollment(payload: CreateHouseholdEnrollmentPayload) {
  const response = await _post<ApiResponse<CreateHouseholdEnrollmentResponse>, CreateHouseholdEnrollmentPayload>(
    '/household-enrollments',
    payload,
  )
  return response.data.data
}

/** GET /households */
export async function listHouseholds(params?: { wardId?: string; search?: string; cursor?: string; limit?: number }) {
  const response = await _get<ApiResponse<HouseholdListItemApi[], HouseholdListResponse['meta']>>('/households', params)
  return response.data
}

/** GET /households/code-counters */
export async function fetchHouseholdCodeCounters(signal?: AbortSignal) {
  const response = await _get<ApiResponse<HouseholdCodeCounterApi[]>>('/households/code-counters', undefined, { signal })
  return response.data.data
}

export function toCachedHousehold(
  ownerUserId: string,
  item: HouseholdListItemApi,
): CachedHouseholdRecord {
  return {
    key: `${ownerUserId}:${item.id}`,
    ownerUserId,
    id: item.id,
    householdLocalId: item.householdLocalId,
    householdCode: item.householdCode,
    wardId: item.wardId,
    wardName: item.ward.name,
    headName: item.headName,
    memberCount: item.memberCount,
    residentialAddress: item.residentialAddress,
    updatedAt: new Date().toISOString(),
  }
}
