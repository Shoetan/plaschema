import { ArrowLeft, Camera, Check, FileText, RotateCcw, Upload } from 'lucide-react'
import { type ChangeEvent, type ReactNode, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { facilitiesByWard, wards } from '@/data/mock-data'
import { useAppStore } from '@/stores/app-store'
import type { EnrollmentDraft } from '@/types'

const steps = ['Personal', 'Residence', 'Contact', 'Background', 'Facility', 'Review']

interface FormState {
  passportName: string
  idDocumentName: string
  title: string
  firstName: string
  middleName: string
  lastName: string
  gender: string
  dateOfBirth: string
  maritalStatus: string
  phone: string
  email: string
  stateOfResidence: string
  lgaOfResidence: string
  residentialAddress: string
  ward: string
  healthFacility: string
  idType: string
  nextOfKinFullName: string
  emergencyPhone: string
  nextOfKinRelationship: string
}

const emptyForm: FormState = {
  passportName: '', idDocumentName: '', title: '', firstName: '', middleName: '', lastName: '',
  gender: '', dateOfBirth: '', maritalStatus: '', phone: '', email: '', stateOfResidence: 'Plateau',
  lgaOfResidence: '', residentialAddress: '', ward: '', healthFacility: '', idType: '',
  nextOfKinFullName: '', emergencyPhone: '', nextOfKinRelationship: '',
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
  return <label className="flex flex-col gap-1.5 text-sm font-bold">{label}{required && <span className="sr-only"> required</span>}{children}{error && <span className="text-xs font-semibold text-red-600">{error}</span>}</label>
}

export function EnrollmentView() {
  const navigate = useNavigate()
  const addEnrollment = useAppStore((state) => state.addEnrollment)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submittedId, setSubmittedId] = useState<string | null>(null)

  function update(name: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [name]: value, ...(name === 'ward' ? { healthFacility: '' } : {}) }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  function handleFile(name: 'passportName' | 'idDocumentName', event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const accepted = name === 'passportName' ? file.type.startsWith('image/') : file.type.startsWith('image/') || file.type === 'application/pdf'
    if (!accepted || file.size > 5 * 1024 * 1024) {
      setErrors((current) => ({ ...current, [name]: !accepted ? 'Choose an image or PDF allowed for this field.' : 'File must be 5 MB or smaller.' }))
      event.target.value = ''
      return
    }
    update(name, file.name)
    event.target.value = ''
  }

  function validateCurrentStep() {
    const needed: Array<keyof FormState> = step === 0
      ? ['passportName', 'title', 'firstName', 'lastName', 'gender', 'dateOfBirth', 'maritalStatus']
      : step === 1 ? ['stateOfResidence', 'lgaOfResidence', 'residentialAddress', 'ward']
      : step === 2 ? ['phone']
      : step === 3 ? ['idType', 'idDocumentName', 'nextOfKinFullName', 'emergencyPhone', 'nextOfKinRelationship']
      : step === 4 ? ['healthFacility'] : []
    const nextErrors: Record<string, string> = {}
    for (const key of needed) if (!form[key].trim()) nextErrors[key] = 'This field is required.'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function continueFlow() {
    if (!validateCurrentStep()) return
    if (step < steps.length - 1) {
      setStep((current) => current + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const draft: EnrollmentDraft = {
      ...form,
      id: crypto.randomUUID(),
      capturedAt: new Date().toISOString(),
      syncStatus: navigator.onLine ? 'Synced' : 'Pending',
    }
    const beneficiary = addEnrollment(draft)
    setSubmittedId(beneficiary.id)
  }

  if (submittedId) return <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-5 px-6 text-center">
    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success text-success-foreground"><Check size={42} /></span>
    <div><h1 className="text-xl font-bold">Enrollment saved</h1><p className="mt-2 text-sm text-neutral-500">This is a design demo. The record was added to local mock data.</p></div>
    <div className="flex w-full flex-col gap-3"><button className="primary-button" onClick={() => { setForm(emptyForm); setStep(0); setSubmittedId(null) }}>Enroll another</button><Link className="secondary-button" to={`/beneficiaries/${submittedId}`}>View beneficiary</Link></div>
  </div>

  return <div className="flex min-h-full flex-col">
    <header className="border-b border-neutral-200 bg-white px-4 py-4">
      <div className="flex items-center gap-3">
        <button aria-label="Go back" className="secondary-button !min-h-9 !rounded-full !p-2" onClick={() => step === 0 ? navigate(-1) : setStep((current) => current - 1)}><ArrowLeft size={18} /></button>
        <div><h1 className="font-bold">New enrollment</h1><p className="text-xs text-neutral-400">Step {step + 1} of {steps.length} · {steps[step]}</p></div>
      </div>
      <div className="mt-4 flex gap-1" aria-label={`Step ${step + 1} of ${steps.length}`}>{steps.map((item, index) => <span key={item} className={`h-1 flex-1 rounded-full ${index <= step ? 'bg-brand' : 'bg-neutral-200'}`} />)}</div>
    </header>

    <div className="flex-1 space-y-4 px-4 pb-28 pt-5">
      {step === 0 && <>
        <FilePicker label="Passport photograph" name="passportName" value={form.passportName} error={errors.passportName} accept="image/*" capture="user" icon={<Camera size={26} />} onChange={(event) => handleFile('passportName', event)} onClear={() => update('passportName', '')} />
        <div className="grid grid-cols-3 gap-3"><Field label="Title" required error={errors.title}><select className="field" value={form.title} onChange={(e) => update('title', e.target.value)}><option value="">Select</option>{['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Chief'].map((v) => <option key={v}>{v}</option>)}</select></Field><div className="col-span-2"><Field label="First name" required error={errors.firstName}><input className="field" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} /></Field></div></div>
        <Field label="Middle name"><input className="field" value={form.middleName} onChange={(e) => update('middleName', e.target.value)} /></Field>
        <Field label="Surname" required error={errors.lastName}><input className="field" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} /></Field>
        <Field label="Gender" required error={errors.gender}><div className="grid grid-cols-2 gap-3">{['Male', 'Female'].map((value) => <button type="button" key={value} className={form.gender === value ? 'primary-button' : 'secondary-button'} onClick={() => update('gender', value)}>{value}</button>)}</div></Field>
        <Field label="Date of birth" required error={errors.dateOfBirth}><input type="date" className="field" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} /></Field>
        <Field label="Marital status" required error={errors.maritalStatus}><select className="field" value={form.maritalStatus} onChange={(e) => update('maritalStatus', e.target.value)}><option value="">Select</option>{['Single', 'Married', 'Divorced', 'Widowed', 'Separated'].map((v) => <option key={v}>{v}</option>)}</select></Field>
      </>}

      {step === 1 && <>
        <Field label="State of residence" required error={errors.stateOfResidence}><input className="field" value={form.stateOfResidence} onChange={(e) => update('stateOfResidence', e.target.value)} /></Field>
        <Field label="Local government" required error={errors.lgaOfResidence}><input className="field" placeholder="e.g. Jos North" value={form.lgaOfResidence} onChange={(e) => update('lgaOfResidence', e.target.value)} /></Field>
        <Field label="Ward" required error={errors.ward}><select className="field" value={form.ward} onChange={(e) => update('ward', e.target.value)}><option value="">Select assigned ward</option>{wards.map((v) => <option key={v}>{v}</option>)}</select></Field>
        <Field label="Residential address" required error={errors.residentialAddress}><textarea className="field min-h-28" value={form.residentialAddress} onChange={(e) => update('residentialAddress', e.target.value)} /></Field>
      </>}

      {step === 2 && <>
        <Field label="Phone number" required error={errors.phone}><input className="field" inputMode="tel" placeholder="+234…" value={form.phone} onChange={(e) => update('phone', e.target.value)} /></Field>
        <Field label="Email address" error={errors.email}><input className="field" type="email" placeholder="Optional" value={form.email} onChange={(e) => update('email', e.target.value)} /></Field>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">Confirm the phone number with the beneficiary before continuing.</div>
      </>}

      {step === 3 && <>
        <Field label="ID type" required error={errors.idType}><select className="field" value={form.idType} onChange={(e) => update('idType', e.target.value)}><option value="">Select</option>{['NIN', 'National ID', "Voter's Card", "Driver's License", 'International Passport', 'Other'].map((v) => <option key={v}>{v}</option>)}</select></Field>
        <FilePicker label="ID document" name="idDocumentName" value={form.idDocumentName} error={errors.idDocumentName} accept="image/*,application/pdf" icon={<FileText size={26} />} onChange={(event) => handleFile('idDocumentName', event)} onClear={() => update('idDocumentName', '')} />
        <Field label="Next of kin full name" required error={errors.nextOfKinFullName}><input className="field" value={form.nextOfKinFullName} onChange={(e) => update('nextOfKinFullName', e.target.value)} /></Field>
        <Field label="Emergency phone" required error={errors.emergencyPhone}><input className="field" inputMode="tel" value={form.emergencyPhone} onChange={(e) => update('emergencyPhone', e.target.value)} /></Field>
        <Field label="Relationship" required error={errors.nextOfKinRelationship}><select className="field" value={form.nextOfKinRelationship} onChange={(e) => update('nextOfKinRelationship', e.target.value)}><option value="">Select</option>{['Spouse', 'Parent', 'Sibling', 'Child', 'Relative', 'Friend', 'Other'].map((v) => <option key={v}>{v}</option>)}</select></Field>
      </>}

      {step === 4 && <>
        <div className="rounded-xl bg-success p-4 text-sm text-success-foreground"><strong>Enrollment ward:</strong> {form.ward}<button className="ml-2 underline" onClick={() => setStep(1)}>Change</button></div>
        <Field label="Health facility" required error={errors.healthFacility}><select className="field" value={form.healthFacility} onChange={(e) => update('healthFacility', e.target.value)}><option value="">Select facility</option>{(facilitiesByWard[form.ward] ?? []).map((v) => <option key={v}>{v}</option>)}</select></Field>
      </>}

      {step === 5 && <Review form={form} onEdit={setStep} />}
    </div>

    <footer className="sticky bottom-[69px] z-20 flex gap-3 border-t border-neutral-200 bg-white px-4 py-3">
      {step > 0 && <button className="secondary-button flex-1" onClick={() => setStep((current) => current - 1)}>Back</button>}
      <button className="primary-button flex-[2]" onClick={continueFlow}>{step === 5 ? 'Save enrollment' : 'Save & continue'}</button>
    </footer>
  </div>
}

