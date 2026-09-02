import { _get, _getNdjson, _post, _putExternal, type ApiResponse } from '@/api'

import type {
  CreateEnrollmentPayload,
  CreateEnrollmentResponse,
  EnrollmentPresignRequest,
  EnrollmentPresignResponse,
  FieldWorkerDetailResponse,
  ReferenceFacility,
  ReferenceWard,
} from '../types'

type WardApi = Omit<ReferenceWard, 'key' | 'ownerUserId'>
type FacilityApi = Omit<ReferenceFacility, 'key' | 'ownerUserId'>

/** GET /wards/stream */
export async function downloadWards(signal?: AbortSignal) {
  return _getNdjson<WardApi>('/wards/stream', undefined, signal)
}

/** GET /health-facilities/stream */
export async function downloadFacilities(signal?: AbortSignal) {
  return _getNdjson<FacilityApi>('/health-facilities/stream', undefined, signal)
}

/** POST /enrollments/files/presign-upload */
export async function presignEnrollmentUpload(payload: EnrollmentPresignRequest) {
  const response = await _post<ApiResponse<EnrollmentPresignResponse>, EnrollmentPresignRequest>('/enrollments/files/presign-upload', payload)
  return response.data.data
}

/** PUT <Railway presigned upload URL> */
export async function uploadEnrollmentFile(uploadUrl: string, file: Blob, contentType: string, signal?: AbortSignal) {
  await _putExternal(uploadUrl, file, contentType, signal)
}

/** POST /enrollments */
export async function createEnrollment(payload: CreateEnrollmentPayload) {
  const response = await _post<ApiResponse<CreateEnrollmentResponse>, CreateEnrollmentPayload>('/enrollments', payload)
  return response.data.data
}

/** POST /auth/sync */
export async function reportDeviceSync() {
  const response = await _post<ApiResponse<import('@/features/auth/types').FieldWorkerUser>>('/auth/sync')
  return response.data.data
}

/** GET /users/:id/detail */
export async function fetchOwnFieldWorkerDetail(id: string, signal?: AbortSignal) {
  const response = await _get<ApiResponse<FieldWorkerDetailResponse>>(`/users/${id}/detail`, undefined, { signal })
  return response.data.data
}
