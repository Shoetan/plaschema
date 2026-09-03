import { v7 as uuidv7 } from 'uuid'

import { offlineDb } from '@/lib/offline-db'

import type {
  EnrollmentDraftRecord,
  EnrollmentFormValues,
  LocalEnrollmentRecord,
  ReferenceFacility,
  ReferenceWard,
  StoredEnrollmentFile,
} from '../types'
import { EMPTY_ENROLLMENT_FORM, hasDraftProgress, normalizeEnrollmentForm } from '../utils'

export async function createEnrollmentDraft(ownerUserId: string) {
  const now = new Date().toISOString()
  const draft: EnrollmentDraftRecord = {
    ownerUserId,
    idempotencyId: uuidv7(),
    step: 0,
    form: { ...EMPTY_ENROLLMENT_FORM },
    createdAt: now,
    updatedAt: now,
  }
  await offlineDb.drafts.put(draft)
  return draft
}

export async function saveEnrollmentDraft(draft: EnrollmentDraftRecord) {
  await offlineDb.drafts.put({ ...draft, updatedAt: new Date().toISOString() })
}

export async function discardEnrollmentDraft(ownerUserId: string) {
  const draft = await offlineDb.drafts.get(ownerUserId)
  await offlineDb.transaction('rw', offlineDb.drafts, offlineDb.files, async () => {
    await offlineDb.drafts.delete(ownerUserId)
    if (draft) await offlineDb.files.where('enrollmentLocalId').equals(draft.idempotencyId).delete()
  })
}

export async function saveEnrollmentFile(ownerUserId: string, enrollmentLocalId: string, purpose: StoredEnrollmentFile['purpose'], file: File) {
  const id = uuidv7()
  const stored: StoredEnrollmentFile = {
    id, ownerUserId, enrollmentLocalId, purpose, name: file.name,
    contentType: file.type, size: file.size, blob: file, createdAt: new Date().toISOString(),
  }
  await offlineDb.transaction('rw', offlineDb.files, async () => {
    await offlineDb.files.where('[enrollmentLocalId+purpose]').equals([enrollmentLocalId, purpose]).delete()
    await offlineDb.files.put(stored)
  })
  return stored
}

export async function removeEnrollmentFile(enrollmentLocalId: string, purpose: StoredEnrollmentFile['purpose']) {
  await offlineDb.files.where('[enrollmentLocalId+purpose]').equals([enrollmentLocalId, purpose]).delete()
}

export async function queueEnrollment(draft: EnrollmentDraftRecord, wardName: string, facilityName: string) {
  const capturedAt = new Date().toISOString()
  const record: LocalEnrollmentRecord = {
    localId: draft.idempotencyId,
    ownerUserId: draft.ownerUserId,
    idempotencyId: draft.idempotencyId,
    capturedAt,
    form: normalizeEnrollmentForm(draft.form),
    wardName,
    facilityName,
    syncStatus: 'pending',
    uploadStage: 'queued',
    passportObjectKey: draft.passportObjectKey,
    idDocumentObjectKey: draft.idDocumentObjectKey,
    attemptCount: 0,
  }
  await offlineDb.transaction('rw', offlineDb.drafts, offlineDb.enrollments, async () => {
    await offlineDb.enrollments.put(record)
    await offlineDb.drafts.delete(draft.ownerUserId)
  })
  return record
}

export async function restoreFailedEnrollmentAsDraft(localId: string) {
  const record = await offlineDb.enrollments.get(localId)
  if (!record || record.syncStatus !== 'failed') throw new Error('Only failed enrollments can be edited.')
  const existingDraft = await offlineDb.drafts.get(record.ownerUserId)
  if (existingDraft && hasDraftProgress(existingDraft.form)) throw new Error('Finish or discard the current enrollment draft before editing this record.')
  const now = new Date().toISOString()
  await offlineDb.transaction('rw', offlineDb.drafts, offlineDb.enrollments, async () => {
    await offlineDb.drafts.put({
      ownerUserId: record.ownerUserId,
      idempotencyId: record.idempotencyId,
      step: 0,
      form: normalizeEnrollmentForm(record.form),
      passportObjectKey: record.passportObjectKey,
      idDocumentObjectKey: record.idDocumentObjectKey,
      createdAt: record.capturedAt,
      updatedAt: now,
    })
    await offlineDb.enrollments.delete(localId)
  })
}

export async function retryLocalEnrollment(localId: string) {
  await offlineDb.enrollments.update(localId, {
    syncStatus: 'pending', retryAt: undefined, errorCode: undefined,
    errorMessage: undefined, errorDetails: undefined, leaseUntil: undefined,
  })
}

export async function discardLocalEnrollment(localId: string) {
  await offlineDb.transaction('rw', offlineDb.enrollments, offlineDb.files, async () => {
    await offlineDb.files.where('enrollmentLocalId').equals(localId).delete()
    await offlineDb.enrollments.delete(localId)
  })
}

export async function replaceReferenceData(ownerUserId: string, wardAccess: string[], wards: Array<Omit<ReferenceWard, 'key' | 'ownerUserId'>>, facilities: Array<Omit<ReferenceFacility, 'key' | 'ownerUserId'>>) {
  const allowed = new Set(wardAccess)
  const visibleWards = allowed.size === 0 ? wards : wards.filter((ward) => allowed.has(ward.id))
  const visibleWardIds = new Set(visibleWards.map((ward) => ward.id))
  const visibleFacilities = facilities.filter((facility) => visibleWardIds.has(facility.wardId))
  const syncedAt = new Date().toISOString()

  await offlineDb.transaction('rw', offlineDb.wards, offlineDb.facilities, offlineDb.referenceMetadata, async () => {
    await offlineDb.wards.where('ownerUserId').equals(ownerUserId).delete()
    await offlineDb.facilities.where('ownerUserId').equals(ownerUserId).delete()
    await offlineDb.wards.bulkPut(visibleWards.map((ward) => ({ ...ward, key: `${ownerUserId}:${ward.id}`, ownerUserId })))
    await offlineDb.facilities.bulkPut(visibleFacilities.map((facility) => ({ ...facility, key: `${ownerUserId}:${facility.id}`, ownerUserId })))
    await offlineDb.referenceMetadata.put({ ownerUserId, syncedAt, wardAccessSignature: [...wardAccess].sort().join(',') })
  })
}

export async function removeSyncedEnrollments(ownerUserId: string) {
  const syncedIds = await offlineDb.enrollments.where('ownerUserId').equals(ownerUserId)
    .filter((record) => record.syncStatus === 'synced').primaryKeys()
  if (syncedIds.length === 0) return 0
  await offlineDb.transaction('rw', offlineDb.enrollments, offlineDb.files, async () => {
    await offlineDb.files.where('enrollmentLocalId').anyOf(syncedIds).delete()
    await offlineDb.enrollments.bulkDelete(syncedIds)
  })
  return syncedIds.length
}

export function enrollmentDisplayName(form: EnrollmentFormValues) {
  return [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ')
}
