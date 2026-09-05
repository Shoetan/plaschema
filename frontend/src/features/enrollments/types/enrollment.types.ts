import type { CursorPaginationMeta } from '@/api'

export type EnrollmentStatus = 'pending' | 'active' | 'disabled' | 'deceased'
export type PrintedStatus = 'all' | 'printed' | 'not_printed'
export type FileJobKind = 'id_card' | 'enrollment_report'
export type FileJobFormat = 'pdf' | 'xlsx'
export type FileJobStatus = 'queued' | 'processing' | 'failed' | 'completed'

export interface EnrollmentWard {
  id: string
  name: string
  lga: string
}

export interface EnrollmentFacility {
  id: string
  name: string
  ward: EnrollmentWard
}

export interface EnrollmentListItem {
  id: string
  enrollmentId: string
  beneficiaryName: string
  category: string
  status: EnrollmentStatus
  healthFacility: EnrollmentFacility
  createdAt: string
  hasPrinted: boolean
  printCount: number
  printedAt: string | null
}

export interface EnrollmentListParams {
  cursor?: string
  limit?: number
  wardId?: string
  healthFacilityId?: string
  enrolledByUserId?: string
  status?: EnrollmentStatus
  category?: string
  printedStatus?: PrintedStatus
  lga?: string
  beneficiaryName?: string
  enrollmentId?: string
  createdFrom?: string
  createdTo?: string
  search?: string
  ageMin?: number
  ageMax?: number
}

export interface EnrollmentListResult {
  items: EnrollmentListItem[]
  meta: CursorPaginationMeta
}

export type EnrollmentTitle = 'mr' | 'mrs' | 'miss' | 'ms' | 'dr' | 'chief' | 'rev' | 'alhaji' | 'hajia' | 'other'
export type EnrollmentGender = 'male' | 'female'
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'separated'
export type BloodGroup = 'a_pos' | 'a_neg' | 'b_pos' | 'b_neg' | 'ab_pos' | 'ab_neg' | 'o_pos' | 'o_neg' | 'unknown'
export type Genotype = 'aa' | 'as' | 'ss' | 'ac' | 'sc' | 'unknown'
export type IdDocumentType = 'nin' | 'national_id' | 'voters_card' | 'drivers_license' | 'international_passport' | 'other'
export type NextOfKinRelationship = 'spouse' | 'parent' | 'sibling' | 'child' | 'relative' | 'friend' | 'other'

export interface EnrollmentRecord {
  id: string
  enrollmentId: string
  idempotencyId: string
  capturedAt: string | null
  status: EnrollmentStatus
  category: string
  enrolledByUserId: string
  wardId: string
  healthFacilityId: string
  passportObjectKey: string
  idDocumentObjectKey: string
  passportUrl: string
  idDocumentUrl: string
  fileUrlExpiresInSeconds: number
  title: EnrollmentTitle
  gender: EnrollmentGender
  firstName: string
  lastName: string
  middleName: string | null
  dateOfBirth: string
  phone: string
  email: string | null
  nin: string | null
  maritalStatus: MaritalStatus
  bloodGroup: BloodGroup | null
  genotype: Genotype | null
  idType: IdDocumentType
  nextOfKinFullName: string
  emergencyPhone: string
  nextOfKinRelationship: NextOfKinRelationship | null
  stateOfResidence: string
  lgaOfResidence: string
  residentialAddress: string
  ward: EnrollmentWard
  healthFacility: EnrollmentFacility
  enrolledBy: { id: string; name: string }
  hasPrinted: boolean
  printCount: number
  printedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface EnrollmentActivity {
  id: string
  category: 'enrollment' | 'ward' | 'user' | 'sync'
  action: 'created' | 'updated' | 'status_changed' | 'printed' | 'assigned'
  summary: string
  actor: { id: string; name: string } | null
  enrollmentId: string | null
  occurredAt: string
}

export interface EnrollmentDetailApi {
  overview: {
    id: string
    beneficiaryName: string
    enrollmentId: string
    status: EnrollmentStatus
    syncStatus: 'synced'
    personalDetails: {
      fullName: string
      enrollmentId: string
      dateOfBirth: string
      gender: EnrollmentGender
      nin: string | null
      phone: string
      address: string
    }
  }
  activityLog: EnrollmentActivity[]
}

export interface EnrollmentDetail {
  record: EnrollmentRecord
  overview: EnrollmentDetailApi['overview']
  activityLog: EnrollmentActivity[]
}

export interface ExportEnrollmentPayload {
  format: 'xlsx'
  wardId?: string
  healthFacilityId?: string
  enrolledByUserId?: string
  status?: EnrollmentStatus
  category?: string
  lga?: string
  createdFrom?: string
  createdTo?: string
  ageMin?: number
  ageMax?: number
}

export interface CreateFileJobResult {
  jobId: string
  status: 'queued'
}

export interface FileJobMetadata {
  enrollmentCount?: number
  rowCount?: number
  enrollmentIds?: string[]
}

export interface FileJob {
  id: string
  kind: FileJobKind
  format: FileJobFormat
  title: string
  status: FileJobStatus
  metadata: FileJobMetadata | null
  error: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  canDownload: boolean
}

export interface FileJobListParams {
  cursor?: string
  limit?: number
  status?: FileJobStatus
}

export interface FileJobListResult {
  items: FileJob[]
  meta: CursorPaginationMeta
}

export interface FileJobDownload {
  jobId: string
  downloadUrl: string
  expiresInSeconds: number
  title: string
  filename: string
  format: FileJobFormat
}
