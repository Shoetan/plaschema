import { ArrowLeft, Camera, Check, FileText, RefreshCw, RotateCcw, Upload } from 'lucide-react'
import { type ChangeEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/stores/auth.store'
import { hasStorageCapacity, requestPersistentStorage } from '@/lib/offline-db'

import { useEnrollmentDraft, useEnrollmentReferences, useReferenceSync } from '../hooks'
import { createEnrollmentDraft, discardEnrollmentDraft, queueEnrollment, removeEnrollmentFile, saveEnrollmentDraft, saveEnrollmentFile } from '../services'
import type { EnrollmentDraftRecord, EnrollmentFormValues, ReferenceFacility, ReferenceWard } from '../types'
import { BENEFICIARY_CATEGORIES, getResidenceLgas, hasDraftProgress, isValidNin, isValidPhoneNumber, normalizeNin, normalizePhoneNumber, PLATEAU_STATE, resolveHealthFacilityId, resolveWardId } from '../utils'

const steps = ['Personal', 'Residence', 'Contact', 'Background', 'Facility', 'Review']
const MAX_FILE_SIZE = 5 * 1024 * 1024
const titleOptions = [['mr', 'Mr'], ['mrs', 'Mrs'], ['miss', 'Miss'], ['ms', 'Ms'], ['dr', 'Dr'], ['chief', 'Chief'], ['rev', 'Rev'], ['alhaji', 'Alhaji'], ['hajia', 'Hajia'], ['other', 'Other']] as const
const maritalOptions = [['single', 'Single'], ['married', 'Married'], ['divorced', 'Divorced'], ['widowed', 'Widowed'], ['separated', 'Separated']] as const
const idOptions = [['nin', 'NIN'], ['national_id', 'National ID'], ['voters_card', "Voter's Card"], ['drivers_license', "Driver's License"], ['international_passport', 'International Passport'], ['other', 'Other']] as const
const relationshipOptions = [['spouse', 'Spouse'], ['parent', 'Parent'], ['sibling', 'Sibling'], ['child', 'Child'], ['relative', 'Relative'], ['friend', 'Friend'], ['other', 'Other']] as const
const bloodOptions = [['a_pos', 'A+'], ['a_neg', 'A-'], ['b_pos', 'B+'], ['b_neg', 'B-'], ['ab_pos', 'AB+'], ['ab_neg', 'AB-'], ['o_pos', 'O+'], ['o_neg', 'O-'], ['unknown', 'Unknown']] as const
const genotypeOptions = [['aa', 'AA'], ['as', 'AS'], ['ss', 'SS'], ['ac', 'AC'], ['sc', 'SC'], ['unknown', 'Unknown']] as const

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
  return <label className="flex flex-col gap-1.5 text-sm font-bold">{label}{required && <span className="sr-only"> required</span>}{children}{error && <span className="text-xs font-semibold text-red-600">{error}</span>}</label>
}

