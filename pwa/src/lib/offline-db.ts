import Dexie, { type EntityTable } from 'dexie'

import type {
  EnrollmentDraftRecord,
  CachedFieldWorkerStats,
  DeviceSyncState,
  LocalEnrollmentRecord,
  ReferenceFacility,
  ReferenceMetadata,
  ReferenceWard,
  StoredEnrollmentFile,
} from '@/features/enrollment/types'

class PlaschemaOfflineDatabase extends Dexie {
  drafts!: EntityTable<EnrollmentDraftRecord, 'ownerUserId'>
  enrollments!: EntityTable<LocalEnrollmentRecord, 'localId'>
  files!: EntityTable<StoredEnrollmentFile, 'id'>
  wards!: EntityTable<ReferenceWard, 'key'>
  facilities!: EntityTable<ReferenceFacility, 'key'>
  referenceMetadata!: EntityTable<ReferenceMetadata, 'ownerUserId'>
  workerStats!: EntityTable<CachedFieldWorkerStats, 'ownerUserId'>
  syncState!: EntityTable<DeviceSyncState, 'ownerUserId'>

  constructor() {
    super('plaschema-field-worker-offline')
    this.version(1).stores({
      drafts: '&ownerUserId, updatedAt',
      enrollments: '&localId, ownerUserId, [ownerUserId+syncStatus], capturedAt, serverId, idempotencyId, retryAt',
      files: '&id, ownerUserId, enrollmentLocalId, [enrollmentLocalId+purpose]',
      wards: '&key, ownerUserId, status, lga',
      facilities: '&key, ownerUserId, wardId, status, lga',
      referenceMetadata: '&ownerUserId, syncedAt',
    })
    this.version(2).stores({
      drafts: '&ownerUserId, updatedAt',
      enrollments: '&localId, ownerUserId, [ownerUserId+syncStatus], capturedAt, serverId, idempotencyId, retryAt',
      files: '&id, ownerUserId, enrollmentLocalId, [enrollmentLocalId+purpose]',
      wards: '&key, ownerUserId, status, lga',
      facilities: '&key, ownerUserId, wardId, status, lga',
      referenceMetadata: '&ownerUserId, syncedAt',
      workerStats: '&ownerUserId, cachedAt',
    })
    this.version(3).stores({
      drafts: '&ownerUserId, updatedAt',
      enrollments: '&localId, ownerUserId, [ownerUserId+syncStatus], capturedAt, serverId, idempotencyId, retryAt',
      files: '&id, ownerUserId, enrollmentLocalId, [enrollmentLocalId+purpose]',
      wards: '&key, ownerUserId, status, lga',
      facilities: '&key, ownerUserId, wardId, status, lga',
      referenceMetadata: '&ownerUserId, syncedAt',
      workerStats: '&ownerUserId, cachedAt',
      syncState: '&ownerUserId, updatedAt',
    })
  }
}

export const offlineDb = new PlaschemaOfflineDatabase()

export async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return false
  return navigator.storage.persist()
}

export async function hasStorageCapacity(bytes: number) {
  if (!navigator.storage?.estimate) return true
  const estimate = await navigator.storage.estimate()
  if (estimate.quota === undefined || estimate.usage === undefined) return true
  return estimate.quota - estimate.usage >= bytes
}
