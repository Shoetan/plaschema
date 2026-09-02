import { getApiErrorCode, getApiErrorDetails, getApiErrorMessage, getApiErrorStatus } from '@/api'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { offlineDb } from '@/lib/offline-db'

import type { LocalEnrollmentRecord } from '../types'
import { toCreateEnrollmentPayload } from '../utils'
import {
  createEnrollment,
  downloadFacilities,
  downloadWards,
  presignEnrollmentUpload,
  reportDeviceSync,
  uploadEnrollmentFile,
} from './enrollment.service'
import { cleanupExpiredEnrollments, replaceReferenceData } from './offline-enrollment.service'

const referenceInflight = new Map<string, Promise<void>>()
let queueInflight: Promise<boolean> | null = null
const REFERENCE_MAX_AGE_MS = 24 * 60 * 60_000

export function syncReferenceData(ownerUserId: string, wardIds: string[]) {
  const existing = referenceInflight.get(ownerUserId)
  if (existing) return existing
  const task = Promise.all([downloadWards(), downloadFacilities()])
    .then(([wards, facilities]) => replaceReferenceData(ownerUserId, wardIds, wards, facilities))
    .finally(() => referenceInflight.delete(ownerUserId))
  referenceInflight.set(ownerUserId, task)
  return task
}

export async function syncReferenceDataIfNeeded(ownerUserId: string, wardIds: string[], now = Date.now()) {
  const metadata = await offlineDb.referenceMetadata.get(ownerUserId)
  const signature = [...wardIds].sort().join(',')
  const syncedAt = metadata ? new Date(metadata.syncedAt).getTime() : Number.NaN
  if (metadata && metadata.wardAccessSignature === signature && Number.isFinite(syncedAt) && now - syncedAt < REFERENCE_MAX_AGE_MS) return false
  await syncReferenceData(ownerUserId, wardIds)
  return true
}

function isTransientFailure(error: unknown) {
  const status = getApiErrorStatus(error)
  return status === undefined || status === 408 || status === 429 || status >= 500
}

function nextRetry(attempt: number) {
  const delays = [30_000, 120_000, 600_000]
  return new Date(Date.now() + delays[Math.min(attempt - 1, delays.length - 1)]).toISOString()
}

async function claimRecord(record: LocalEnrollmentRecord) {
  return offlineDb.transaction('rw', offlineDb.enrollments, async () => {
    const current = await offlineDb.enrollments.get(record.localId)
    if (!current || current.ownerUserId !== record.ownerUserId || current.syncStatus !== 'pending') return false
    if (current.retryAt && current.retryAt > new Date().toISOString()) return false
    if (current.leaseUntil && current.leaseUntil > new Date().toISOString()) return false
    await offlineDb.enrollments.update(current.localId, {
      syncStatus: 'uploading',
      leaseUntil: new Date(Date.now() + 5 * 60_000).toISOString(),
      errorCode: undefined,
      errorMessage: undefined,
      errorDetails: undefined,
    })
    return true
  })
}

async function uploadPurpose(record: LocalEnrollmentRecord, purpose: 'passport' | 'id_document') {
  const objectKeyField = purpose === 'passport' ? 'passportObjectKey' : 'idDocumentObjectKey'
  if (record[objectKeyField]) return record[objectKeyField]
  const fileId = purpose === 'passport' ? record.form.passportFileId : record.form.idDocumentFileId
  const file = await offlineDb.files.get(fileId)
  if (!file) throw new Error(`${purpose === 'passport' ? 'Passport' : 'ID document'} file is missing from this device.`)
  await offlineDb.enrollments.update(record.localId, { uploadStage: purpose })
  const presigned = await presignEnrollmentUpload({ purpose, contentType: file.contentType, filename: file.name })
  await uploadEnrollmentFile(presigned.uploadUrl, file.blob, presigned.contentType)
  await offlineDb.enrollments.update(record.localId, { [objectKeyField]: presigned.objectKey })
  return presigned.objectKey
}

