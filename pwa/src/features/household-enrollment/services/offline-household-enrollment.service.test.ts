import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { EMPTY_ENROLLMENT_FORM } from '@/features/enrollment/utils'
import { offlineDb } from '@/lib/offline-db'

import { createHouseholdMemberDraft, queueHouseholdDraft } from './offline-household-enrollment.service'

const owner = '01900000-0000-7000-8000-000000000001'

function completeMember() {
  const member = createHouseholdMemberDraft('12 Test Road', '01900000-0000-7000-8000-000000000010')
  member.form = {
    ...EMPTY_ENROLLMENT_FORM,
    category: 'IDPs',
    passportFileId: 'passport-file',
    passportName: 'passport.jpg',
    idDocumentFileId: 'id-file',
    idDocumentName: 'id.pdf',
    title: 'mrs',
    firstName: 'Amina',
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

describe('offline household enrollment storage', () => {
  beforeEach(async () => {
    await offlineDb.delete()
    await offlineDb.open()
  })
  afterAll(() => offlineDb.close())

  it('queues legacy member forms that predate optional fields', async () => {
    const head = completeMember()
    const member = completeMember()
    member.form = { ...member.form, firstName: 'Member' }
    delete (member.form as Partial<typeof member.form>).emergencyPhone
    delete (member.form as Partial<typeof member.form>).nin

    const draft = {
      ownerUserId: owner,
      householdLocalId: '01900000-0000-7000-8000-000000000088',
      householdCode: 'BAR-TAF-002',
      wardId: '01900000-0000-7000-8000-000000000010',
      sharedResidentialAddress: '12 Test Road',
      head,
      members: [member],
      phase: 'review' as const,
      headStep: 5,
      memberStep: 0,
      activeMemberIndex: 1,
      createdAt: '2026-09-09T12:00:00.000Z',
      updatedAt: '2026-09-09T12:00:00.000Z',
    }

    await expect(queueHouseholdDraft(draft, 'Tafan B', new Map())).resolves.toHaveLength(2)
  })

  it('queues a household draft into pending enrollments and removes the draft', async () => {
    const head = completeMember()
    const member = completeMember()
    member.form.firstName = 'Member'
    const draft = {
      ownerUserId: owner,
      householdLocalId: '01900000-0000-7000-8000-000000000099',
      householdCode: 'BAR-TAF-001',
      wardId: '01900000-0000-7000-8000-000000000010',
      sharedResidentialAddress: '12 Test Road',
      head,
      members: [member],
      phase: 'review' as const,
      headStep: 5,
      memberStep: 0,
      activeMemberIndex: 1,
      createdAt: '2026-09-09T12:00:00.000Z',
      updatedAt: '2026-09-09T12:00:00.000Z',
    }
    await offlineDb.householdDrafts.put(draft)

    const queued = await queueHouseholdDraft(
      draft,
      'Tafan B',
      new Map([['01900000-0000-7000-8000-000000000020', 'Primary Health Care Bawan Dodo']]),
    )

    expect(queued).toHaveLength(2)
    expect(queued[0].householdRole).toBe('head')
    expect(queued[1].householdRole).toBe('member')
    expect(await offlineDb.householdDrafts.get(owner)).toBeUndefined()
    expect(await offlineDb.enrollments.count()).toBe(2)
    expect(await offlineDb.households.count()).toBe(1)
  })
})
