import { ArrowLeft, FilePenLine, FileText, MapPin, Phone, RefreshCw, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { StatusBadge } from '@/components/status-badge'
import { useEnrollmentSync, useLocalEnrollment } from '@/features/enrollment/hooks'
import { discardLocalEnrollment, restoreFailedEnrollmentAsDraft, retryLocalEnrollment } from '@/features/enrollment/services'

function duplicateReference(details: unknown) {
  if (!details || typeof details !== 'object') return null
  const value = (details as { enrollmentId?: unknown }).enrollmentId
  return typeof value === 'string' ? value : null
}

export function BeneficiaryDetailView({ beneficiaryId }: { beneficiaryId: string }) {
  const navigate = useNavigate()
  const record = useLocalEnrollment(beneficiaryId)
  const sync = useEnrollmentSync()
  const [actionError, setActionError] = useState('')
  if (record === undefined) return <Centered title="Opening enrollment" text="Reading the saved record from this device…" />
  if (!record) return <Centered title="Enrollment not found" text="It may have expired from the offline cache or been removed." action={<Link className="primary-button mt-5" to="/beneficiaries">Back to People</Link>} />

  const form = record.form
  const localId = record.localId
  const duplicate = duplicateReference(record.errorDetails)
  const sections = [
    { title: 'Personal details', icon: UserRound, rows: [['Full name', `${form.title} ${form.firstName} ${form.middleName} ${form.lastName}`], ['Category', form.category], ['Gender', form.gender], ['Date of birth', form.dateOfBirth], ['Marital status', form.maritalStatus], ['Blood group', form.bloodGroup || '—'], ['Genotype', form.genotype || '—']] },
    { title: 'Contact', icon: Phone, rows: [['Phone', form.phone], ['Email', form.email || '—'], ['Next of kin', form.nextOfKinFullName || '—'], ['Relationship', form.nextOfKinRelationship || '—']] },
    { title: 'Location and care', icon: MapPin, rows: [['Ward', record.wardName], ['LGA', form.lgaOfResidence], ['Address', form.residentialAddress], ['Health facility', record.facilityName]] },
    { title: 'Documents', icon: FileText, rows: [['Passport', form.passportName], [form.idType || 'ID document', form.idDocumentName], ['NIN', form.nin || '—']] },
  ]

  async function retry() {
    await retryLocalEnrollment(localId)
    sync.mutate()
  }

  async function discard() {
    if (!window.confirm('Remove this enrollment and its unsent files from this device? This cannot be undone.')) return
    await discardLocalEnrollment(localId)
    navigate('/beneficiaries', { replace: true })
  }

  async function edit() {
    setActionError('')
    try {
      await restoreFailedEnrollmentAsDraft(localId)
      navigate('/enroll')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'This enrollment could not be opened for editing.')
    }
  }

  return <div className="px-4 py-5">
    <Link to="/beneficiaries" className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-neutral-600"><ArrowLeft size={17} />People</Link>
    <div className="card p-5 text-center"><span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success text-xl font-bold text-success-foreground">{form.firstName[0]}{form.lastName[0]}</span><h1 className="mt-3 text-xl font-bold">{form.firstName} {form.lastName}</h1><p className="mt-1 font-mono text-xs text-neutral-400">{record.enrollmentId ?? `Local · ${record.localId.slice(0, 8)}`}</p><div className="mt-3"><StatusBadge status={record.syncStatus} /></div></div>
    {record.errorMessage && <section role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4"><h2 className="text-sm font-bold text-red-800">Synchronization needs attention</h2><p className="mt-1 text-sm text-red-700">{record.errorMessage}</p>{duplicate && <p className="mt-2 text-xs font-semibold text-red-700">Existing enrollment: {duplicate}</p>}{actionError && <p className="mt-2 text-xs font-semibold text-red-700">{actionError}</p>}<div className="mt-3 grid grid-cols-3 gap-2"><button className="secondary-button !min-h-9 !py-2 text-xs" onClick={() => void edit()}><FilePenLine size={14} /> Edit</button><button className="secondary-button !min-h-9 !py-2 text-xs" disabled={!navigator.onLine || sync.isPending} onClick={() => void retry()}><RefreshCw size={14} /> Retry</button><button className="secondary-button !min-h-9 !border-red-200 !py-2 text-xs !text-red-700" onClick={() => void discard()}><Trash2 size={14} /> Discard</button></div></section>}
    <div className="mt-4 space-y-3">{sections.map(({ title, icon: Icon, rows }) => <section className="card p-4" key={title}><h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><Icon size={17} />{title}</h2><dl className="space-y-2">{rows.map(([label, value]) => <div className="flex justify-between gap-4 text-sm" key={label}><dt className="shrink-0 text-neutral-500">{label}</dt><dd className="break-words text-right font-semibold">{value.trim() || '—'}</dd></div>)}</dl></section>)}</div>
  </div>
}

function Centered({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return <div className="flex min-h-[65dvh] flex-col items-center justify-center px-6 text-center"><h1 className="text-lg font-bold">{title}</h1><p className="mt-2 text-sm text-neutral-500">{text}</p>{action}</div>
}
