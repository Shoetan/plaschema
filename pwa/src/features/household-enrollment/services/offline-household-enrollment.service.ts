import { v7 as uuidv7 } from 'uuid'

import type {
  CachedHouseholdRecord,
  CreateHouseholdEnrollmentPayload,
  HouseholdDraftMember,
  HouseholdDraftRecord,
  LocalEnrollmentRecord,
  ReferenceWard,
} from '@/features/enrollment/types'
import { EMPTY_ENROLLMENT_FORM, hasDraftProgress, normalizeEnrollmentForm } from '@/features/enrollment/utils'
import { offlineDb } from '@/lib/offline-db'

import { formatHouseholdCode } from '../utils/household-code'

const HOUSEHOLD_DRAFT_KEY = 'household'

export async function allocateHouseholdCode(ownerUserId: string, ward: ReferenceWard) {
  const key = `${ownerUserId}:${ward.id}`
  return offlineDb.transaction('rw', offlineDb.householdCounters, async () => {
    const existing = await offlineDb.householdCounters.get(key)
    const nextValue = (existing?.lastValue ?? 0) + 1
    await offlineDb.householdCounters.put({
      key,
      ownerUserId,
      wardId: ward.id,
      lastValue: nextValue,
    })
    return formatHouseholdCode(ward.code, nextValue)
  })
}

export async function createHouseholdDraft(ownerUserId: string, ward: ReferenceWard, sharedResidentialAddress = '') {
  const now = new Date().toISOString()
  const householdCode = await allocateHouseholdCode(ownerUserId, ward)
  const draft: HouseholdDraftRecord = {
    ownerUserId,
    householdLocalId: uuidv7(),
    householdCode,
    wardId: ward.id,
    sharedResidentialAddress,
    head: null,
    members: [],
    phase: 'setup',
    headStep: 0,
    memberStep: 0,
    activeMemberIndex: 0,
    createdAt: now,
    updatedAt: now,
  }
  await offlineDb.householdDrafts.put(draft)
  return draft
}

export async function saveHouseholdDraft(draft: HouseholdDraftRecord) {
  await offlineDb.householdDrafts.put({ ...draft, updatedAt: new Date().toISOString() })
}

export async function discardHouseholdDraft(ownerUserId: string) {
  const draft = await offlineDb.householdDrafts.get(ownerUserId)
  if (!draft) return
  const localIds = [
    ...(draft.head ? [draft.head.idempotencyId] : []),
    ...draft.members.map((member) => member.idempotencyId),
  ]
  await offlineDb.transaction('rw', offlineDb.householdDrafts, offlineDb.files, async () => {
    await offlineDb.householdDrafts.delete(ownerUserId)
    if (localIds.length > 0) {
      await offlineDb.files.where('enrollmentLocalId').anyOf(localIds).delete()
    }
  })
}

export function createHouseholdMemberDraft(sharedResidentialAddress: string, wardId: string): HouseholdDraftMember {
  return {
    idempotencyId: uuidv7(),
    form: {
      ...EMPTY_ENROLLMENT_FORM,
      residentialAddress: sharedResidentialAddress,
      wardId,
    },
    passportFileId: '',
    passportName: '',
    idDocumentFileId: '',
    idDocumentName: '',
  }
}

export async function queueHouseholdDraft(
  draft: HouseholdDraftRecord,
  wardName: string,
  facilityNames: Map<string, string>,
) {
  const capturedAt = new Date().toISOString()
  const queued: LocalEnrollmentRecord[] = []
  const entries: Array<{ member: HouseholdDraftMember; role: 'head' | 'member'; order: number }> = []
  if (draft.head) entries.push({ member: draft.head, role: 'head', order: 0 })
  draft.members.forEach((member, index) => entries.push({ member, role: 'member', order: index + 1 }))

  await offlineDb.transaction('rw', offlineDb.householdDrafts, offlineDb.enrollments, offlineDb.households, async () => {
    for (const entry of entries) {
      const record: LocalEnrollmentRecord = {
        localId: entry.member.idempotencyId,
        ownerUserId: draft.ownerUserId,
        idempotencyId: entry.member.idempotencyId,
        capturedAt,
        form: normalizeEnrollmentForm(entry.member.form),
        wardName,
        facilityName: facilityNames.get(entry.member.form.healthFacilityId) ?? 'Unknown facility',
        syncStatus: 'pending',
        uploadStage: 'queued',
        passportObjectKey: entry.member.passportObjectKey,
        idDocumentObjectKey: entry.member.idDocumentObjectKey,
        attemptCount: 0,
        householdLocalId: draft.householdLocalId,
        householdCode: draft.householdCode,
        householdRole: entry.role,
        localMemberOrder: entry.order,
      }
      await offlineDb.enrollments.put(record)
      queued.push(record)
    }

    await offlineDb.households.put({
      key: `${draft.ownerUserId}:${draft.householdLocalId}`,
      ownerUserId: draft.ownerUserId,
      householdLocalId: draft.householdLocalId,
      householdCode: draft.householdCode,
      wardId: draft.wardId,
      wardName,
      headName: draft.head
        ? [draft.head.form.firstName, draft.head.form.lastName].filter(Boolean).join(' ')
        : null,
      memberCount: draft.members.length,
      residentialAddress: draft.sharedResidentialAddress || null,
      updatedAt: capturedAt,
    })
    await offlineDb.householdDrafts.delete(draft.ownerUserId)
  })

  return queued
}

