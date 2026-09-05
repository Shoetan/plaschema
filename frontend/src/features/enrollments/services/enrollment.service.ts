import { _get, _post, type ApiResponse, type CursorPaginationMeta } from '@/api'

import type {
  CreateFileJobResult,
  EnrollmentDetail,
  EnrollmentDetailApi,
  EnrollmentListItem,
  EnrollmentListParams,
  EnrollmentListResult,
  EnrollmentRecord,
  ExportEnrollmentPayload,
  FileJob,
  FileJobDownload,
  FileJobListParams,
  FileJobListResult,
} from '../types'

export async function fetchEnrollments(params: EnrollmentListParams): Promise<EnrollmentListResult> {
  const response = await _get<ApiResponse<EnrollmentListItem[], CursorPaginationMeta>>('/enrollments', {
    cursor: params.cursor,
    limit: params.limit,
    wardId: params.wardId,
    healthFacilityId: params.healthFacilityId,
    enrolledByUserId: params.enrolledByUserId,
    status: params.status,
    category: params.category,
    printedStatus: params.printedStatus,
    lga: params.lga,
    beneficiaryName: params.beneficiaryName,
    enrollmentId: params.enrollmentId,
    createdFrom: params.createdFrom,
    createdTo: params.createdTo,
    search: params.search,
    ageMin: params.ageMin,
    ageMax: params.ageMax,
  })
  return { items: response.data.data, meta: response.data.meta }
}

export async function fetchEnrollmentDetail(id: string): Promise<EnrollmentDetail> {
  const [recordResponse, detailResponse] = await Promise.all([
    _get<ApiResponse<EnrollmentRecord>>(`/enrollments/${id}`),
    _get<ApiResponse<EnrollmentDetailApi>>(`/enrollments/${id}/detail`),
  ])
  return {
    record: recordResponse.data.data,
    overview: detailResponse.data.data.overview,
    activityLog: detailResponse.data.data.activityLog,
  }
}

export async function generateIdCards(enrollmentIds: string[]): Promise<CreateFileJobResult> {
  const response = await _post<ApiResponse<CreateFileJobResult>, { enrollmentIds: string[] }>(
    '/enrollments/id-cards/generate',
    { enrollmentIds },
  )
  return response.data.data
}

export async function exportEnrollments(payload: ExportEnrollmentPayload): Promise<CreateFileJobResult> {
  const response = await _post<ApiResponse<CreateFileJobResult>, ExportEnrollmentPayload>(
    '/enrollments/reports/export',
    payload,
  )
  return response.data.data
}

export async function fetchFileJobs(params: FileJobListParams): Promise<FileJobListResult> {
  const response = await _get<ApiResponse<FileJob[], CursorPaginationMeta>>('/file-jobs', {
    cursor: params.cursor,
    limit: params.limit,
    status: params.status,
  })
  return { items: response.data.data, meta: response.data.meta }
}

export async function fetchFileJob(id: string): Promise<FileJob> {
  const response = await _get<ApiResponse<FileJob>>(`/file-jobs/${id}`)
  return response.data.data
}

export async function fetchFileJobDownload(id: string): Promise<FileJobDownload> {
  const response = await _get<ApiResponse<FileJobDownload>>(`/file-jobs/${id}/download`)
  return response.data.data
}
