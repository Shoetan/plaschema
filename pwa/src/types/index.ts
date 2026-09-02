export type SyncStatus = 'Pending' | 'Syncing' | 'Failed' | 'Synced'

export interface EnrollmentDraft {
  id: string
  capturedAt: string
  passportName: string
  idDocumentName: string
  title: string
  firstName: string
  middleName: string
  lastName: string
  gender: string
  dateOfBirth: string
  maritalStatus: string
  phone: string
  email: string
  stateOfResidence: string
  lgaOfResidence: string
  residentialAddress: string
  ward: string
  healthFacility: string
  idType: string
  nextOfKinFullName: string
  emergencyPhone: string
  nextOfKinRelationship: string
  syncStatus: SyncStatus
  syncError?: string
}

export interface Beneficiary extends EnrollmentDraft {
  beneficiaryCode: string
}

export interface SyncRecord {
  id: string
  beneficiaryName: string
  ward: string
  capturedAt: string
  status: SyncStatus
  message?: string
}
