import { ArrowLeft, Camera, Check, FileText, RotateCcw, Upload } from 'lucide-react'
import type { ChangeEvent, ReactNode } from 'react'

import type { EnrollmentFormValues, ReferenceFacility, ReferenceWard } from '../types'
import { BENEFICIARY_CATEGORIES, isValidNin, isValidPhoneNumber, normalizeNin, normalizePhoneNumber, PLATEAU_STATE } from '../utils'

export const enrollmentSteps = ['Personal', 'Residence', 'Contact', 'Background', 'Facility', 'Review'] as const

export function EnrollmentWizardHeader({
  title,
  step,
  steps = enrollmentSteps,
  saveMessage,
  onBack,
}: {
  title: string
  step: number
  steps?: readonly string[]
  saveMessage?: string
  onBack: () => void
}) {
  return (
    <header className="shrink-0 border-b border-neutral-200 bg-white px-4 py-4">
      <div className="flex items-center gap-3">
        <button aria-label="Go back" type="button" className="secondary-button !min-h-9 !rounded-full !p-2" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold">{title}</h1>
          <p className="text-xs text-neutral-400">Step {step + 1} of {steps.length} · {steps[step]}</p>
        </div>
        {saveMessage ? <span aria-live="polite" className="text-[10px] font-semibold text-neutral-400">{saveMessage}</span> : null}
      </div>
      <div className="mt-4 flex gap-1" aria-label={`Step ${step + 1} of ${steps.length}`}>
        {steps.map((item, index) => (
          <span key={item} className={`h-1 flex-1 rounded-full ${index <= step ? 'bg-brand' : 'bg-neutral-200'}`} />
        ))}
      </div>
    </header>
  )
}

export function nextEnrollmentWizardStep(current: number, skipFacility: boolean) {
  if (current === 3 && skipFacility) return 5
  return Math.min(current + 1, enrollmentSteps.length - 1)
}

export function previousEnrollmentWizardStep(current: number, skipFacility: boolean) {
  if (current === 5 && skipFacility) return 3
  return Math.max(current - 1, 0)
}
const titleOptions = [['mr', 'Mr'], ['mrs', 'Mrs'], ['miss', 'Miss'], ['ms', 'Ms'], ['dr', 'Dr'], ['chief', 'Chief'], ['rev', 'Rev'], ['alhaji', 'Alhaji'], ['hajia', 'Hajia'], ['other', 'Other']] as const
const maritalOptions = [['single', 'Single'], ['married', 'Married'], ['divorced', 'Divorced'], ['widowed', 'Widowed'], ['separated', 'Separated']] as const
const idOptions = [['nin', 'NIN'], ['national_id', 'National ID'], ['voters_card', "Voter's Card"], ['drivers_license', "Driver's License"], ['international_passport', 'International Passport'], ['other', 'Other']] as const
const bloodOptions = [['a_pos', 'A+'], ['a_neg', 'A-'], ['b_pos', 'B+'], ['b_neg', 'B-'], ['ab_pos', 'AB+'], ['ab_neg', 'AB-'], ['o_pos', 'O+'], ['o_neg', 'O-'], ['unknown', 'Unknown']] as const
const genotypeOptions = [['aa', 'AA'], ['as', 'AS'], ['ss', 'SS'], ['ac', 'AC'], ['sc', 'SC'], ['unknown', 'Unknown']] as const

export function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
  return <label className="flex flex-col gap-1.5 text-sm font-bold"><span>{label}{required ? <span className="text-red-600"> *</span> : null}</span>{children}{error && <span className="text-xs font-semibold text-red-600">{error}</span>}</label>
}

export interface EnrollmentStepProps {
  form: EnrollmentFormValues
  errors: Record<string, string>
  update: (name: keyof EnrollmentFormValues, value: string) => void
  handleFile: (purpose: 'passport' | 'id_document', event: ChangeEvent<HTMLInputElement>) => Promise<void>
  clearFile: (purpose: 'passport' | 'id_document') => Promise<void>
}

