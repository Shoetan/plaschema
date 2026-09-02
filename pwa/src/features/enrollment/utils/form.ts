import type { CreateEnrollmentPayload, EnrollmentFormValues, FieldWorkerDetailStats, LocalEnrollmentRecord } from '../types'

export const BENEFICIARY_CATEGORIES = ['IDPs', 'Elderly 65+', 'Indigents / Very Poor / Others'] as const

export const EMPTY_ENROLLMENT_FORM: EnrollmentFormValues = {
  category: '', passportFileId: '', passportName: '', idDocumentFileId: '', idDocumentName: '',
  title: '', firstName: '', middleName: '', lastName: '', gender: '', dateOfBirth: '', maritalStatus: '',
  phone: '', email: '', nin: '', bloodGroup: '', genotype: '', stateOfResidence: 'Plateau',
  lgaOfResidence: '', residentialAddress: '', wardId: '', healthFacilityId: '', idType: '',
  nextOfKinFullName: '', emergencyPhone: '', nextOfKinRelationship: '',
}

export function hasDraftProgress(form: EnrollmentFormValues) {
  return Object.entries(form).some(([key, value]) => key !== 'stateOfResidence' && value !== '')
}

export function toCreateEnrollmentPayload(record: LocalEnrollmentRecord): CreateEnrollmentPayload {
  const { form } = record
  if (!record.passportObjectKey || !record.idDocumentObjectKey || !form.category || !form.title || !form.gender || !form.maritalStatus || !form.idType) {
    throw new Error('Enrollment is missing required information.')
  }
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
    phone: form.phone.trim(),
    ...(form.email.trim() ? { email: form.email.trim() } : {}),
    ...(form.nin.trim() ? { nin: form.nin.trim() } : {}),
    maritalStatus: form.maritalStatus,
    ...(form.bloodGroup ? { bloodGroup: form.bloodGroup } : {}),
    ...(form.genotype ? { genotype: form.genotype } : {}),
    idType: form.idType,
    nextOfKinFullName: form.nextOfKinFullName.trim(),
    emergencyPhone: form.emergencyPhone.trim(),
    ...(form.nextOfKinRelationship ? { nextOfKinRelationship: form.nextOfKinRelationship } : {}),
    stateOfResidence: form.stateOfResidence.trim() || 'Plateau',
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
