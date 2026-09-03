import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { version as uuidVersion } from 'uuid'

import { offlineDb } from '@/lib/offline-db'

import type { EnrollmentFormValues } from '../types'
import { EMPTY_ENROLLMENT_FORM, getEnrollmentHomeSummary, isValidNin, isValidPhoneNumber, normalizeNin, normalizePhoneNumber, toCreateEnrollmentPayload } from '../utils'
import {
  createEnrollmentDraft,
  queueEnrollment,
  removeSyncedEnrollments,
  replaceReferenceData,
  restoreFailedEnrollmentAsDraft,
  saveEnrollmentDraft,
  saveEnrollmentFile,
} from './offline-enrollment.service'

const owner = '01900000-0000-7000-8000-000000000001'

function completeForm(): EnrollmentFormValues {
  return {
    ...EMPTY_ENROLLMENT_FORM,
    category: 'IDPs', passportFileId: 'passport-file', passportName: 'passport.jpg',
    idDocumentFileId: 'id-file', idDocumentName: 'id.pdf', title: 'mrs', firstName: 'Amina',
    lastName: 'Yusuf', gender: 'female', dateOfBirth: '1990-05-04', maritalStatus: 'married',
    phone: '+2348012345678', lgaOfResidence: 'Jos North', residentialAddress: '12 Test Road',
    wardId: '01900000-0000-7000-8000-000000000010', healthFacilityId: '01900000-0000-7000-8000-000000000020',
    idType: 'national_id', nextOfKinFullName: 'Test Person', emergencyPhone: '+2348098765432',
    nextOfKinRelationship: 'sibling',
  }
}

