import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { EMPTY_ENROLLMENT_FORM } from '@/features/enrollment/utils'
import { createHouseholdMemberDraft, queueHouseholdDraft } from '@/features/household-enrollment/services/offline-household-enrollment.service'
import { offlineDb } from '@/lib/offline-db'

import { saveEnrollmentFile } from './offline-enrollment.service'

const mocks = vi.hoisted(() => ({
  createHouseholdEnrollment: vi.fn(),
  downloadFacilities: vi.fn(),
  downloadWards: vi.fn(),
  presignEnrollmentUpload: vi.fn(),
  reportDeviceSync: vi.fn(),
  uploadEnrollmentFile: vi.fn(),
}))

vi.mock('@/features/household-enrollment/services/household-enrollment.service', () => ({
  createHouseholdEnrollment: mocks.createHouseholdEnrollment,
}))

vi.mock('./enrollment.service', () => mocks)

import { syncPendingEnrollments, syncReferenceDataIfNeeded } from './sync.service'

const owner = '01900000-0000-7000-8000-000000000001'

function completeMember(firstName: string) {
  const member = createHouseholdMemberDraft('12 Test Road', '01900000-0000-7000-8000-000000000010')
  member.form = {
    ...EMPTY_ENROLLMENT_FORM,
    category: 'IDPs',
    passportFileId: 'passport-file',
    passportName: 'passport.jpg',
    idDocumentFileId: 'id-file',
    idDocumentName: 'id.pdf',
    title: 'mrs',
    firstName,
    lastName: 'Yusuf',
    gender: 'female',
    dateOfBirth: '1990-05-04',
    maritalStatus: 'married',
    phone: '08012345678',
    lgaOfResidence: 'Jos North',
    residentialAddress: '12 Test Road',
    wardId: '01900000-0000-7000-8000-000000000010',
    healthFacilityId: '01900000-0000-7000-8000-000000000020',
    idType: 'national_id',
  }
  return member
}

