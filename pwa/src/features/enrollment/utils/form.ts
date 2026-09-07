import type { CreateEnrollmentPayload, EnrollmentFormValues, FieldWorkerDetailStats, LocalEnrollmentRecord, ReferenceFacility, ReferenceWard } from '../types'

export const BENEFICIARY_CATEGORIES = ['IDPs', 'Elderly 65+', 'Indigents / Very Poor / Others'] as const
export const PLATEAU_STATE = 'PLATEAU' as const

function canonicalPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.startsWith('234') && digits.length === 13 ? `0${digits.slice(3)}` : digits
}

export function normalizePhoneNumber(value: string) {
  return canonicalPhoneNumber(value).slice(0, 11)
}

export function isValidPhoneNumber(value: string) {
  return /^\d{11}$/.test(value)
}

export function normalizeNin(value: string) {
  return value.replace(/\D/g, '').slice(0, 10)
}

export function isValidNin(value: string) {
  return /^\d{10}$/.test(value)
}

export function resolveHealthFacilityId(wardId: string, currentFacilityId: string, facilities: ReferenceFacility[]) {
  const activeFacilities = facilities.filter((facility) => facility.status === 'active' && facility.wardId === wardId)
  if (activeFacilities.some((facility) => facility.id === currentFacilityId)) return currentFacilityId
  return activeFacilities.length === 1 ? activeFacilities[0].id : ''
}

export function getResidenceLgas(wards: ReferenceWard[]) {
  return [...new Set(wards.filter((ward) => ward.status === 'active').map((ward) => ward.lga))]
    .sort((a, b) => a.localeCompare(b))
}

export function resolveWardId(lga: string, currentWardId: string, wards: ReferenceWard[]) {
  const availableWards = wards.filter((ward) => ward.status === 'active' && ward.lga === lga)
  if (availableWards.some((ward) => ward.id === currentWardId)) return currentWardId
  return availableWards.length === 1 ? availableWards[0].id : ''
}

export function normalizeEnrollmentForm(form: EnrollmentFormValues): EnrollmentFormValues {
  return {
    ...form,
    stateOfResidence: PLATEAU_STATE,
    phone: normalizePhoneNumber(form.phone),
    nin: normalizeNin(form.nin),
  }
}

export const EMPTY_ENROLLMENT_FORM: EnrollmentFormValues = {
  category: '', passportFileId: '', passportName: '', idDocumentFileId: '', idDocumentName: '',
  title: '', firstName: '', middleName: '', lastName: '', gender: '', dateOfBirth: '', maritalStatus: '',
  phone: '', email: '', nin: '', bloodGroup: '', genotype: '', stateOfResidence: PLATEAU_STATE,
  lgaOfResidence: '', residentialAddress: '', wardId: '', healthFacilityId: '', idType: '',
  nextOfKinFullName: '', nextOfKinRelationship: '',
}

export function hasDraftProgress(form: EnrollmentFormValues) {
  return Object.entries(form).some(([key, value]) => key !== 'stateOfResidence' && value !== '')
}

export function toCreateEnrollmentPayload(record: LocalEnrollmentRecord): CreateEnrollmentPayload {
  const form = { ...record.form, stateOfResidence: PLATEAU_STATE }
  const phone = canonicalPhoneNumber(form.phone)
  const nin = form.nin.replace(/\D/g, '')
  if (!record.passportObjectKey || !record.idDocumentObjectKey || !form.category || !form.title || !form.gender || !form.maritalStatus || !form.idType) {
    throw new Error('Enrollment is missing required information.')
  }
  if (!isValidPhoneNumber(phone)) throw new Error('Phone number must contain exactly 11 digits.')
  if (!isValidNin(nin)) throw new Error('NIN must contain exactly 10 digits.')
  return {
    idempotencyId: record.idempotencyId,
    capturedAt: record.capturedAt,
    category: form.category,
    passportObjectKey: record.passportObjectKey,
    idDocumentObjectKey: record.idDocumentObjectKey,
    title: form.title,
    gender: form.gender,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    ...(form.middleName.trim() ? { middleName: form.middleName.trim() } : {}),
    dateOfBirth: form.dateOfBirth,
    phone,
    ...(form.email.trim() ? { email: form.email.trim() } : {}),
    nin,
    maritalStatus: form.maritalStatus,
    ...(form.bloodGroup ? { bloodGroup: form.bloodGroup } : {}),
    ...(form.genotype ? { genotype: form.genotype } : {}),
    idType: form.idType,
    ...(form.nextOfKinFullName.trim() ? { nextOfKinFullName: form.nextOfKinFullName.trim() } : {}),
    ...(form.nextOfKinRelationship ? { nextOfKinRelationship: form.nextOfKinRelationship } : {}),
    stateOfResidence: PLATEAU_STATE,
    lgaOfResidence: form.lgaOfResidence.trim(),
    residentialAddress: form.residentialAddress.trim(),
    wardId: form.wardId,
    healthFacilityId: form.healthFacilityId,
  }
}

function calendarDay(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date)
}

export function getEnrollmentHomeSummary(records: LocalEnrollmentRecord[], serverStats?: FieldWorkerDetailStats, now = new Date()) {
  const unsent = records.filter((record) => record.syncStatus !== 'synced')
  const today = calendarDay(now)
  const capturedToday = unsent.filter((record) => calendarDay(record.capturedAt) === today).length
  return {
    pending: unsent.length,
    today: (serverStats?.enrollmentsToday ?? 0) + capturedToday,
    total: (serverStats?.totalEnrolled ?? 0) + unsent.length,
  }
}
