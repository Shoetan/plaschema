import { v7 as uuidv7 } from 'uuid'

import { offlineDb } from '@/lib/offline-db'

import type {
  EnrollmentFormValues,
  ReferenceFacility,
  ReferenceWard,
  StoredEnrollmentFile,
} from '../types'

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