describe('offline enrollment storage', () => {
  beforeEach(async () => {
    await offlineDb.delete()
    await offlineDb.open()
  })
  afterAll(() => offlineDb.close())

  it('creates one durable draft with a UUID v7 idempotency key', async () => {
    const draft = await createEnrollmentDraft(owner)
    expect(uuidVersion(draft.idempotencyId)).toBe(7)
    expect((await offlineDb.drafts.get(owner))?.form.stateOfResidence).toBe('PLATEAU')
  })

  it('stores a selected file as a Blob scoped to the worker and draft', async () => {
    const draft = await createEnrollmentDraft(owner)
    const file = new File(['photo'], 'passport.jpg', { type: 'image/jpeg' })
    const stored = await saveEnrollmentFile(owner, draft.idempotencyId, 'passport', file)
    expect(stored.size).toBe(5)
    expect((await offlineDb.files.get(stored.id))?.ownerUserId).toBe(owner)
  })

  it('atomically moves a completed draft into the outbox', async () => {
    const draft = await createEnrollmentDraft(owner)
    draft.form = completeForm()
    await saveEnrollmentDraft(draft)
    const queued = await queueEnrollment(draft, 'Tudun Wada', 'Tudun Wada PHC')
    expect(queued.syncStatus).toBe('pending')
    expect(await offlineDb.drafts.get(owner)).toBeUndefined()
    expect((await offlineDb.enrollments.get(queued.localId))?.wardName).toBe('Tudun Wada')
  })

  it('filters downloaded reference data to assigned wards', async () => {
    const wardId = completeForm().wardId
    await replaceReferenceData(owner, [wardId], [
      { id: wardId, name: 'Allowed', state: 'Plateau', lga: 'Jos North', status: 'active', createdAt: '', updatedAt: '' },
      { id: 'other', name: 'Hidden', state: 'Plateau', lga: 'Riyom', status: 'active', createdAt: '', updatedAt: '' },
    ], [
      { id: 'facility', name: 'Allowed PHC', lga: 'Jos North', type: 'PHC', level: 'primary', status: 'active', wardId, ward: { id: wardId, name: 'Allowed', lga: 'Jos North' }, createdAt: '', updatedAt: '' },
      { id: 'hidden-facility', name: 'Hidden PHC', lga: 'Riyom', type: 'PHC', level: 'primary', status: 'active', wardId: 'other', ward: { id: 'other', name: 'Hidden', lga: 'Riyom' }, createdAt: '', updatedAt: '' },
    ])
    expect((await offlineDb.wards.where('ownerUserId').equals(owner).toArray()).map((ward) => ward.name)).toEqual(['Allowed'])
    expect(await offlineDb.facilities.where('ownerUserId').equals(owner).count()).toBe(1)
  })

  it('removes synchronized records from the device', async () => {
    const draft = await createEnrollmentDraft(owner)
    draft.form = completeForm()
    const queued = await queueEnrollment(draft, 'Ward', 'Facility')
    await offlineDb.enrollments.update(queued.localId, { syncStatus: 'synced' })
    await removeSyncedEnrollments(owner)
    expect(await offlineDb.enrollments.get(queued.localId)).toBeUndefined()
  })

  it('restores a failed outbox record as the active editable draft', async () => {
    const draft = await createEnrollmentDraft(owner)
    draft.form = completeForm()
    draft.passportObjectKey = 'already-uploaded-passport'
    const queued = await queueEnrollment(draft, 'Ward', 'Facility')
    await offlineDb.enrollments.update(queued.localId, { syncStatus: 'failed', errorMessage: 'Invalid phone' })

    await restoreFailedEnrollmentAsDraft(queued.localId)

    const restored = await offlineDb.drafts.get(owner)
    expect(restored?.form.firstName).toBe('Amina')
    expect(restored?.passportObjectKey).toBe('already-uploaded-passport')
    expect(await offlineDb.enrollments.get(queued.localId)).toBeUndefined()
  })

  it('does not overwrite an unfinished draft when editing a failed record', async () => {
    const first = await createEnrollmentDraft(owner)
    first.form = completeForm()
    const queued = await queueEnrollment(first, 'Ward', 'Facility')
    await offlineDb.enrollments.update(queued.localId, { syncStatus: 'failed' })
    const active = await createEnrollmentDraft(owner)
    active.form.firstName = 'New draft'
    await saveEnrollmentDraft(active)

    await expect(restoreFailedEnrollmentAsDraft(queued.localId)).rejects.toThrow('current enrollment draft')
    expect((await offlineDb.drafts.get(owner))?.form.firstName).toBe('New draft')
    expect(await offlineDb.enrollments.get(queued.localId)).toBeDefined()
  })

  it('maps optional empty fields out of the production create payload', () => {
    const payload = toCreateEnrollmentPayload({
      localId: 'local', ownerUserId: owner, idempotencyId: '01900000-0000-7000-8000-000000000099',
      capturedAt: '2026-09-02T12:00:00.000Z', form: completeForm(), wardName: 'Ward', facilityName: 'Facility',
      syncStatus: 'pending', uploadStage: 'queued', passportObjectKey: 'passport-key', idDocumentObjectKey: 'id-key', attemptCount: 0,
    })
    expect(payload).not.toHaveProperty('email')
    expect(payload).not.toHaveProperty('bloodGroup')
    expect(payload.category).toBe('IDPs')
    expect(payload.phone).toBe('08012345678')
    expect(payload.emergencyPhone).toBe('08098765432')
    expect(payload.stateOfResidence).toBe('PLATEAU')
  })

  it('rejects invalid phone and NIN values in older queued records', () => {
    const base = {
      localId: 'local', ownerUserId: owner, idempotencyId: '01900000-0000-7000-8000-000000000099',
      capturedAt: '2026-09-02T12:00:00.000Z', wardName: 'Ward', facilityName: 'Facility',
      syncStatus: 'pending' as const, uploadStage: 'queued' as const,
      passportObjectKey: 'passport-key', idDocumentObjectKey: 'id-key', attemptCount: 0,
    }
    expect(() => toCreateEnrollmentPayload({ ...base, form: { ...completeForm(), phone: '0801234' } })).toThrow('exactly 11 digits')
    expect(() => toCreateEnrollmentPayload({ ...base, form: { ...completeForm(), nin: '12345678901' } })).toThrow('exactly 10 digits')
  })

  it('normalizes local and international Nigerian phone input', () => {
    expect(normalizePhoneNumber('0801 abc 234-5678')).toBe('08012345678')
    expect(normalizePhoneNumber('+234 801 234 5678')).toBe('08012345678')
    expect(normalizePhoneNumber('08012345678999')).toBe('08012345678')
    expect(isValidPhoneNumber('08012345678')).toBe(true)
    expect(isValidPhoneNumber('0801234')).toBe(false)
  })

  it('keeps NIN optional but requires exactly 10 digits when supplied', () => {
    expect(normalizeNin('12 34-ab56-7890')).toBe('1234567890')
    expect(normalizeNin('123456789012')).toBe('1234567890')
    expect(isValidNin('')).toBe(true)
    expect(isValidNin('1234567890')).toBe(true)
    expect(isValidNin('123456789')).toBe(false)
  })

  it('combines server statistics with unsent device records without counting synced rows twice', async () => {
    const pendingDraft = await createEnrollmentDraft(owner)
    pendingDraft.form = completeForm()
    const pending = await queueEnrollment(pendingDraft, 'Ward', 'Facility')
    const syncedDraft = await createEnrollmentDraft(owner)
    syncedDraft.form = { ...completeForm(), firstName: 'Already' }
    const synced = await queueEnrollment(syncedDraft, 'Ward', 'Facility')
    await offlineDb.enrollments.update(synced.localId, { syncStatus: 'synced' })
    const records = (await offlineDb.enrollments.bulkGet([pending.localId, synced.localId])).filter((record) => record !== undefined)

    expect(getEnrollmentHomeSummary(records, {
      totalEnrolled: 10, enrollmentsToday: 3, enrollmentsThisMonth: 7,
      lastEnrollmentAt: null, lastSyncedAt: null,
    }, new Date(pending.capturedAt))).toEqual({ pending: 1, today: 4, total: 11 })
  })

  it('uses the Africa/Lagos calendar day for local Today counts', () => {
    const record = {
      localId: 'local', ownerUserId: owner, idempotencyId: 'key', capturedAt: '2026-09-01T23:30:00.000Z',
      form: completeForm(), wardName: 'Ward', facilityName: 'Facility', syncStatus: 'pending' as const,
      uploadStage: 'queued' as const, attemptCount: 0,
    }
    expect(getEnrollmentHomeSummary([record], undefined, new Date('2026-09-02T00:15:00.000Z')).today).toBe(1)
  })
})