export function PersonalStep({ form, errors, update, handleFile, clearFile }: EnrollmentStepProps) {
  return <><FilePicker label="Passport photograph" name="passport" value={form.passportName} error={errors.passportFileId} accept="image/jpeg,image/png,image/webp" capture="user" icon={<Camera size={26} />} onChange={(event) => void handleFile('passport', event)} onClear={() => void clearFile('passport')} /><Field label="Beneficiary category" required error={errors.category}><select className="field" value={form.category} onChange={(e) => update('category', e.target.value)}><option value="">Select category</option>{BENEFICIARY_CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></Field><div className="grid grid-cols-3 gap-3"><Field label="Title" required error={errors.title}><select className="field" value={form.title} onChange={(e) => update('title', e.target.value)}><option value="">Select</option>{titleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><div className="col-span-2"><Field label="First name" required error={errors.firstName}><input className="field" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} /></Field></div></div><Field label="Middle name"><input className="field" value={form.middleName} onChange={(e) => update('middleName', e.target.value)} /></Field><Field label="Surname" required error={errors.lastName}><input className="field" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} /></Field><Field label="Gender" required error={errors.gender}><div className="grid grid-cols-2 gap-3">{([['male', 'Male'], ['female', 'Female']] as const).map(([value, label]) => <button type="button" key={value} className={form.gender === value ? 'primary-button' : 'secondary-button'} onClick={() => update('gender', value)}>{label}</button>)}</div></Field><Field label="Date of birth" required error={errors.dateOfBirth}><input type="date" className="field" max={new Date().toISOString().slice(0, 10)} value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} /></Field><Field label="Marital status" required error={errors.maritalStatus}><select className="field" value={form.maritalStatus} onChange={(e) => update('maritalStatus', e.target.value)}><option value="">Select</option>{maritalOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><div className="grid grid-cols-2 gap-3"><Field label="Blood group" error={errors.bloodGroup}><select className="field" value={form.bloodGroup} onChange={(e) => update('bloodGroup', e.target.value)}><option value="">Optional</option>{bloodOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Genotype" error={errors.genotype}><select className="field" value={form.genotype} onChange={(e) => update('genotype', e.target.value)}><option value="">Optional</option>{genotypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field></div></>
}

export function ResidenceStep({ form, errors, lgas, wards, update, lockWard, lockAddress }: EnrollmentStepProps & { lgas: string[]; wards: ReferenceWard[]; lockWard?: boolean; lockAddress?: boolean }) {
  return <><Field label="State of residence" required><input className="field bg-neutral-100 text-neutral-600" readOnly value={PLATEAU_STATE} /></Field><Field label="Local government area (LGA)" required error={errors.lgaOfResidence}><select className="field" disabled={lockWard} value={form.lgaOfResidence} onChange={(e) => update('lgaOfResidence', e.target.value)}><option value="">Select LGA</option>{lgas.map((lga) => <option key={lga} value={lga}>{lga}</option>)}</select></Field><Field label="Ward" required error={errors.wardId}><select className="field" disabled={lockWard || !form.lgaOfResidence} value={form.wardId} onChange={(e) => update('wardId', e.target.value)}><option value="">{form.lgaOfResidence ? 'Select assigned ward' : 'Select an LGA first'}</option>{wards.map((ward) => <option key={ward.id} value={ward.id}>{ward.name}</option>)}</select></Field><Field label="Residential address" required error={errors.residentialAddress}><textarea className={`field min-h-28 ${lockAddress ? 'bg-neutral-100 text-neutral-600' : ''}`} readOnly={lockAddress} value={form.residentialAddress} onChange={(e) => update('residentialAddress', e.target.value)} /></Field></>
}

export function ContactStep({ form, errors, update }: EnrollmentStepProps) {
  return <><Field label="Phone number" required error={errors.phone}><input className="field" inputMode="numeric" pattern="[0-9]*" placeholder="08012345678" type="tel" value={form.phone} onChange={(e) => update('phone', normalizePhoneNumber(e.target.value))} /></Field><Field label="Email address" error={errors.email}><input className="field" type="email" placeholder="Optional" value={form.email} onChange={(e) => update('email', e.target.value)} /></Field><Field label="Emergency contact number" error={errors.emergencyPhone}><input className="field" inputMode="numeric" pattern="[0-9]*" placeholder="Optional · 11 digits" type="tel" value={form.emergencyPhone} onChange={(e) => update('emergencyPhone', normalizePhoneNumber(e.target.value))} /></Field></>
}

export function BackgroundStep({ form, errors, update, handleFile, clearFile }: EnrollmentStepProps) {
  const ninRequired = form.idType === 'nin'
  return <><Field label="ID type" required error={errors.idType}><select className="field" value={form.idType} onChange={(e) => update('idType', e.target.value)}><option value="">Select</option>{idOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>{ninRequired && <Field label="NIN" required error={errors.nin}><input className="field" inputMode="numeric" pattern="[0-9]*" placeholder="10 digits" value={form.nin} onChange={(e) => update('nin', normalizeNin(e.target.value))} /></Field>}<FilePicker label="ID document" name="idDocument" value={form.idDocumentName} error={errors.idDocumentFileId} accept="image/jpeg,image/png,image/webp,application/pdf" icon={<FileText size={26} />} onChange={(event) => void handleFile('id_document', event)} onClear={() => void clearFile('id_document')} /></>
}

export function FacilityStep({ form, errors, facilities, ward, update, lockFacility }: EnrollmentStepProps & { facilities: ReferenceFacility[]; ward?: ReferenceWard; lockFacility?: boolean }) {
  const selectedFacility = facilities.find((facility) => facility.id === form.healthFacilityId)
  return <><div className="rounded-xl bg-success p-4 text-sm text-success-foreground"><strong>Enrollment ward:</strong> {ward?.name ?? 'Not selected'}</div>{lockFacility && selectedFacility
    ? <Field label="Health facility"><input className="field bg-neutral-100 text-neutral-600" readOnly value={selectedFacility.name} /></Field>
    : <Field label="Health facility" required error={errors.healthFacilityId}><select className="field" value={form.healthFacilityId} onChange={(e) => update('healthFacilityId', e.target.value)}><option value="">Select facility</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</select></Field>}</>
}

function FilePicker({ label, name, value, error, accept, capture, icon, onChange, onClear }: { label: string; name: string; value: string; error?: string; accept: string; capture?: 'user'; icon: ReactNode; onChange: (event: ChangeEvent<HTMLInputElement>) => void; onClear: () => void }) {
  return <div><p className="mb-2 text-sm font-bold">{label} <span className="text-red-600">*</span></p><div className={`rounded-xl border-2 border-dashed p-5 text-center ${error ? 'border-red-300 bg-red-50' : 'border-neutral-200 bg-neutral-50'}`}><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-white text-neutral-500">{value ? <Check className="text-green-700" /> : icon}</span><p className="mt-2 truncate text-sm font-bold">{value || 'No file selected'}</p><div className="mt-3 flex justify-center gap-2"><label className="secondary-button inline-flex items-center gap-2 !min-h-9 cursor-pointer !py-2 text-xs"><Upload size={14} />Choose file<input className="sr-only" type="file" name={name} accept={accept} capture={capture} onChange={onChange} /></label>{value && <button type="button" aria-label={`Remove ${label}`} className="secondary-button !min-h-9 !py-2 text-xs" onClick={onClear}><RotateCcw size={14} /></button>}</div></div>{error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}</div>
}

export function validateEnrollmentStep(form: EnrollmentFormValues, step: number) {
  const needed: Array<keyof EnrollmentFormValues> = step === 0
    ? ['category', 'passportFileId', 'title', 'firstName', 'lastName', 'gender', 'dateOfBirth', 'maritalStatus']
    : step === 1 ? ['lgaOfResidence', 'residentialAddress', 'wardId']
      : step === 2 ? ['phone']
        : step === 3 ? ['idType', 'idDocumentFileId']
          : step === 4 ? ['healthFacilityId'] : []
  const errors: Record<string, string> = {}
  for (const key of needed) if (!form[key].trim()) errors[key] = 'This field is required.'
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email.'
  if (step === 2 && !isValidPhoneNumber(form.phone)) errors.phone = 'Enter exactly 11 digits.'
  if (step === 2 && form.emergencyPhone && !isValidPhoneNumber(form.emergencyPhone)) errors.emergencyPhone = 'Enter exactly 11 digits.'
  if (step === 3 && form.idType === 'nin') {
    if (!form.nin.trim()) errors.nin = 'This field is required.'
    else if (!isValidNin(form.nin)) errors.nin = 'NIN must contain exactly 10 digits.'
  }
  return errors
}