async function syncOne(record: LocalEnrollmentRecord) {
  try {
    if (!await claimRecord(record)) return false
    const passportObjectKey = await uploadPurpose(record, 'passport')
    const idDocumentObjectKey = await uploadPurpose({ ...record, passportObjectKey }, 'id_document')
    const ready = { ...record, passportObjectKey, idDocumentObjectKey }
    await offlineDb.enrollments.update(record.localId, { syncStatus: 'submitting', uploadStage: 'enrollment' })
    const acknowledgement = await createEnrollment(toCreateEnrollmentPayload(ready))
    const syncedAt = new Date().toISOString()
    const cacheExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString()
    await offlineDb.transaction('rw', offlineDb.enrollments, offlineDb.files, offlineDb.syncState, async () => {
      await offlineDb.enrollments.update(record.localId, {
        syncStatus: 'synced', uploadStage: 'complete', serverId: acknowledgement.id,
        enrollmentId: acknowledgement.enrollmentId, serverStatus: acknowledgement.status,
        syncedAt, cacheExpiresAt, attemptCount: 0, retryAt: undefined,
        leaseUntil: undefined, errorCode: undefined, errorMessage: undefined, errorDetails: undefined,
      })
      await offlineDb.files.where('enrollmentLocalId').equals(record.localId).delete()
      await offlineDb.syncState.put({ ownerUserId: record.ownerUserId, needsReport: true, updatedAt: syncedAt })
    })
    return true
  } catch (error) {
    const current = await offlineDb.enrollments.get(record.localId)
    const attemptCount = (current?.attemptCount ?? record.attemptCount) + 1
    const status = getApiErrorStatus(error)
    const authFailure = status === 401
    const transient = isTransientFailure(error)
    await offlineDb.enrollments.update(record.localId, {
      syncStatus: authFailure || (transient && attemptCount <= 3) ? 'pending' : 'failed',
      attemptCount,
      retryAt: authFailure ? undefined : transient && attemptCount <= 3 ? nextRetry(attemptCount) : undefined,
      leaseUntil: undefined,
      errorCode: getApiErrorCode(error) ?? (transient ? 'NETWORK_ERROR' : 'SYNC_ERROR'),
      errorMessage: getApiErrorMessage(error, 'Unable to synchronize this enrollment.'),
      errorDetails: getApiErrorDetails(error),
    })
    if (authFailure) throw error
    return false
  }
}

async function runQueue(ownerUserId: string) {
  await cleanupExpiredEnrollments(ownerUserId)
  const now = new Date().toISOString()
  const abandoned = await offlineDb.enrollments.where('ownerUserId').equals(ownerUserId)
    .filter((record) => (record.syncStatus === 'uploading' || record.syncStatus === 'submitting') && (!record.leaseUntil || record.leaseUntil <= now)).toArray()
  await offlineDb.enrollments.bulkUpdate(abandoned.map((record) => ({ key: record.localId, changes: { syncStatus: 'pending', leaseUntil: undefined } })))

  const pending = await offlineDb.enrollments.where('ownerUserId').equals(ownerUserId)
    .filter((record) => record.syncStatus === 'pending' && (!record.retryAt || record.retryAt <= now)).sortBy('capturedAt')
  let syncedAny = false
  for (const record of pending) syncedAny = await syncOne(record) || syncedAny

  const syncState = await offlineDb.syncState.get(ownerUserId)
  let reported = false
  if (syncState?.needsReport) {
    const user = await reportDeviceSync()
    await offlineDb.syncState.put({ ownerUserId, needsReport: false, updatedAt: new Date().toISOString() })
    useAuthStore.getState().completeRestore(user)
    reported = true
  }
  return syncedAny || reported
}

export function syncPendingEnrollments(ownerUserId: string) {
  if (queueInflight) return queueInflight
  queueInflight = runQueue(ownerUserId).finally(() => { queueInflight = null })
  return queueInflight
}
