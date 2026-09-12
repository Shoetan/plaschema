import { ArrowLeft, Check, Plus } from 'lucide-react'
import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/stores/auth.store'
import {
  BackgroundStep,
  ContactStep,
  EnrollmentWizardHeader,
  enrollmentSteps,
  FacilityStep,
  nextEnrollmentWizardStep,
  PersonalStep,
  previousEnrollmentWizardStep,
  ResidenceStep,
  validateEnrollmentStep,
} from '@/features/enrollment/components/enrollment-form-steps'
import { useEnrollmentReferences, useHouseholdDraft, useReferenceSync } from '@/features/enrollment/hooks'
import { saveEnrollmentFile, removeEnrollmentFile } from '@/features/enrollment/services'
import type { HouseholdDraftMember, HouseholdDraftRecord } from '@/features/enrollment/types'
import {
  EMPTY_ENROLLMENT_FORM,
  getEnrollmentGeographyAccess,
  getResidenceWardsForForm,
  isWardFacilityLocked,
  normalizeEnrollmentForm,
  resolveHealthFacilityId,
  resolveWardId,
} from '@/features/enrollment/utils'
import { hasStorageCapacity, requestPersistentStorage } from '@/lib/offline-db'

import {
  createHouseholdDraft,
  createHouseholdMemberDraft,
  discardHouseholdDraft,
  hasHouseholdDraftProgress,
  queueHouseholdDraft,
  saveHouseholdDraft,
} from '../services/offline-household-enrollment.service'
import { HouseholdMemberReviewCard, HouseholdMemberReviewStep } from './household-review-ui'

function hydrateHouseholdDraft(draft: HouseholdDraftRecord): HouseholdDraftRecord {
  return {
    ...draft,
    head: draft.head
      ? { ...draft.head, form: normalizeEnrollmentForm({ ...EMPTY_ENROLLMENT_FORM, ...draft.head.form }) }
      : draft.head,
    members: draft.members.map((member) => ({
      ...member,
      form: normalizeEnrollmentForm({ ...EMPTY_ENROLLMENT_FORM, ...member.form }),
    })),
  }
}