async function queueHousehold(firstName: string, householdLocalId: string, householdCode: string) {
  const head = completeMember(firstName)
  const passport = await saveEnrollmentFile(owner, head.idempotencyId, 'passport', new File(['photo'], 'passport.jpg', { type: 'image/jpeg' }))
  const identity = await saveEnrollmentFile(owner, head.idempotencyId, 'id_document', new File(['id'], 'id.pdf', { type: 'application/pdf' }))
  head.form.passportFileId = passport.id
  head.form.idDocumentFileId = identity.id
  const draft = {
    ownerUserId: owner,
    householdLocalId,
    householdCode,
    wardId: '01900000-0000-7000-8000-000000000010',
    sharedResidentialAddress: '12 Test Road',
    head,
    members: [],
    phase: 'review' as const,
    headStep: 5,
    memberStep: 0,
    activeMemberIndex: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  return queueHouseholdDraft(draft, 'Ward', new Map())
}

function acknowledgement(sequence: number) {
  return {
    id: `server-${sequence}`,
    enrollmentId: `PL/${sequence}`,
    idempotencyId: `key-${sequence}`,
    status: 'pending' as const,
    capturedAt: null,
    createdAt: new Date().toISOString(),
    idempotentReplay: false,
    householdId: '01900000-0000-7000-8000-000000000099',
    householdRole: 'head' as const,
    memberSequence: null,
    householdCode: 'BAR-TAF-001',
  }
}

describe('enrollment synchronization', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await offlineDb.delete()
    await offlineDb.open()
    mocks.presignEnrollmentUpload.mockImplementation(async ({ purpose }: { purpose: string }) => ({
      objectKey: `${purpose}-key`,
      uploadUrl: `https://storage/${purpose}`,
      contentType: purpose === 'passport' ? 'image/jpeg' : 'application/pdf',
      purpose,
      filename: 'file',
      expiresInSeconds: 300,
      method: 'PUT',
    }))
    mocks.uploadEnrollmentFile.mockResolvedValue(undefined)
    mocks.reportDeviceSync.mockResolvedValue({
      id: owner,
      name: 'Worker',
      email: 'worker@example.com',
      role: 'field_worker',
      status: 'active',
      phone: null,
      lastSyncedAt: new Date().toISOString(),
      assignedWards: [],
      createdAt: '',
      updatedAt: '',
    })
  })
  afterAll(() => offlineDb.close())

  it('reports a completed sync even when a later record in the batch fails', async () => {
    await queueHousehold('First', '01900000-0000-7000-8000-000000000088', 'BAR-TAF-001')
    await queueHousehold('Second', '01900000-0000-7000-8000-000000000089', 'BAR-TAF-002')
    mocks.createHouseholdEnrollment.mockResolvedValueOnce(acknowledgement(1)).mockRejectedValueOnce(new Error('Network unavailable'))

    await syncPendingEnrollments(owner)

    expect(mocks.reportDeviceSync).toHaveBeenCalledOnce()
    expect(await offlineDb.enrollments.where('ownerUserId').equals(owner).count()).toBe(1)
    expect((await offlineDb.enrollments.where('ownerUserId').equals(owner).first())?.form.firstName).toBe('Second')
  })

  it('retries an owed sync report without creating the enrollment again', async () => {
    const queued = await queueHousehold('First', '01900000-0000-7000-8000-000000000088', 'BAR-TAF-001')
    mocks.createHouseholdEnrollment.mockResolvedValue(acknowledgement(1))
    mocks.reportDeviceSync.mockRejectedValueOnce(new Error('Temporary report failure')).mockResolvedValueOnce({
      id: owner,
      name: 'Worker',
      email: 'worker@example.com',
      role: 'field_worker',
      status: 'active',
      phone: null,
      lastSyncedAt: new Date().toISOString(),
      assignedWards: [],
      createdAt: '',
      updatedAt: '',
    })

    await expect(syncPendingEnrollments(owner)).rejects.toThrow('Temporary report failure')
    expect((await offlineDb.syncState.get(owner))?.needsReport).toBe(true)
    expect(await offlineDb.enrollments.where('ownerUserId').equals(owner).count()).toBe(1)
    expect(await offlineDb.files.where('ownerUserId').equals(owner).count()).toBe(2)
    await syncPendingEnrollments(owner)

    expect(mocks.createHouseholdEnrollment).toHaveBeenCalledOnce()
    expect(mocks.reportDeviceSync).toHaveBeenCalledTimes(2)
    expect((await offlineDb.syncState.get(owner))?.needsReport).toBe(false)
    expect(await offlineDb.enrollments.where('ownerUserId').equals(owner).count()).toBe(0)
    expect(await offlineDb.files.where('ownerUserId').equals(owner).count()).toBe(0)
    expect(await offlineDb.enrollments.get(queued[0].localId)).toBeUndefined()
  })

  it('removes a legacy synced record when no final report is owed', async () => {
    const queued = await queueHousehold('Legacy', '01900000-0000-7000-8000-000000000088', 'BAR-TAF-001')
    await offlineDb.enrollments.update(queued[0].localId, { syncStatus: 'synced' })
    await syncPendingEnrollments(owner)
    expect(await offlineDb.enrollments.get(queued[0].localId)).toBeUndefined()
    expect(mocks.createHouseholdEnrollment).not.toHaveBeenCalled()
  })

  it('marks legacy individual records as unsupported', async () => {
    await offlineDb.enrollments.put({
      localId: '01900000-0000-7000-8000-000000000077',
      ownerUserId: owner,
      idempotencyId: '01900000-0000-7000-8000-000000000077',
      capturedAt: new Date().toISOString(),
      form: completeMember('Legacy').form,
      wardName: 'Ward',
      facilityName: 'Facility',
      syncStatus: 'pending',
      uploadStage: 'queued',
      attemptCount: 0,
    })

    await syncPendingEnrollments(owner)

    const record = await offlineDb.enrollments.get('01900000-0000-7000-8000-000000000077')
    expect(record?.syncStatus).toBe('failed')
    expect(record?.errorCode).toBe('UNSUPPORTED_ENROLLMENT')
    expect(mocks.createHouseholdEnrollment).not.toHaveBeenCalled()
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
