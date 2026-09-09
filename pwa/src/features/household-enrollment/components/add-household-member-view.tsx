import { ArrowLeft, Check } from 'lucide-react'
import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

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
import { useCachedHouseholds, useEnrollmentReferences } from '@/features/enrollment/hooks'
import { saveEnrollmentFile, removeEnrollmentFile } from '@/features/enrollment/services'
import type { HouseholdDraftMember } from '@/features/enrollment/types'
import { getOfficerLga, isWardFacilityLocked, resolveHealthFacilityId } from '@/features/enrollment/utils'
import { hasStorageCapacity, requestPersistentStorage } from '@/lib/offline-db'

import {
  createHouseholdMemberDraft,
  queueLateHouseholdMember,
} from '../services/offline-household-enrollment.service'
import { HouseholdMemberReviewStep } from './household-review-ui'

export function AddHouseholdMemberView() {
  const navigate = useNavigate()
  const { householdLocalId = '' } = useParams()
  const user = useAuthStore((state) => state.user)!
  const households = useCachedHouseholds(user.id)
  const { wards, facilities } = useEnrollmentReferences(user.id)
  const household = households.find((item) => item.householdLocalId === householdLocalId)
  const [member, setMember] = useState<HouseholdDraftMember | null>(null)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isQueueing, setIsQueueing] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => { void requestPersistentStorage() }, [])
  useEffect(() => {
    if (!household || member) return
    const draft = createHouseholdMemberDraft(household.residentialAddress ?? '', household.wardId)
    draft.form.lgaOfResidence = getOfficerLga(user.assignedWards, wards)
    draft.form.healthFacilityId = resolveHealthFacilityId(household.wardId, draft.form.healthFacilityId, facilities)
    setMember(draft)
  }, [facilities, household, member, user.assignedWards, wards])

  useEffect(() => {
    if (!household || !member || facilities.length === 0) return
    const healthFacilityId = resolveHealthFacilityId(household.wardId, member.form.healthFacilityId, facilities)
    if (healthFacilityId === member.form.healthFacilityId) return
    setMember({ ...member, form: { ...member.form, healthFacilityId } })
  }, [facilities, household, member])

  const activeWards = useMemo(() => wards.filter((ward) => ward.status === 'active').sort((a, b) => a.name.localeCompare(b.name)), [wards])
  const selectedWard = activeWards.find((ward) => ward.id === household?.wardId)
  const officerLga = useMemo(() => getOfficerLga(user.assignedWards, activeWards), [activeWards, user.assignedWards])
  const activeFacilities = useMemo(
    () => facilities.filter((facility) => facility.status === 'active' && facility.wardId === household?.wardId),
    [facilities, household?.wardId],
  )
  const facilityLocked = household ? isWardFacilityLocked(household.wardId, facilities) : false

  function update(name: keyof HouseholdDraftMember['form'], value: string) {
    if (!member) return
    const nextForm = { ...member.form, [name]: value }
    nextForm.lgaOfResidence = officerLga || selectedWard?.lga || nextForm.lgaOfResidence
    setMember({ ...member, form: nextForm })
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  async function handleFile(purpose: 'passport' | 'id_document', event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !member) return
    if (!await hasStorageCapacity(file.size)) return
    const stored = await saveEnrollmentFile(user.id, member.idempotencyId, purpose, file)
    setMember({
      ...member,
      passportObjectKey: undefined,
      idDocumentObjectKey: undefined,
      form: {
        ...member.form,
        passportFileId: purpose === 'passport' ? stored.id : member.form.passportFileId,
        passportName: purpose === 'passport' ? stored.name : member.form.passportName,
        idDocumentFileId: purpose === 'id_document' ? stored.id : member.form.idDocumentFileId,
        idDocumentName: purpose === 'id_document' ? stored.name : member.form.idDocumentName,
      },
    })
  }

  async function clearFile(purpose: 'passport' | 'id_document') {
    if (!member) return
    await removeEnrollmentFile(member.idempotencyId, purpose)
    setMember({
      ...member,
      passportObjectKey: undefined,
      idDocumentObjectKey: undefined,
      form: {
        ...member.form,
        passportFileId: purpose === 'passport' ? '' : member.form.passportFileId,
        passportName: purpose === 'passport' ? '' : member.form.passportName,
        idDocumentFileId: purpose === 'id_document' ? '' : member.form.idDocumentFileId,
        idDocumentName: purpose === 'id_document' ? '' : member.form.idDocumentName,
      },
    })
  }

  async function continueFlow() {
    if (!member || !household) return
    const nextErrors = validateEnrollmentStep(member.form, step)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    if (step < enrollmentSteps.length - 1) {
      setStep(nextEnrollmentWizardStep(step, facilityLocked))
      return
    }
    setIsQueueing(true)
    try {
      const facilityName = facilities.find((facility) => facility.id === member.form.healthFacilityId)?.name ?? 'Unknown facility'
      await queueLateHouseholdMember(user.id, household, member, household.wardName, facilityName)
      setDone(true)
    } finally {
      setIsQueueing(false)
    }
  }

  if (!household) {
    return <div className="space-y-4 px-4 py-6"><button className="secondary-button !min-h-9 !rounded-full !p-2" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button><h1 className="text-xl font-bold">Household not found</h1><p className="text-sm text-neutral-500">This household is not cached on this device. Enroll a household here first or sync when online.</p><Link className="primary-button w-full" to="/households">View households on this device</Link></div>
  }

  if (done) {
    return <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-5 px-6 text-center"><span className="flex h-20 w-20 items-center justify-center rounded-full bg-success text-success-foreground"><Check size={42} /></span><div><h1 className="text-xl font-bold">Member saved on this device</h1><p className="mt-2 text-sm text-neutral-500">The member will sync after the household head is on the server. Insurance ID is assigned during sync.</p></div><Link className="primary-button w-full" to="/beneficiaries">View pending enrollments</Link></div>
  }

  if (!member) return null

  const stepProps = {
    form: member.form,
    errors,
    update,
    handleFile: (purpose: 'passport' | 'id_document', event: ChangeEvent<HTMLInputElement>) => void handleFile(purpose, event),
    clearFile: (purpose: 'passport' | 'id_document') => void clearFile(purpose),
  }

  function goBackInWizard() {
    if (step === 0) {
      navigate(-1)
      return
    }
    setStep(previousEnrollmentWizardStep(step, facilityLocked))
    setErrors({})
  }

  return <div className="flex h-full min-h-0 flex-col overflow-hidden">
    <EnrollmentWizardHeader title="Add household member" step={step} onBack={goBackInWizard} />
    <div className={`min-h-0 flex-1 overflow-y-auto px-4 py-5 ${step === 5 ? 'flex flex-col' : 'space-y-4'}`}>
      {step !== 5 && <div className="card p-4 text-sm"><p><strong>Household:</strong> {household.householdCode}</p>{household.headName && <p className="mt-1"><strong>Head:</strong> {household.headName}</p>}</div>}
      {step === 0 && <PersonalStep {...stepProps} />}
      {step === 1 && <ResidenceStep {...stepProps} lgas={officerLga ? [officerLga] : []} wards={activeWards.filter((ward) => ward.id === household.wardId)} lockWard lockAddress />}
      {step === 2 && <ContactStep {...stepProps} />}
      {step === 3 && <BackgroundStep {...stepProps} />}
      {step === 4 && !facilityLocked && <FacilityStep {...stepProps} facilities={activeFacilities} ward={selectedWard} lockFacility={facilityLocked} />}
      {step === 5 && <HouseholdMemberReviewStep form={member.form} role="member" facilities={facilities} wardName={selectedWard?.name} onEdit={() => setStep(0)} />}
    </div>
    <footer className="flex shrink-0 gap-3 border-t border-neutral-200 bg-white px-4 py-3">
      {step > 0 && <button type="button" className="secondary-button flex-1" onClick={goBackInWizard}>Back</button>}
      <button type="button" className="primary-button flex-[2]" disabled={isQueueing} onClick={() => void continueFlow()}>{isQueueing ? 'Saving…' : step === 5 ? 'Save member on this device' : 'Save & continue'}</button>
    </footer>
  </div>
}
