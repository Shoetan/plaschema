import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { offlineDb } from '@/lib/offline-db'

import type { EnrollmentFormValues, ReferenceFacility, ReferenceWard } from '../types'
import { EMPTY_ENROLLMENT_FORM, getEnrollmentGeographyAccess, getEnrollmentHomeSummary, getResidenceLgas, getResidenceWardsForForm, isValidNin, isValidPhoneNumber, normalizeEnrollmentForm, normalizeNin, normalizePhoneNumber, resolveHealthFacilityId, resolveWardId } from '../utils'
import {
  removeSyncedEnrollments,
  replaceReferenceData,
  saveEnrollmentFile,
} from './offline-enrollment.service'

const owner = '01900000-0000-7000-8000-000000000001'

function completeForm(): EnrollmentFormValues {
  return {
    ...EMPTY_ENROLLMENT_FORM,
    category: 'IDPs', passportFileId: 'passport-file', passportName: 'passport.jpg',
    idDocumentFileId: 'id-file', idDocumentName: 'id.pdf', title: 'mrs', firstName: 'Amina',
    lastName: 'Yusuf', gender: 'female', dateOfBirth: '1990-05-04', maritalStatus: 'married',
    phone: '+2348012345678', nin: '1234567890', lgaOfResidence: 'Jos North', residentialAddress: '12 Test Road',
    wardId: '01900000-0000-7000-8000-000000000010', healthFacilityId: '01900000-0000-7000-8000-000000000020',
    idType: 'national_id',
  }
}

