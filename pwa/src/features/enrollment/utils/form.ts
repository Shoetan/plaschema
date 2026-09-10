import type { EnrollmentFormValues, FieldWorkerDetailStats, LocalEnrollmentRecord, ReferenceFacility, ReferenceWard } from '../types'

export const BENEFICIARY_CATEGORIES = ['IDPs', 'Elderly 65+', 'Indigents / Very Poor / Others'] as const
export const PLATEAU_STATE = 'PLATEAU' as const

function canonicalPhoneNumber(value: string | undefined | null) {
  const digits = (value ?? '').replace(/\D/g, '')
  return digits.startsWith('234') && digits.length === 13 ? `0${digits.slice(3)}` : digits
}

export function normalizePhoneNumber(value: string | undefined | null) {
  return canonicalPhoneNumber(value).slice(0, 11)
}

export function isValidPhoneNumber(value: string) {
  return /^\d{11}$/.test(value)
}

export function normalizeNin(value: string | undefined | null) {
  return (value ?? '').replace(/\D/g, '').slice(0, 10)
}

export function isValidNin(value: string) {
  return /^\d{10}$/.test(value)
}

export function getActiveWardFacilities(wardId: string, facilities: ReferenceFacility[]) {
  return facilities.filter((facility) => facility.status === 'active' && facility.wardId === wardId)
}

export function resolveHealthFacilityId(wardId: string, currentFacilityId: string, facilities: ReferenceFacility[]) {
  const activeFacilities = getActiveWardFacilities(wardId, facilities)
  if (activeFacilities.some((facility) => facility.id === currentFacilityId)) return currentFacilityId
  return activeFacilities.length === 1 ? activeFacilities[0].id : ''
}

export function isWardFacilityLocked(wardId: string, facilities: ReferenceFacility[]) {
  return getActiveWardFacilities(wardId, facilities).length === 1
}

export function getResidenceLgas(wards: ReferenceWard[]) {
  return [...new Set(wards.filter((ward) => ward.status === 'active').map((ward) => ward.lga))]
    .sort((a, b) => a.localeCompare(b))
}

export function getOfficerLga(assignedWards: Array<{ lga: string }>, fallbackWards: Array<{ lga: string }> = []) {
  return assignedWards[0]?.lga ?? fallbackWards[0]?.lga ?? ''
}

export function resolveWardId(lga: string, currentWardId: string, wards: ReferenceWard[]) {
  const availableWards = wards.filter((ward) => ward.status === 'active' && ward.lga === lga)
  if (availableWards.some((ward) => ward.id === currentWardId)) return currentWardId
  return availableWards.length === 1 ? availableWards[0].id : ''
}

export function normalizeEnrollmentForm(form: EnrollmentFormValues): EnrollmentFormValues {
  const merged = { ...EMPTY_ENROLLMENT_FORM, ...form, stateOfResidence: PLATEAU_STATE }
  return {
    ...merged,
    phone: normalizePhoneNumber(merged.phone),
    emergencyPhone: normalizePhoneNumber(merged.emergencyPhone),
    nin: normalizeNin(merged.nin),
  }
}

export const EMPTY_ENROLLMENT_FORM: EnrollmentFormValues = {
  category: '', passportFileId: '', passportName: '', idDocumentFileId: '', idDocumentName: '',
  title: '', firstName: '', middleName: '', lastName: '', gender: '', dateOfBirth: '', maritalStatus: '',
  phone: '', email: '', emergencyPhone: '', nin: '', bloodGroup: '', genotype: '', stateOfResidence: PLATEAU_STATE,
  lgaOfResidence: '', residentialAddress: '', wardId: '', healthFacilityId: '', idType: '',
}

export function hasDraftProgress(form: EnrollmentFormValues) {
  return Object.entries(form).some(([key, value]) => key !== 'stateOfResidence' && value !== '')
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