export function EnrollmentView() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)!
  const storedDraft = useEnrollmentDraft(user.id)
  const { wards, facilities, metadata } = useEnrollmentReferences(user.id)
  const referenceSync = useReferenceSync()
  const [draft, setDraft] = useState<EnrollmentDraftRecord | null>(null)
  const [restoreResolved, setRestoreResolved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState('')
  const [isQueueing, setIsQueueing] = useState(false)
  const fieldsScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { void requestPersistentStorage() }, [])
  useEffect(() => {
    if (storedDraft !== null || draft) return
    void createEnrollmentDraft(user.id).then((created) => { setDraft(created); setRestoreResolved(true) })
  }, [draft, storedDraft, user.id])
  useEffect(() => {
    if (!storedDraft || hasDraftProgress(storedDraft.form) || draft) return
    setDraft(storedDraft)
    setRestoreResolved(true)
  }, [draft, storedDraft])
  useEffect(() => {
    if (!draft) return
    setSaveMessage('Saving…')
    const timer = window.setTimeout(() => void saveEnrollmentDraft(draft).then(() => setSaveMessage('Saved on this device')), 400)
    return () => window.clearTimeout(timer)
  }, [draft])
  const activeWards = useMemo(() => wards.filter((ward) => ward.status === 'active').sort((a, b) => a.name.localeCompare(b.name)), [wards])
  const residenceLgas = useMemo(() => getResidenceLgas(activeWards), [activeWards])
  const availableWards = useMemo(() => activeWards.filter((ward) => ward.lga === draft?.form.lgaOfResidence), [activeWards, draft?.form.lgaOfResidence])
  const activeFacilities = useMemo(() => facilities.filter((facility) => facility.status === 'active' && facility.wardId === draft?.form.wardId).sort((a, b) => a.name.localeCompare(b.name)), [draft?.form.wardId, facilities])

  useEffect(() => {
    if (!draft) return
    const selectedWard = activeWards.find((ward) => ward.id === draft.form.wardId)
    const lgaOfResidence = selectedWard?.lga ?? draft.form.lgaOfResidence
    const wardId = resolveWardId(lgaOfResidence, draft.form.wardId, activeWards)
    const healthFacilityId = resolveHealthFacilityId(wardId, draft.form.healthFacilityId, facilities)
    if (lgaOfResidence === draft.form.lgaOfResidence && wardId === draft.form.wardId && healthFacilityId === draft.form.healthFacilityId) return
    setDraft((current) => current ? { ...current, form: { ...current.form, lgaOfResidence, wardId, healthFacilityId } } : current)
  }, [activeWards, draft, facilities])

  function update(name: keyof EnrollmentFormValues, value: string) {
    setDraft((current) => current ? {
      ...current,
      form: {
        ...current.form,
        [name]: value,
        ...(name === 'wardId' ? {
          healthFacilityId: resolveHealthFacilityId(value, '', facilities),
          lgaOfResidence: activeWards.find((ward) => ward.id === value)?.lga ?? current.form.lgaOfResidence,
        } : name === 'lgaOfResidence' ? {
          wardId: resolveWardId(value, current.form.wardId, activeWards),
          healthFacilityId: resolveHealthFacilityId(resolveWardId(value, current.form.wardId, activeWards), current.form.healthFacilityId, facilities),
        } : {}),
      },
    } : current)
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  function changeStep(nextStep: number) {
    setDraft((current) => current ? { ...current, step: nextStep } : current)
    window.requestAnimationFrame(() => fieldsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  async function handleFile(purpose: 'passport' | 'id_document', event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !draft) return
    const allowed = purpose === 'passport' ? ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) : ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)
    const key = purpose === 'passport' ? 'passportFileId' : 'idDocumentFileId'
    if (!allowed || file.size > MAX_FILE_SIZE) {
      setErrors((current) => ({ ...current, [key]: !allowed ? 'Choose a supported JPEG, PNG, WebP or PDF file.' : 'File must be 5 MB or smaller.' }))
      return
    }
    if (!await hasStorageCapacity(file.size)) {
      setErrors((current) => ({ ...current, [key]: 'This device does not have enough storage. Sync or remove another pending enrollment first.' }))
      return
    }
    const stored = await saveEnrollmentFile(user.id, draft.idempotencyId, purpose, file)
    setDraft((current) => current ? {
      ...current,
      [purpose === 'passport' ? 'passportObjectKey' : 'idDocumentObjectKey']: undefined,
      form: { ...current.form, [key]: stored.id, [purpose === 'passport' ? 'passportName' : 'idDocumentName']: stored.name },
    } : current)
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  async function clearFile(purpose: 'passport' | 'id_document') {
    if (!draft) return
    await removeEnrollmentFile(draft.idempotencyId, purpose)
    setDraft((current) => current ? {
      ...current,
      [purpose === 'passport' ? 'passportObjectKey' : 'idDocumentObjectKey']: undefined,
      form: { ...current.form, [purpose === 'passport' ? 'passportFileId' : 'idDocumentFileId']: '', [purpose === 'passport' ? 'passportName' : 'idDocumentName']: '' },
    } : current)
  }

  function validateCurrentStep() {
    if (!draft) return false
    const form = draft.form
    const needed: Array<keyof EnrollmentFormValues> = draft.step === 0
      ? ['category', 'passportFileId', 'title', 'firstName', 'lastName', 'gender', 'dateOfBirth', 'maritalStatus']
      : draft.step === 1 ? ['lgaOfResidence', 'residentialAddress', 'wardId']
      : draft.step === 2 ? ['phone']
      : draft.step === 3 ? ['idType', 'nin', 'idDocumentFileId']
      : draft.step === 4 ? ['healthFacilityId'] : []
    const nextErrors: Record<string, string> = {}
    for (const key of needed) if (!form[key].trim()) nextErrors[key] = 'This field is required.'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email.'
    if (form.firstName.length > 80 || form.lastName.length > 80 || form.middleName.length > 80) nextErrors.firstName = 'Names must be 80 characters or fewer.'
    if (draft.step === 2 && !isValidPhoneNumber(form.phone)) nextErrors.phone = 'Enter exactly 11 digits.'
    if (draft.step === 3 && !isValidNin(form.nin)) nextErrors.nin = 'NIN must contain exactly 10 digits.'
    if (form.residentialAddress.length > 300) nextErrors.residentialAddress = 'Address must be 300 characters or fewer.'
    if (form.dateOfBirth) {
      const birth = new Date(`${form.dateOfBirth}T00:00:00`)
      const earliest = new Date(); earliest.setFullYear(earliest.getFullYear() - 120)
      if (birth > new Date() || birth < earliest) nextErrors.dateOfBirth = 'Enter a valid date of birth within the last 120 years.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function continueFlow() {
    if (!draft || !validateCurrentStep()) return
    if (draft.step < steps.length - 1) return changeStep(draft.step + 1)
    const ward = wards.find((item) => item.id === draft.form.wardId)
    const facility = facilities.find((item) => item.id === draft.form.healthFacilityId)
    if (!ward || !facility) return setErrors({ healthFacilityId: 'Refresh enrollment data and select the facility again.' })
    setIsQueueing(true)
    try {
      const record = await queueEnrollment(draft, ward.name, facility.name)
      setSubmittedId(record.localId)
      setDraft(null)
      setRestoreResolved(false)
    } finally { setIsQueueing(false) }
  }

  async function startOver() {
    await discardEnrollmentDraft(user.id)
    const created = await createEnrollmentDraft(user.id)
    setDraft(created)
    setRestoreResolved(true)
  }

  if (submittedId) return <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-5 px-6 text-center"><span className="flex h-20 w-20 items-center justify-center rounded-full bg-success text-success-foreground"><Check size={42} /></span><div><h1 className="text-xl font-bold">Saved on this device</h1><p className="mt-2 text-sm text-neutral-500">The enrollment is safe and queued. It will synchronize automatically while this app is open and online.</p></div><div className="flex w-full flex-col gap-3"><button className="primary-button" onClick={() => { setSubmittedId(null); void createEnrollmentDraft(user.id).then((created) => { setDraft(created); setRestoreResolved(true) }) }}>Enroll another</button><Link className="secondary-button" to="/beneficiaries">View pending enrollments</Link></div></div>
  if (storedDraft === undefined || (!draft && storedDraft === null)) return <CenteredMessage title="Preparing enrollment" text="Opening secure device storage…" />
  if (storedDraft && hasDraftProgress(storedDraft.form) && !restoreResolved) return <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 text-center"><h1 className="text-xl font-bold">Continue saved enrollment?</h1><p className="text-sm text-neutral-500">Your unfinished enrollment from {new Date(storedDraft.updatedAt).toLocaleString()} is saved on this device.</p><button className="primary-button w-full" onClick={() => { setDraft(storedDraft); setRestoreResolved(true) }}>Continue draft</button><button className="secondary-button w-full" onClick={() => void startOver()}>Discard and start over</button></div>
  if (!draft) return <CenteredMessage title="Preparing enrollment" text="Opening your saved draft…" />
  if (activeWards.length === 0 || facilities.length === 0) return <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 text-center"><RefreshCw size={32} className={referenceSync.isPending ? 'animate-spin' : ''} /><h1 className="text-xl font-bold">Enrollment data required</h1><p className="text-sm text-neutral-500">Download your wards and health facilities before starting. Once downloaded, they remain available offline.</p>{metadata && <p className="text-xs text-neutral-400">Last complete download: {new Date(metadata.syncedAt).toLocaleString()}</p>}<button className="primary-button w-full" disabled={!navigator.onLine || referenceSync.isPending} onClick={() => referenceSync.mutate()}>{navigator.onLine ? referenceSync.isPending ? 'Downloading…' : 'Download enrollment data' : 'Connect to the internet to download'}</button>{referenceSync.isError && <p role="alert" className="text-sm font-semibold text-red-700">Reference data could not be downloaded. Check your connection and try again.</p>}</div>
  const { form, step } = draft
  return <div className="flex h-full min-h-0 flex-col overflow-hidden">
    <header className="shrink-0 border-b border-neutral-200 bg-white px-4 py-4"><div className="flex items-center gap-3"><button aria-label="Go back" className="secondary-button !min-h-9 !rounded-full !p-2" onClick={() => step === 0 ? navigate(-1) : changeStep(step - 1)}><ArrowLeft size={18} /></button><div className="min-w-0 flex-1"><h1 className="font-bold">New enrollment</h1><p className="text-xs text-neutral-400">Step {step + 1} of {steps.length} · {steps[step]}</p></div><span aria-live="polite" className="text-[10px] font-semibold text-neutral-400">{saveMessage}</span></div><div className="mt-4 flex gap-1" aria-label={`Step ${step + 1} of ${steps.length}`}>{steps.map((item, index) => <span key={item} className={`h-1 flex-1 rounded-full ${index <= step ? 'bg-brand' : 'bg-neutral-200'}`} />)}</div></header>
    <div ref={fieldsScrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5">
      {step === 0 && <PersonalStep form={form} errors={errors} update={update} handleFile={handleFile} clearFile={clearFile} />}
      {step === 1 && <ResidenceStep form={form} errors={errors} lgas={residenceLgas} wards={availableWards} update={update} handleFile={handleFile} clearFile={clearFile} />}
      {step === 2 && <ContactStep form={form} errors={errors} update={update} handleFile={handleFile} clearFile={clearFile} />}
      {step === 3 && <BackgroundStep form={form} errors={errors} update={update} handleFile={handleFile} clearFile={clearFile} />}
      {step === 4 && <FacilityStep form={form} errors={errors} facilities={activeFacilities} ward={activeWards.find((item) => item.id === form.wardId)} update={update} changeStep={changeStep} handleFile={handleFile} clearFile={clearFile} />}
      {step === 5 && <Review form={form} ward={wards.find((item) => item.id === form.wardId)} facility={facilities.find((item) => item.id === form.healthFacilityId)} onEdit={changeStep} />}
    </div>
    <footer className="flex shrink-0 gap-3 border-t border-neutral-200 bg-white px-4 py-3">{step > 0 && <button className="secondary-button flex-1" onClick={() => changeStep(step - 1)}>Back</button>}<button className="primary-button flex-[2]" disabled={isQueueing} onClick={() => void continueFlow()}>{step === 5 ? isQueueing ? 'Saving…' : 'Save enrollment' : 'Save & continue'}</button></footer>
  </div>
}

interface StepProps {
  form: EnrollmentFormValues
  errors: Record<string, string>
  update: (name: keyof EnrollmentFormValues, value: string) => void
  handleFile: (purpose: 'passport' | 'id_document', event: ChangeEvent<HTMLInputElement>) => Promise<void>
  clearFile: (purpose: 'passport' | 'id_document') => Promise<void>
}

function PersonalStep({ form, errors, update, handleFile, clearFile }: StepProps) {
  return <><FilePicker label="Passport photograph" name="passport" value={form.passportName} error={errors.passportFileId} accept="image/jpeg,image/png,image/webp" capture="user" icon={<Camera size={26} />} onChange={(event) => void handleFile('passport', event)} onClear={() => void clearFile('passport')} /><Field label="Beneficiary category" required error={errors.category}><select className="field" value={form.category} onChange={(e) => update('category', e.target.value)}><option value="">Select category</option>{BENEFICIARY_CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></Field><div className="grid grid-cols-3 gap-3"><Field label="Title" required error={errors.title}><select className="field" value={form.title} onChange={(e) => update('title', e.target.value)}><option value="">Select</option>{titleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><div className="col-span-2"><Field label="First name" required error={errors.firstName}><input className="field" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} /></Field></div></div><Field label="Middle name"><input className="field" value={form.middleName} onChange={(e) => update('middleName', e.target.value)} /></Field><Field label="Surname" required error={errors.lastName}><input className="field" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} /></Field><Field label="Gender" required error={errors.gender}><div className="grid grid-cols-2 gap-3">{([['male', 'Male'], ['female', 'Female']] as const).map(([value, label]) => <button type="button" key={value} className={form.gender === value ? 'primary-button' : 'secondary-button'} onClick={() => update('gender', value)}>{label}</button>)}</div></Field><Field label="Date of birth" required error={errors.dateOfBirth}><input type="date" className="field" max={new Date().toISOString().slice(0, 10)} value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} /></Field><Field label="Marital status" required error={errors.maritalStatus}><select className="field" value={form.maritalStatus} onChange={(e) => update('maritalStatus', e.target.value)}><option value="">Select</option>{maritalOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field></>
}

function ResidenceStep({ form, errors, lgas, wards, update }: StepProps & { lgas: string[]; wards: ReferenceWard[] }) {
  return <><Field label="State of residence" required><input className="field bg-neutral-100 text-neutral-600" readOnly value={PLATEAU_STATE} /></Field><Field label="Local government area (LGA)" required error={errors.lgaOfResidence}><select className="field" value={form.lgaOfResidence} onChange={(e) => update('lgaOfResidence', e.target.value)}><option value="">Select LGA</option>{lgas.map((lga) => <option key={lga} value={lga}>{lga}</option>)}</select></Field><Field label="Ward" required error={errors.wardId}><select className="field" disabled={!form.lgaOfResidence} value={form.wardId} onChange={(e) => update('wardId', e.target.value)}><option value="">{form.lgaOfResidence ? 'Select assigned ward' : 'Select an LGA first'}</option>{wards.map((ward) => <option key={ward.id} value={ward.id}>{ward.name}</option>)}</select></Field><Field label="Residential address" required error={errors.residentialAddress}><textarea className="field min-h-28" value={form.residentialAddress} onChange={(e) => update('residentialAddress', e.target.value)} /></Field></>
}

function ContactStep({ form, errors, update }: StepProps) {
  return <><Field label="Phone number" required error={errors.phone}><input className="field" inputMode="numeric" pattern="[0-9]*" placeholder="08012345678" type="tel" value={form.phone} onChange={(e) => update('phone', normalizePhoneNumber(e.target.value))} /></Field><Field label="Email address" error={errors.email}><input className="field" type="email" placeholder="Optional" value={form.email} onChange={(e) => update('email', e.target.value)} /></Field><div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">Confirm the 11-digit phone number with the beneficiary before continuing.</div></>
}

function BackgroundStep({ form, errors, update, handleFile, clearFile }: StepProps) {
  return <><Field label="ID type" required error={errors.idType}><select className="field" value={form.idType} onChange={(e) => update('idType', e.target.value)}><option value="">Select</option>{idOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="NIN" required error={errors.nin}><input className="field" inputMode="numeric" pattern="[0-9]*" placeholder="10 digits" value={form.nin} onChange={(e) => update('nin', normalizeNin(e.target.value))} /></Field><FilePicker label="ID document" name="idDocument" value={form.idDocumentName} error={errors.idDocumentFileId} accept="image/jpeg,image/png,image/webp,application/pdf" icon={<FileText size={26} />} onChange={(event) => void handleFile('id_document', event)} onClear={() => void clearFile('id_document')} /><div className="grid grid-cols-2 gap-3"><Field label="Blood group"><select className="field" value={form.bloodGroup} onChange={(e) => update('bloodGroup', e.target.value)}><option value="">Optional</option>{bloodOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Genotype"><select className="field" value={form.genotype} onChange={(e) => update('genotype', e.target.value)}><option value="">Optional</option>{genotypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field></div><Field label="Next of kin full name"><input className="field" placeholder="Optional" value={form.nextOfKinFullName} onChange={(e) => update('nextOfKinFullName', e.target.value)} /></Field><Field label="Relationship"><select className="field" value={form.nextOfKinRelationship} onChange={(e) => update('nextOfKinRelationship', e.target.value)}><option value="">Optional</option>{relationshipOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field></>
}

function FacilityStep({ form, errors, facilities, ward, update, changeStep }: StepProps & { facilities: ReferenceFacility[]; ward?: ReferenceWard; changeStep: (step: number) => void }) {
  return <><div className="rounded-xl bg-success p-4 text-sm text-success-foreground"><strong>Enrollment ward:</strong> {ward?.name ?? 'Not selected'}<button className="ml-2 underline" onClick={() => changeStep(1)}>Change</button></div><Field label="Health facility" required error={errors.healthFacilityId}><select className="field" value={form.healthFacilityId} onChange={(e) => update('healthFacilityId', e.target.value)}><option value="">Select facility</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</select></Field>{facilities.length === 0 && <p className="text-sm font-semibold text-amber-700">No active facility is cached for this ward. Refresh enrollment data or choose another ward.</p>}</>
}

function FilePicker({ label, name, value, error, accept, capture, icon, onChange, onClear }: { label: string; name: string; value: string; error?: string; accept: string; capture?: 'user'; icon: ReactNode; onChange: (event: ChangeEvent<HTMLInputElement>) => void; onClear: () => void }) {
  return <div><p className="mb-2 text-sm font-bold">{label} <span className="text-red-600">*</span></p><div className={`rounded-xl border-2 border-dashed p-5 text-center ${error ? 'border-red-300 bg-red-50' : 'border-neutral-200 bg-neutral-50'}`}><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-white text-neutral-500">{value ? <Check className="text-green-700" /> : icon}</span><p className="mt-2 truncate text-sm font-bold">{value || 'No file selected'}</p><p className="mt-1 text-xs text-neutral-400">Maximum 5 MB · Saved on this device until synchronized</p><div className="mt-3 flex justify-center gap-2"><label className="secondary-button inline-flex items-center gap-2 !min-h-9 cursor-pointer !py-2 text-xs"><Upload size={14} />Choose file<input className="sr-only" type="file" name={name} accept={accept} capture={capture} onChange={onChange} /></label>{value && <button type="button" aria-label={`Remove ${label}`} className="secondary-button !min-h-9 !py-2 text-xs" onClick={onClear}><RotateCcw size={14} /></button>}</div></div>{error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}</div>
}

function Review({ form, ward, facility, onEdit }: { form: EnrollmentFormValues; ward?: ReferenceWard; facility?: ReferenceFacility; onEdit: (step: number) => void }) {
  const sections = [
    { title: 'Personal', step: 0, rows: [['Name', `${form.title} ${form.firstName} ${form.middleName} ${form.lastName}`], ['Category', form.category], ['Gender', form.gender], ['Date of birth', form.dateOfBirth], ['Passport', form.passportName]] },
    { title: 'Residence', step: 1, rows: [['Ward', ward?.name ?? ''], ['LGA', form.lgaOfResidence], ['Address', form.residentialAddress]] },
    { title: 'Contact', step: 2, rows: [['Phone', form.phone], ['Email', form.email || '—']] },
    { title: 'Background', step: 3, rows: [['ID', `${form.idType} · ${form.idDocumentName}`], ['NIN', form.nin || '—'], ['Blood group', form.bloodGroup || '—'], ['Genotype', form.genotype || '—'], ['Next of kin', form.nextOfKinFullName || '—'], ['Relationship', form.nextOfKinRelationship || '—']] },
    { title: 'Facility', step: 4, rows: [['Health facility', facility?.name ?? '']] },
  ]
  return <><p className="text-sm text-neutral-500">Review this enrollment before saving it securely on this device.</p>{sections.map((section) => <section className="card p-4" key={section.title}><div className="mb-3 flex justify-between"><h2 className="text-sm font-bold">{section.title}</h2><button className="text-xs font-bold underline" onClick={() => onEdit(section.step)}>Edit</button></div><dl className="space-y-2">{section.rows.map(([label, value]) => <div className="flex justify-between gap-4 text-sm" key={label}><dt className="shrink-0 text-neutral-500">{label}</dt><dd className="break-words text-right font-semibold">{value.trim() || '—'}</dd></div>)}</dl></section>)}</>
}

function CenteredMessage({ title, text }: { title: string; text: string }) {
  return <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center"><h1 className="text-lg font-bold">{title}</h1><p className="mt-2 text-sm text-neutral-500">{text}</p></div>
}