function FilePicker({ label, name, value, error, accept, capture, icon, onChange, onClear }: { label: string; name: string; value: string; error?: string; accept: string; capture?: 'user'; icon: ReactNode; onChange: (event: ChangeEvent<HTMLInputElement>) => void; onClear: () => void }) {
  return <div><p className="mb-2 text-sm font-bold">{label} <span className="text-red-600">*</span></p><div className={`rounded-xl border-2 border-dashed p-5 text-center ${error ? 'border-red-300 bg-red-50' : 'border-neutral-200 bg-neutral-50'}`}>
    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-white text-neutral-500">{value ? <Check className="text-green-700" /> : icon}</span>
    <p className="mt-2 truncate text-sm font-bold">{value || 'No file selected'}</p><p className="mt-1 text-xs text-neutral-400">Image or PDF where allowed · Maximum 5 MB</p>
    <div className="mt-3 flex justify-center gap-2"><label className="secondary-button inline-flex items-center gap-2 !min-h-9 cursor-pointer !py-2 text-xs"><Upload size={14} />Choose file<input className="sr-only" type="file" name={name} accept={accept} capture={capture} onChange={onChange} /></label>{value && <button className="secondary-button !min-h-9 !py-2 text-xs" onClick={onClear}><RotateCcw size={14} /></button>}</div>
  </div>{error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}</div>
}

