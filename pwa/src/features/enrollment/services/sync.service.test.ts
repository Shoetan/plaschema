import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { offlineDb } from '@/lib/offline-db'

import { EMPTY_ENROLLMENT_FORM } from '../utils'
import { createEnrollmentDraft, queueEnrollment, saveEnrollmentFile } from './offline-enrollment.service'

const mocks = vi.hoisted(() => ({
  createEnrollment: vi.fn(),
  downloadFacilities: vi.fn(),
  downloadWards: vi.fn(),
  presignEnrollmentUpload: vi.fn(),
  reportDeviceSync: vi.fn(),
  uploadEnrollmentFile: vi.fn(),
}))

vi.mock('./enrollment.service', () => mocks)

import { syncPendingEnrollments, syncReferenceDataIfNeeded } from './sync.service'

const owner = '01900000-0000-7000-8000-000000000001'

async function queueCompleteEnrollment(firstName: string) {
  const draft = await createEnrollmentDraft(owner)
  const passport = await saveEnrollmentFile(owner, draft.idempotencyId, 'passport', new File(['photo'], 'passport.jpg', { type: 'image/jpeg' }))
  const identity = await saveEnrollmentFile(owner, draft.idempotencyId, 'id_document', new File(['id'], 'id.pdf', { type: 'application/pdf' }))
  draft.form = {
    ...EMPTY_ENROLLMENT_FORM, category: 'IDPs', passportFileId: passport.id, passportName: passport.name,
    idDocumentFileId: identity.id, idDocumentName: identity.name, title: 'mrs', firstName, lastName: 'Yusuf',
    gender: 'female', dateOfBirth: '1990-05-04', maritalStatus: 'married', phone: '+2348012345678',
    lgaOfResidence: 'Jos North', residentialAddress: '12 Test Road', wardId: 'ward', healthFacilityId: 'facility',
    idType: 'national_id', nextOfKinFullName: 'Test Person', emergencyPhone: '+2348098765432', nextOfKinRelationship: 'sibling',
  }
  return queueEnrollment(draft, 'Ward', 'Facility')
}

function acknowledgement(sequence: number) {
  return { id: `server-${sequence}`, enrollmentId: `PL/${sequence}`, idempotencyId: `key-${sequence}`, status: 'pending' as const, capturedAt: null, createdAt: new Date().toISOString(), idempotentReplay: false }
}

describe('enrollment synchronization', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await offlineDb.delete()
    await offlineDb.open()
    mocks.presignEnrollmentUpload.mockImplementation(async ({ purpose }: { purpose: string }) => ({ objectKey: `${purpose}-key`, uploadUrl: `https://storage/${purpose}`, contentType: purpose === 'passport' ? 'image/jpeg' : 'application/pdf', purpose, filename: 'file', expiresInSeconds: 300, method: 'PUT' }))
    mocks.uploadEnrollmentFile.mockResolvedValue(undefined)
    mocks.reportDeviceSync.mockResolvedValue({ id: owner, name: 'Worker', email: 'worker@example.com', role: 'field_worker', status: 'active', phone: null, lastSyncedAt: new Date().toISOString(), assignedWards: [], createdAt: '', updatedAt: '' })
  })
  afterAll(() => offlineDb.close())

  it('reports a completed sync even when a later record in the batch fails', async () => {
    await queueCompleteEnrollment('First')
    await queueCompleteEnrollment('Second')
    mocks.createEnrollment.mockResolvedValueOnce(acknowledgement(1)).mockRejectedValueOnce(new Error('Network unavailable'))

    await syncPendingEnrollments(owner)

    expect(mocks.reportDeviceSync).toHaveBeenCalledOnce()
    expect(await offlineDb.enrollments.where('ownerUserId').equals(owner).and((record) => record.syncStatus === 'synced').count()).toBe(1)
  })

  it('retries an owed sync report without creating the enrollment again', async () => {
    await queueCompleteEnrollment('First')
    mocks.createEnrollment.mockResolvedValue(acknowledgement(1))
    mocks.reportDeviceSync.mockRejectedValueOnce(new Error('Temporary report failure')).mockResolvedValueOnce({ id: owner, name: 'Worker', email: 'worker@example.com', role: 'field_worker', status: 'active', phone: null, lastSyncedAt: new Date().toISOString(), assignedWards: [], createdAt: '', updatedAt: '' })

    await expect(syncPendingEnrollments(owner)).rejects.toThrow('Temporary report failure')
    expect((await offlineDb.syncState.get(owner))?.needsReport).toBe(true)
    await syncPendingEnrollments(owner)

    expect(mocks.createEnrollment).toHaveBeenCalledOnce()
    expect(mocks.reportDeviceSync).toHaveBeenCalledTimes(2)
    expect((await offlineDb.syncState.get(owner))?.needsReport).toBe(false)
  })

  it('refreshes references only when missing, stale, or ward access changes', async () => {
    mocks.downloadWards.mockResolvedValue([])
    mocks.downloadFacilities.mockResolvedValue([])
    const now = Date.now()
    await expect(syncReferenceDataIfNeeded(owner, ['ward'], now)).resolves.toBe(true)
    await expect(syncReferenceDataIfNeeded(owner, ['ward'], now + 60_000)).resolves.toBe(false)
    await expect(syncReferenceDataIfNeeded(owner, ['other-ward'], now + 120_000)).resolves.toBe(true)
    await expect(syncReferenceDataIfNeeded(owner, ['other-ward'], now + 25 * 60 * 60_000)).resolves.toBe(true)
    expect(mocks.downloadWards).toHaveBeenCalledTimes(3)
    expect(mocks.downloadFacilities).toHaveBeenCalledTimes(3)
  })
})
