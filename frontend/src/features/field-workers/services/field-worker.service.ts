import { _get, type ApiResponse, type CursorPaginationMeta } from '@/api'

import type {
  AssignableFieldWorker,
  FieldWorkerListParams,
  FieldWorkerListResult,
} from '../types'

/** GET /users?role=field_worker */
export async function fetchAssignableFieldWorkers(
  params: FieldWorkerListParams,
): Promise<FieldWorkerListResult> {
  const response = await _get<
    ApiResponse<AssignableFieldWorker[], CursorPaginationMeta>
  >('/users', { ...params, role: 'field_worker' })

  return { items: response.data.data, meta: response.data.meta }
}