export function HouseholdEnrollmentView() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)!
  const storedHouseholdDraft = useHouseholdDraft(user.id)
  const { wards, facilities } = useEnrollmentReferences(user.id)
  const referenceSync = useReferenceSync()
  const [draft, setDraft] = useState<HouseholdDraftRecord | null>(null)
  const [restoreResolved, setRestoreResolved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveMessage, setSaveMessage] = useState('')
  const [isQueueing, setIsQueueing] = useState(false)
  const [queueError, setQueueError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => { void requestPersistentStorage() }, [])

  useEffect(() => {
    if (!draft || isQueueing || done || draft.phase === 'review') return
    setSaveMessage('Saving…')
    const timer = window.setTimeout(() => void saveHouseholdDraft(draft).then(() => setSaveMessage('Saved on this device')), 400)
    return () => window.clearTimeout(timer)
  }, [draft, done, isQueueing])

  useEffect(() => {
    if (!draft?.wardId || facilities.length === 0) return
    setDraft((current) => {
      if (!current?.wardId) return current
      const syncMember = (member: HouseholdDraftMember) => {
        const healthFacilityId = resolveHealthFacilityId(current.wardId, member.form.healthFacilityId, facilities)
        if (healthFacilityId === member.form.healthFacilityId) return member
        return { ...member, form: { ...member.form, healthFacilityId } }
      }
      const head = current.head ? syncMember(current.head) : current.head
      const members = current.members.map(syncMember)
      if (head === current.head && members.every((member, index) => member === current.members[index])) return current
      return { ...current, head, members }
    })
  }, [draft?.wardId, facilities])

  const activeWards = useMemo(() => wards.filter((ward) => ward.status === 'active').sort((a, b) => a.name.localeCompare(b.name)), [wards])
  const geography = useMemo(
    () => getEnrollmentGeographyAccess(user.assignedWards, activeWards),
    [activeWards, user.assignedWards],
  )
  const selectedWard = activeWards.find((ward) => ward.id === draft?.wardId)
  const activeMember = draft?.phase === 'head' ? draft.head : draft?.members[draft.activeMemberIndex]
  const step = draft?.phase === 'head' ? draft.headStep : draft?.memberStep ?? 0
  const activeFacilities = useMemo(() => facilities.filter((facility) => facility.status === 'active' && facility.wardId === draft?.wardId), [draft?.wardId, facilities])
  const facilityLocked = draft?.wardId ? isWardFacilityLocked(draft.wardId, facilities) : false
  const sharedAddress = draft?.head?.form.residentialAddress.trim() || draft?.sharedResidentialAddress || ''

  function withWardDefaults(member: HouseholdDraftMember, wardId: string, lga: string) {
    member.form.lgaOfResidence = lga
    member.form.healthFacilityId = resolveHealthFacilityId(wardId, member.form.healthFacilityId, facilities)
    return member
  }

  function applySharedAddress(current: HouseholdDraftRecord, address: string): HouseholdDraftRecord {
    return {
      ...current,
      sharedResidentialAddress: address,
      head: current.head ? { ...current.head, form: { ...current.head.form, residentialAddress: address } } : current.head,
      members: current.members.map((member) => ({
        ...member,
        form: { ...member.form, residentialAddress: address },
      })),
    }
  }

  function updateMember(member: HouseholdDraftMember, name: keyof HouseholdDraftMember['form'], value: string) {
    setDraft((current) => {
      if (!current || !member) return current
      const nextForm = { ...member.form, [name]: value }
      if (name === 'lgaOfResidence') {
        nextForm.wardId = resolveWardId(value, nextForm.wardId, geography.selectableWards)
        nextForm.healthFacilityId = resolveHealthFacilityId(nextForm.wardId, '', facilities)
      }
      if (name === 'wardId') {
        const ward = geography.selectableWards.find((item) => item.id === value)
        if (ward) nextForm.lgaOfResidence = ward.lga
        nextForm.healthFacilityId = resolveHealthFacilityId(value, '', facilities)
      }
      nextForm.lgaOfResidence = selectedWard?.lga || nextForm.lgaOfResidence
      if (current.phase === 'head' && current.head) {
        const next = { ...current, head: { ...current.head, form: nextForm } }
        return name === 'residentialAddress' ? applySharedAddress(next, value) : next
      }
      const members = [...current.members]
      members[current.activeMemberIndex] = { ...member, form: nextForm }
      return { ...current, members }
    })
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  async function handleFile(member: HouseholdDraftMember, purpose: 'passport' | 'id_document', event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !draft) return
    if (!await hasStorageCapacity(file.size)) return
    const stored = await saveEnrollmentFile(user.id, member.idempotencyId, purpose, file)
    setDraft((current) => {
      if (!current) return current
      const patch = {
        passportObjectKey: undefined,
        idDocumentObjectKey: undefined,
        form: {
          ...member.form,
          passportFileId: purpose === 'passport' ? stored.id : member.form.passportFileId,
          passportName: purpose === 'passport' ? stored.name : member.form.passportName,
          idDocumentFileId: purpose === 'id_document' ? stored.id : member.form.idDocumentFileId,
          idDocumentName: purpose === 'id_document' ? stored.name : member.form.idDocumentName,
        },
      }
      if (current.phase === 'head' && current.head) return { ...current, head: { ...current.head, ...patch } }
      const members = [...current.members]
      members[current.activeMemberIndex] = { ...member, ...patch }
      return { ...current, members }
    })
  }

  async function clearFile(member: HouseholdDraftMember, purpose: 'passport' | 'id_document') {
    await removeEnrollmentFile(member.idempotencyId, purpose)
    setDraft((current) => {
      if (!current) return current
      const patch = {
        passportObjectKey: undefined,
        idDocumentObjectKey: undefined,
        form: {
          ...member.form,
          passportFileId: purpose === 'passport' ? '' : member.form.passportFileId,
          passportName: purpose === 'passport' ? '' : member.form.passportName,
          idDocumentFileId: purpose === 'id_document' ? '' : member.form.idDocumentFileId,
          idDocumentName: purpose === 'id_document' ? '' : member.form.idDocumentName,
        },
      }
      if (current.phase === 'head' && current.head) return { ...current, head: { ...current.head, ...patch } }
      const members = [...current.members]
      members[current.activeMemberIndex] = { ...member, ...patch }
      return { ...current, members }
    })
  }

  async function startHousehold(wardId: string) {
    const ward = activeWards.find((item) => item.id === wardId)
    if (!ward?.code) return
    const created = await createHouseholdDraft(user.id, ward, '')
    const lga = ward.lga
    const head = withWardDefaults(createHouseholdMemberDraft('', ward.id), ward.id, lga)
    setDraft({ ...created, head, phase: 'head', headStep: 0 })
  }

  function continueMemberFlow() {
    if (!draft || !activeMember) return
    const nextErrors = validateEnrollmentStep(activeMember.form, step)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    if (step < enrollmentSteps.length - 1) {
      const nextStep = nextEnrollmentWizardStep(step, facilityLocked)
      setDraft((current) => {
        if (!current) return current
        return current.phase === 'head'
          ? { ...current, headStep: nextStep }
          : { ...current, memberStep: nextStep }
      })
      return
    }
    if (draft.phase === 'head') {
      setDraft({ ...draft, phase: 'members', memberStep: 0, activeMemberIndex: draft.members.length })
      return
    }
    setDraft({ ...draft, phase: 'members', memberStep: 0, activeMemberIndex: draft.members.length })
  }

  function editHead() {
    if (!draft) return
    setErrors({})
    setDraft({ ...draft, phase: 'head', headStep: 0 })
  }

  function editMemberAt(index: number) {
    if (!draft) return
    setErrors({})
    setDraft({ ...draft, phase: 'members', activeMemberIndex: index, memberStep: 0 })
  }

  function editActiveMember() {
    if (!draft) return
    if (draft.phase === 'head') editHead()
    else editMemberAt(draft.activeMemberIndex)
  }

  function goBackInWizard() {
    if (!draft) return
    if (draft.phase === 'head' || draft.phase === 'members') {
      const currentStep = draft.phase === 'head' ? draft.headStep : draft.memberStep
      if (currentStep === 0) {
        if (draft.phase === 'members') {
          setDraft({ ...draft, activeMemberIndex: draft.members.length, memberStep: 0 })
          setErrors({})
          return
        }
        navigate(-1)
        return
      }
      const previousStep = previousEnrollmentWizardStep(currentStep, facilityLocked)
      setDraft((current) => {
        if (!current) return current
        return current.phase === 'head'
          ? { ...current, headStep: previousStep }
          : { ...current, memberStep: previousStep }
      })
      setErrors({})
      return
    }
    navigate(-1)
  }

  async function startOver() {
    await discardHouseholdDraft(user.id)
    setDraft(null)
    setRestoreResolved(true)
    setErrors({})
  }

  async function queueAll() {
    if (!draft?.head) {
      setQueueError('Household head details are missing.')
      return
    }
    const ward = selectedWard ?? wards.find((item) => item.id === draft.wardId)
    if (!ward) {
      setQueueError('Ward information is missing. Download enrollment data and try again.')
      return
    }
    setQueueError('')
    setIsQueueing(true)
    try {
      const facilityNames = new Map(facilities.map((facility) => [facility.id, facility.name]))
      const readyDraft = applySharedAddress(hydrateHouseholdDraft(draft), draft.head.form.residentialAddress.trim())
      await queueHouseholdDraft(readyDraft, ward.name, facilityNames)
      setDone(true)
      setDraft(null)
      setRestoreResolved(false)
    } catch (error) {
      setQueueError(error instanceof Error ? error.message : 'Could not save household on this device.')
    } finally {
      setIsQueueing(false)
    }
  }

  if (done) {
    return <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-5 px-6 text-center"><span className="flex h-20 w-20 items-center justify-center rounded-full bg-success text-success-foreground"><Check size={42} /></span><div><h1 className="text-xl font-bold">Household saved on this device</h1><p className="mt-2 text-sm text-neutral-500">The head will sync first, then household members. Insurance IDs for members are assigned during sync.</p></div><Link className="primary-button w-full" to="/beneficiaries">View pending enrollments</Link></div>
  }

  if (storedHouseholdDraft === undefined) {
    return <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center"><h1 className="text-xl font-bold">Preparing enrollment</h1><p className="mt-2 text-sm text-neutral-500">Opening secure device storage…</p></div>
  }

  if (storedHouseholdDraft && hasHouseholdDraftProgress(storedHouseholdDraft) && !restoreResolved && !draft) {
    return <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold">Continue saved household?</h1>
      <p className="text-sm text-neutral-500">Your unfinished household from {new Date(storedHouseholdDraft.updatedAt).toLocaleString()} is saved on this device.</p>
      <p className="text-sm font-semibold">{storedHouseholdDraft.householdCode}</p>
      <button className="primary-button w-full" onClick={() => { setDraft(hydrateHouseholdDraft(storedHouseholdDraft)); setRestoreResolved(true) }}>Continue draft</button>
      <button className="secondary-button w-full" onClick={() => void startOver()}>Discard and start over</button>
    </div>
  }

  if (activeWards.length === 0) {
    return <div className="px-6 py-10 text-center"><h1 className="text-xl font-bold">Enrollment data required</h1><button className="primary-button mt-4 w-full" disabled={referenceSync.isPending} onClick={() => referenceSync.mutate()}>Download enrollment data</button></div>
  }

  if (!draft) {
    return <HouseholdSetupForm geography={geography} onStart={(wardId) => { void startHousehold(wardId); setRestoreResolved(true) }} onBack={() => navigate(-1)} />
  }

  if (draft.phase === 'setup') {
    return null
  }

  if (draft.phase === 'members' && !activeMember) {
    return <div className="h-full min-h-0 overflow-y-auto"><div className="space-y-4 px-4 py-6"><div className="card p-4"><p className="text-sm font-bold">Household {draft.householdCode}</p><p className="mt-1 text-sm text-neutral-500">Head enrolled. Add household members or finish.</p>{sharedAddress && <p className="mt-2 text-sm text-neutral-500"><strong>Settlement address:</strong> {sharedAddress}</p>}{draft.members.length > 0 && <ul className="mt-3 space-y-1 text-sm">{draft.members.map((member, index) => <li key={member.idempotencyId}>{index + 1}. {member.form.firstName} {member.form.lastName}</li>)}</ul>}</div><button className="primary-button flex w-full items-center justify-center gap-2" onClick={() => {
      const member = withWardDefaults(
        createHouseholdMemberDraft(sharedAddress, draft.wardId),
        draft.wardId,
        selectedWard?.lga || '',
      )
      setDraft({ ...draft, members: [...draft.members, member], activeMemberIndex: draft.members.length, memberStep: 0, phase: 'members' })
    }}><Plus size={18} />Add household member</button><button className="secondary-button w-full" onClick={() => setDraft({ ...draft, phase: 'review' })}>Review household</button></div></div>
  }

  if (draft.phase === 'review') {
    return <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-neutral-200 bg-white px-4 py-4">
        <div className="flex items-center gap-3">
          <button className="secondary-button !min-h-9 !rounded-full !p-2" onClick={() => setDraft({ ...draft, phase: 'members', activeMemberIndex: draft.members.length })}><ArrowLeft size={18} /></button>
          <div><h1 className="font-bold">Review household</h1><p className="text-xs text-neutral-400">{draft.householdCode}</p></div>
        </div>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5">
        <div className="card p-4 text-sm">
          <p><strong>Code:</strong> {draft.householdCode}</p>
          {sharedAddress && <p className="mt-2"><strong>Settlement address:</strong> {sharedAddress}</p>}
          <p className="mt-2"><strong>Household size:</strong> {1 + draft.members.length}</p>
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-neutral-600">People in this household</h2>
          {draft.head && <HouseholdMemberReviewCard form={draft.head.form} role="head" facilities={facilities} wardName={selectedWard?.name} onEdit={editHead} />}
          {draft.members.map((member, index) => (
            <HouseholdMemberReviewCard
              key={member.idempotencyId}
              form={member.form}
              role="member"
              memberLabel={`Member ${index + 1}`}
              facilities={facilities}
              wardName={selectedWard?.name}
              onEdit={() => editMemberAt(index)}
            />
          ))}
        </div>
      </div>
      <footer className="relative z-10 shrink-0 space-y-3 border-t border-neutral-200 bg-white px-4 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">
        {queueError ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{queueError}</p> : null}
        <button type="button" className="primary-button w-full" disabled={isQueueing} onClick={() => void queueAll()}>{isQueueing ? 'Saving…' : 'Save household on this device'}</button>
        <button type="button" className="secondary-button w-full" disabled={isQueueing} onClick={() => void discardHouseholdDraft(user.id).then(() => setDraft(null))}>Discard</button>
      </footer>
    </div>
  }

  if (!activeMember) return null
  const isHead = draft.phase === 'head'
  const stepProps = {
    form: activeMember.form,
    errors,
    update: (name: keyof HouseholdDraftMember['form'], value: string) => updateMember(activeMember, name, value),
    handleFile: (purpose: 'passport' | 'id_document', event: ChangeEvent<HTMLInputElement>) => handleFile(activeMember, purpose, event),
    clearFile: (purpose: 'passport' | 'id_document') => clearFile(activeMember, purpose),
  }

  return <div className="flex h-full min-h-0 flex-col overflow-hidden">
    <EnrollmentWizardHeader
      title={isHead ? 'Household head' : 'Household member'}
      step={step}
      saveMessage={saveMessage}
      onBack={goBackInWizard}
    />
    <div className={`min-h-0 flex-1 overflow-y-auto px-4 py-5 ${step === 5 ? 'flex' : 'space-y-4'}`}>
      {step === 0 && <PersonalStep {...stepProps} />}
      {step === 1 && selectedWard && <ResidenceStep {...stepProps} lgas={[selectedWard.lga]} wards={[selectedWard]} lockLga lockWard lockAddress={!isHead} />}
      {step === 2 && <ContactStep {...stepProps} />}
      {step === 3 && <BackgroundStep {...stepProps} />}
      {step === 4 && !facilityLocked && <FacilityStep {...stepProps} facilities={activeFacilities} ward={selectedWard} />}
      {step === 5 && <HouseholdMemberReviewStep form={activeMember.form} role={isHead ? 'head' : 'member'} facilities={facilities} wardName={selectedWard?.name} onEdit={editActiveMember} />}
    </div>
    <footer className="flex shrink-0 gap-3 border-t border-neutral-200 bg-white px-4 py-3">
      {step > 0 && <button type="button" className="secondary-button flex-1" onClick={goBackInWizard}>Back</button>}
      <button type="button" className="primary-button flex-[2]" onClick={continueMemberFlow}>{step === 5 ? 'Continue' : 'Save & continue'}</button>
    </footer>
  </div>
}