export async function queueLateHouseholdMember(
  ownerUserId: string,
  household: CachedHouseholdRecord,
  member: HouseholdDraftMember,
  wardName: string,
  facilityName: string,
) {
  const capturedAt = new Date().toISOString()
  const pendingCount = await offlineDb.enrollments
    .where('ownerUserId')
    .equals(ownerUserId)
    .filter((record) =>
      record.householdLocalId === household.householdLocalId
      && record.householdRole === 'member'
      && record.syncStatus !== 'synced',
    )
    .count()

  const record: LocalEnrollmentRecord = {
    localId: member.idempotencyId,
    ownerUserId,
    idempotencyId: member.idempotencyId,
    capturedAt,
    form: normalizeEnrollmentForm(member.form),
    wardName,
    facilityName,
    syncStatus: 'pending',
    uploadStage: 'queued',
    passportObjectKey: member.passportObjectKey,
    idDocumentObjectKey: member.idDocumentObjectKey,
    attemptCount: 0,
    householdLocalId: household.householdLocalId,
    householdId: household.id,
    householdCode: household.householdCode,
    householdRole: 'member',
    localMemberOrder: household.memberCount + pendingCount + 1,
  }

  await offlineDb.enrollments.put(record)
  return record
}

export function toCreateHouseholdEnrollmentPayload(record: LocalEnrollmentRecord): CreateHouseholdEnrollmentPayload {
  if (!record.householdLocalId || !record.householdCode || !record.householdRole) {
    throw new Error('Household enrollment is missing required household metadata.')
  }
  const base = {
    idempotencyId: record.idempotencyId,
    capturedAt: record.capturedAt,
    category: record.form.category as CreateHouseholdEnrollmentPayload['category'],
    passportObjectKey: record.passportObjectKey!,
    idDocumentObjectKey: record.idDocumentObjectKey!,
    title: record.form.title as CreateHouseholdEnrollmentPayload['title'],
    gender: record.form.gender as CreateHouseholdEnrollmentPayload['gender'],
    firstName: record.form.firstName.trim(),
    lastName: record.form.lastName.trim(),
    ...(record.form.middleName.trim() ? { middleName: record.form.middleName.trim() } : {}),
    dateOfBirth: record.form.dateOfBirth,
    phone: record.form.phone,
    ...(record.form.email.trim() ? { email: record.form.email.trim() } : {}),
    maritalStatus: record.form.maritalStatus as CreateHouseholdEnrollmentPayload['maritalStatus'],
    ...(record.form.bloodGroup ? { bloodGroup: record.form.bloodGroup } : {}),
    ...(record.form.genotype ? { genotype: record.form.genotype } : {}),
    idType: record.form.idType as CreateHouseholdEnrollmentPayload['idType'],
    ...(record.form.emergencyPhone?.trim() ? { emergencyPhone: record.form.emergencyPhone.trim() } : {}),
    ...(record.form.idType === 'nin' && record.form.nin.trim() ? { nin: record.form.nin.trim() } : {}),
    stateOfResidence: 'PLATEAU' as const,
    lgaOfResidence: record.form.lgaOfResidence.trim(),
    residentialAddress: record.form.residentialAddress.trim(),
    wardId: record.form.wardId,
    healthFacilityId: record.form.healthFacilityId,
    household: {
      householdLocalId: record.householdLocalId,
      householdCode: record.householdCode,
      role: record.householdRole,
      ...(record.householdId ? { householdId: record.householdId } : {}),
      ...(record.householdRole === 'head' ? { sharedResidentialAddress: record.form.residentialAddress.trim() } : {}),
    },
  }
  return base
}

export const householdDraftStorageKey = HOUSEHOLD_DRAFT_KEY

export function hasHouseholdDraftProgress(draft: HouseholdDraftRecord) {
  if (draft.head && hasDraftProgress(draft.head.form)) return true
  if (draft.members.some((member) => hasDraftProgress(member.form))) return true
  return draft.phase !== 'setup' && Boolean(draft.wardId)
}