describe('offline enrollment storage', () => {
  beforeEach(async () => {
    await offlineDb.delete()
    await offlineDb.open()
  })
  afterAll(() => offlineDb.close())

  it('stores a selected file as a Blob scoped to the worker and enrollment', async () => {
    const enrollmentLocalId = '01900000-0000-7000-8000-000000000099'
    const file = new File(['photo'], 'passport.jpg', { type: 'image/jpeg' })
    const stored = await saveEnrollmentFile(owner, enrollmentLocalId, 'passport', file)
    expect(stored.size).toBe(5)
    expect((await offlineDb.files.get(stored.id))?.ownerUserId).toBe(owner)
  })

  it('filters downloaded reference data to assigned wards', async () => {
    const wardId = completeForm().wardId
    await replaceReferenceData(owner, [wardId], [
      { id: wardId, name: 'Allowed', state: 'Plateau', lga: 'Jos North', code: 'JON-001', status: 'active', createdAt: '', updatedAt: '' },
      { id: 'other', name: 'Hidden', state: 'Plateau', lga: 'Riyom', code: 'RIY-001', status: 'active', createdAt: '', updatedAt: '' },
    ], [
      { id: 'facility', name: 'Allowed PHC', lga: 'Jos North', type: 'PHC', level: 'primary', status: 'active', wardId, ward: { id: wardId, name: 'Allowed', lga: 'Jos North' }, createdAt: '', updatedAt: '' },
      { id: 'hidden-facility', name: 'Hidden PHC', lga: 'Riyom', type: 'PHC', level: 'primary', status: 'active', wardId: 'other', ward: { id: 'other', name: 'Hidden', lga: 'Riyom' }, createdAt: '', updatedAt: '' },
    ])
    expect((await offlineDb.wards.where('ownerUserId').equals(owner).toArray()).map((ward) => ward.name)).toEqual(['Allowed'])
    expect(await offlineDb.facilities.where('ownerUserId').equals(owner).count()).toBe(1)
  })

  it('removes synchronized records from the device', async () => {
    const localId = '01900000-0000-7000-8000-000000000099'
    await offlineDb.enrollments.put({
      localId,
      ownerUserId: owner,
      idempotencyId: localId,
      capturedAt: new Date().toISOString(),
      form: completeForm(),
      wardName: 'Ward',
      facilityName: 'Facility',
      syncStatus: 'synced',
      uploadStage: 'complete',
      attemptCount: 0,
      householdLocalId: '01900000-0000-7000-8000-000000000088',
      householdCode: 'BAR-TAF-001',
      householdRole: 'head',
    })
    await removeSyncedEnrollments(owner)
    expect(await offlineDb.enrollments.get(localId)).toBeUndefined()
  })

  it('normalizes legacy forms missing optional fields added later', () => {
    const legacy = { ...completeForm() }
    delete (legacy as Partial<typeof legacy>).emergencyPhone
    delete (legacy as Partial<typeof legacy>).nin

    expect(normalizeEnrollmentForm(legacy as typeof legacy)).toMatchObject({
      emergencyPhone: '',
      nin: '',
      phone: '08012345678',
    })
  })

  it('normalizes local and international Nigerian phone input', () => {
    expect(normalizePhoneNumber('0801 abc 234-5678')).toBe('08012345678')
    expect(normalizePhoneNumber('+234 801 234 5678')).toBe('08012345678')
    expect(normalizePhoneNumber('08012345678999')).toBe('08012345678')
    expect(isValidPhoneNumber('08012345678')).toBe(true)
    expect(isValidPhoneNumber('0801234')).toBe(false)
  })

  it('requires NIN to contain exactly 10 digits', () => {
    expect(normalizeNin('12 34-ab56-7890')).toBe('1234567890')
    expect(normalizeNin('123456789012')).toBe('1234567890')
    expect(isValidNin('')).toBe(false)
    expect(isValidNin('1234567890')).toBe(true)
    expect(isValidNin('123456789')).toBe(false)
  })

  it('automatically chooses only an unambiguous active facility for a ward', () => {
    const wardId = 'ward'
    const facility = (id: string, status: 'active' | 'inactive' = 'active'): ReferenceFacility => ({
      key: id, ownerUserId: owner, id, name: id, lga: 'Jos North', type: 'PHC', level: 'primary', status,
      wardId, ward: { id: wardId, name: 'Ward', lga: 'Jos North' }, createdAt: '', updatedAt: '',
    })
    const first = facility('first')
    const second = facility('second')

    expect(resolveHealthFacilityId(wardId, '', [first])).toBe('first')
    expect(resolveHealthFacilityId(wardId, '', [first, second])).toBe('')
    expect(resolveHealthFacilityId(wardId, 'second', [first, second])).toBe('second')
    expect(resolveHealthFacilityId(wardId, 'first', [facility('first', 'inactive')])).toBe('')
  })

  it('scopes enrollment geography to assigned wards or all LGAs when unrestricted', () => {
    const ward = (id: string, lga: string): ReferenceWard => ({
      key: id, ownerUserId: owner, id, name: id, code: `${lga.slice(0, 3).toUpperCase()}-${id.slice(0, 3).toUpperCase()}`, state: 'Plateau', lga, status: 'active', createdAt: '', updatedAt: '',
    })
    const first = ward('first', 'Jos North')
    const second = ward('second', 'Jos North')
    const third = ward('third', 'Riyom')

    const unrestricted = getEnrollmentGeographyAccess([], [first, second, third])
    expect(unrestricted.lockLga).toBe(false)
    expect(unrestricted.lockWard).toBe(false)
    expect(unrestricted.lgas).toEqual(['Jos North', 'Riyom'])
    expect(getResidenceWardsForForm(unrestricted, 'Riyom')).toEqual([third])

    const singleAssignment = getEnrollmentGeographyAccess([{ id: 'third', lga: 'Riyom' }], [first, second, third])
    expect(singleAssignment).toMatchObject({ fixedLga: 'Riyom', lockLga: true, lockWard: true, selectableWards: [third] })

    const multiAssignment = getEnrollmentGeographyAccess(
      [{ id: 'first', lga: 'Jos North' }, { id: 'second', lga: 'Jos North' }],
      [first, second, third],
    )
    expect(multiAssignment).toMatchObject({ fixedLga: 'Jos North', lockLga: true, lockWard: false, selectableWards: [first, second] })
  })

  it('derives LGAs from active accessible wards and selects only an unambiguous ward', () => {
    const ward = (id: string, lga: string, status: 'active' | 'inactive' = 'active'): ReferenceWard => ({
      key: id, ownerUserId: owner, id, name: id, code: `${lga.slice(0, 3).toUpperCase()}-${id.slice(0, 3).toUpperCase()}`, state: 'Plateau', lga, status, createdAt: '', updatedAt: '',
    })
    const first = ward('first', 'Jos North')
    const second = ward('second', 'Jos North')
    const third = ward('third', 'Riyom')

    expect(getResidenceLgas([third, first, second, ward('hidden', 'Bassa', 'inactive')])).toEqual(['Jos North', 'Riyom'])
    expect(resolveWardId('Riyom', '', [first, second, third])).toBe('third')
    expect(resolveWardId('Jos North', '', [first, second, third])).toBe('')
    expect(resolveWardId('Jos North', 'second', [first, second, third])).toBe('second')
    expect(resolveWardId('Bassa', 'first', [first, second, third])).toBe('')
  })

  it('combines server statistics with unsent device records without counting synced rows twice', async () => {
    const capturedAt = new Date().toISOString()
    const pendingId = '01900000-0000-7000-8000-000000000101'
    const syncedId = '01900000-0000-7000-8000-000000000102'
    await offlineDb.enrollments.bulkPut([
      {
        localId: pendingId,
        ownerUserId: owner,
        idempotencyId: pendingId,
        capturedAt,
        form: completeForm(),
        wardName: 'Ward',
        facilityName: 'Facility',
        syncStatus: 'pending',
        uploadStage: 'queued',
        attemptCount: 0,
        householdLocalId: '01900000-0000-7000-8000-000000000088',
        householdCode: 'BAR-TAF-001',
        householdRole: 'head',
      },
      {
        localId: syncedId,
        ownerUserId: owner,
        idempotencyId: syncedId,
        capturedAt,
        form: { ...completeForm(), firstName: 'Already' },
        wardName: 'Ward',
        facilityName: 'Facility',
        syncStatus: 'synced',
        uploadStage: 'complete',
        attemptCount: 0,
        householdLocalId: '01900000-0000-7000-8000-000000000089',
        householdCode: 'BAR-TAF-002',
        householdRole: 'head',
      },
    ])
    const records = (await offlineDb.enrollments.bulkGet([pendingId, syncedId])).filter((record) => record !== undefined)

    expect(getEnrollmentHomeSummary(records, {
      totalEnrolled: 10, enrollmentsToday: 3, enrollmentsThisMonth: 7,
      lastEnrollmentAt: null, lastSyncedAt: null,
    }, new Date(capturedAt))).toEqual({ pending: 1, today: 4, total: 11 })
  })

  it('uses the Africa/Lagos calendar day for local Today counts', () => {
    const record = {
      localId: 'local', ownerUserId: owner, idempotencyId: 'key', capturedAt: '2026-09-01T23:30:00.000Z',
      form: completeForm(), wardName: 'Ward', facilityName: 'Facility', syncStatus: 'pending' as const,
      uploadStage: 'queued' as const, attemptCount: 0,
      householdLocalId: '01900000-0000-7000-8000-000000000088',
      householdCode: 'BAR-TAF-001',
      householdRole: 'head' as const,
    }
    expect(getEnrollmentHomeSummary([record], undefined, new Date('2026-09-02T00:15:00.000Z')).today).toBe(1)
  })
})