function HouseholdSetupForm({
  geography,
  onStart,
  onBack,
}: {
  geography: ReturnType<typeof getEnrollmentGeographyAccess>
  onStart: (wardId: string) => void
  onBack: () => void
}) {
  const [lga, setLga] = useState(geography.lockLga ? geography.fixedLga : '')
  const setupWards = useMemo(
    () => getResidenceWardsForForm(geography, lga),
    [geography, lga],
  )
  const [wardId, setWardId] = useState(
    geography.lockWard ? geography.selectableWards[0]?.id ?? '' : '',
  )

  useEffect(() => {
    if (geography.lockWard) return
    setWardId((current) => resolveWardId(lga, current, setupWards))
  }, [geography.lockWard, lga, setupWards])

  return <div className="space-y-4 px-4 py-6">
    <button className="secondary-button !min-h-9 !rounded-full !p-2" onClick={onBack}><ArrowLeft size={18} /></button>
    <h1 className="text-xl font-bold">New household enrollment</h1>
    <label className="flex flex-col gap-1 text-sm font-bold">
      Local government area (LGA)
      {geography.lockLga
        ? <input className="field bg-neutral-100 text-neutral-600" readOnly value={geography.fixedLga} />
        : <select className="field" value={lga} onChange={(event) => setLga(event.target.value)}>
            <option value="">Select LGA</option>
            {geography.lgas.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>}
    </label>
    <label className="flex flex-col gap-1 text-sm font-bold">
      Ward
      {geography.lockWard
        ? <input className="field bg-neutral-100 text-neutral-600" readOnly value={setupWards[0]?.name ?? ''} />
        : <select className="field" disabled={!geography.lockLga && !lga} value={wardId} onChange={(event) => setWardId(event.target.value)}>
            <option value="">{lga || geography.lockLga ? 'Select ward' : 'Select an LGA first'}</option>
            {setupWards.map((ward) => <option key={ward.id} value={ward.id}>{ward.name}</option>)}
          </select>}
    </label>
    <button className="primary-button w-full" disabled={!wardId} onClick={() => onStart(wardId)}>Continue to household head</button>
  </div>
}