function Review({ form, onEdit }: { form: FormState; onEdit: (step: number) => void }) {
  const sections = [
    { title: 'Personal', step: 0, rows: [['Name', `${form.title} ${form.firstName} ${form.middleName} ${form.lastName}`], ['Gender', form.gender], ['Date of birth', form.dateOfBirth], ['Passport', form.passportName]] },
    { title: 'Residence', step: 1, rows: [['Ward', form.ward], ['LGA', form.lgaOfResidence], ['Address', form.residentialAddress]] },
    { title: 'Contact', step: 2, rows: [['Phone', form.phone], ['Email', form.email || '—']] },
    { title: 'Background', step: 3, rows: [['ID', `${form.idType} · ${form.idDocumentName}`], ['Next of kin', form.nextOfKinFullName], ['Emergency phone', form.emergencyPhone]] },
    { title: 'Facility', step: 4, rows: [['Health facility', form.healthFacility]] },
  ]
  return <><p className="text-sm text-neutral-500">Review the mock record before saving.</p>{sections.map((section) => <section className="card p-4" key={section.title}><div className="mb-3 flex justify-between"><h2 className="text-sm font-bold">{section.title}</h2><button className="text-xs font-bold underline" onClick={() => onEdit(section.step)}>Edit</button></div><dl className="space-y-2">{section.rows.map(([label, value]) => <div className="flex justify-between gap-4 text-sm" key={label}><dt className="shrink-0 text-neutral-500">{label}</dt><dd className="text-right font-semibold">{value.trim() || '—'}</dd></div>)}</dl></section>)}</>
}
