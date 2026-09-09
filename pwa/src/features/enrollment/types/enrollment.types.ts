export type EnrollmentTitle = 'mr' | 'mrs' | 'miss' | 'ms' | 'dr' | 'chief' | 'rev' | 'alhaji' | 'hajia' | 'other'
export type EnrollmentGender = 'male' | 'female'
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'separated'
export type BloodGroup = 'a_pos' | 'a_neg' | 'b_pos' | 'b_neg' | 'ab_pos' | 'ab_neg' | 'o_pos' | 'o_neg' | 'unknown'
export type Genotype = 'aa' | 'as' | 'ss' | 'ac' | 'sc' | 'unknown'
export type IdDocumentType = 'nin' | 'national_id' | 'voters_card' | 'drivers_license' | 'international_passport' | 'other'
export type BeneficiaryCategory = 'IDPs' | 'Elderly 65+' | 'Indigents / Very Poor / Others'
export type LocalSyncStatus = 'pending' | 'uploading' | 'submitting' | 'failed' | 'synced'
export type EnrollmentStatus = 'pending' | 'active' | 'disabled' | 'deceased'
export type HouseholdRole = 'head' | 'member'

export interface EnrollmentFormValues {
  category: BeneficiaryCategory | ''
  passportFileId: string
  passportName: string
  idDocumentFileId: string
  idDocumentName: string
  title: EnrollmentTitle | ''
  firstName: string
  middleName: string
  lastName: string
  gender: EnrollmentGender | ''
  dateOfBirth: string
  maritalStatus: MaritalStatus | ''
  phone: string
  email: string
  emergencyPhone: string
  nin: string
  bloodGroup: BloodGroup | ''
  genotype: Genotype | ''
  stateOfResidence: 'PLATEAU'
  lgaOfResidence: string
  residentialAddress: string
  wardId: string
  healthFacilityId: string
  idType: IdDocumentType | ''
}

export interface EnrollmentDraftRecord {
  ownerUserId: string
  idempotencyId: string
  step: number
  form: EnrollmentFormValues
  passportObjectKey?: string
  idDocumentObjectKey?: string
  createdAt: string
  updatedAt: string
}

export interface StoredEnrollmentFile {
  id: string
  ownerUserId: string
  enrollmentLocalId: string
  purpose: 'passport' | 'id_document'
  name: string
  contentType: string
  size: number
  blob: Blob
  createdAt: string
}

export interface LocalEnrollmentRecord {
  localId: string
  ownerUserId: string
  idempotencyId: string
  capturedAt: string
  form: EnrollmentFormValues
  wardName: string
  facilityName: string
  syncStatus: LocalSyncStatus
  uploadStage: 'queued' | 'passport' | 'id_document' | 'enrollment' | 'complete'
  passportObjectKey?: string
  idDocumentObjectKey?: string
  serverId?: string
  enrollmentId?: string
  serverStatus?: EnrollmentStatus
  syncedAt?: string
  attemptCount: number
  retryAt?: string
  errorCode?: string
  errorMessage?: string
  errorDetails?: unknown
  leaseUntil?: string
  enrollmentKind?: 'individual' | 'household'
  householdLocalId?: string
  householdId?: string
  householdCode?: string
  householdRole?: HouseholdRole
  localMemberOrder?: number
  memberSequence?: number
}

export interface ReferenceWard {
  key: string
  ownerUserId: string
  id: string
  code: string
  name: string
  state: string | null
  lga: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface ReferenceFacility {
  key: string
  ownerUserId: string
  id: string
  name: string
  lga: string
  type: string
  level: 'primary' | 'secondary' | 'tertiary'
  status: 'active' | 'inactive'
  wardId: string
  ward: { id: string; name: string; lga: string }
  createdAt: string
  updatedAt: string
}

export interface ReferenceMetadata {
  ownerUserId: string
  syncedAt: string
  wardAccessSignature: string
}

export interface EnrollmentPresignRequest {
  purpose: 'passport' | 'id_document'
  contentType: string
  filename: string
}

export interface EnrollmentPresignResponse extends EnrollmentPresignRequest {
  objectKey: string
  uploadUrl: string
  expiresInSeconds: number
  method: 'PUT'
}

export interface CreateEnrollmentPayload {
  idempotencyId: string
  capturedAt: string
  category: BeneficiaryCategory
  passportObjectKey: string
  idDocumentObjectKey: string
  title: EnrollmentTitle
  gender: EnrollmentGender
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth: string
  phone: string
  email?: string
  nin?: string
  maritalStatus: MaritalStatus
  bloodGroup?: BloodGroup
  genotype?: Genotype
  idType: IdDocumentType
  emergencyPhone?: string
  stateOfResidence: 'PLATEAU'
  lgaOfResidence: string
  residentialAddress: string
  wardId: string
  healthFacilityId: string
}

export interface CreateEnrollmentResponse {
  id: string
  enrollmentId: string
  idempotencyId: string
  status: EnrollmentStatus
  capturedAt: string | null
  createdAt: string
  idempotentReplay: boolean
}

export interface HouseholdEnrollmentContextPayload {
  householdLocalId: string
  householdCode: string
  role: HouseholdRole
  householdId?: string
  sharedResidentialAddress?: string
}

export interface CreateHouseholdEnrollmentPayload extends CreateEnrollmentPayload {
  household: HouseholdEnrollmentContextPayload
}

export interface CreateHouseholdEnrollmentResponse extends CreateEnrollmentResponse {
  householdId: string | null
  householdRole: HouseholdRole | null
  memberSequence: number | null
  householdCode: string | null
}

export interface HouseholdDraftMember {
  idempotencyId: string
  form: EnrollmentFormValues
  passportObjectKey?: string
  idDocumentObjectKey?: string
  passportFileId: string
  passportName: string
  idDocumentFileId: string
  idDocumentName: string
}

export interface HouseholdDraftRecord {
  ownerUserId: string
  householdLocalId: string
  householdCode: string
  wardId: string
  sharedResidentialAddress: string
  head: HouseholdDraftMember | null
  members: HouseholdDraftMember[]
  phase: 'setup' | 'head' | 'members' | 'review'
  headStep: number
  memberStep: number
  activeMemberIndex: number
  createdAt: string
  updatedAt: string
}

export interface CachedHouseholdRecord {
  key: string
  ownerUserId: string
  id?: string
  householdLocalId: string
  householdCode: string
  wardId: string
  wardName: string
  headName: string | null
  memberCount: number
  residentialAddress: string | null
  updatedAt: string
}

export interface HouseholdCounterRecord {
  key: string
  ownerUserId: string
  wardId: string
  lastValue: number
}

export interface FieldWorkerDetailStats {
  totalEnrolled: number
  enrollmentsToday: number
  enrollmentsThisMonth: number
  lastEnrollmentAt: string | null
  lastSyncedAt: string | null
}

export interface FieldWorkerDetailResponse {
  fieldWorker: { id: string; name: string; email: string; phone: string | null; status: 'active' | 'inactive'; lastSyncedAt: string | null; createdAt: string; updatedAt: string }
  stats: FieldWorkerDetailStats
  wards: Array<{ id: string; name: string; lga: string; state: string }>
  activityLog: unknown[]
}

export interface CachedFieldWorkerStats {
  ownerUserId: string
  stats: FieldWorkerDetailStats
  cachedAt: string
}

export interface DeviceSyncState {
  ownerUserId: string
  needsReport: boolean
  updatedAt: string
}
