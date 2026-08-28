import { ArrowLeft, FileText, MapPin, Phone, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'

import { StatusBadge } from '@/components/status-badge'
import { useAppStore } from '@/stores/app-store'

export function BeneficiaryDetailView({ beneficiaryId }: { beneficiaryId: string }) {
  const record = useAppStore((state) => state.beneficiaries.find((item) => item.id === beneficiaryId))
  if (!record) return <div className="flex min-h-[65dvh] flex-col items-center justify-center px-6 text-center"><h1 className="text-lg font-bold">Beneficiary not found</h1><p className="mt-2 text-sm text-neutral-500">This mock record may have been removed.</p><Link className="primary-button mt-5" to="/beneficiaries">Back to beneficiaries</Link></div>

  const sections = [
    { title: 'Personal details', icon: UserRound, rows: [['Full name', `${record.title} ${record.firstName} ${record.middleName} ${record.lastName}`], ['Gender', record.gender], ['Date of birth', record.dateOfBirth], ['Marital status', record.maritalStatus]] },
    { title: 'Contact', icon: Phone, rows: [['Phone', record.phone], ['Email', record.email || '—'], ['Emergency phone', record.emergencyPhone], ['Next of kin', `${record.nextOfKinFullName} · ${record.nextOfKinRelationship}`]] },
    { title: 'Location and care', icon: MapPin, rows: [['Ward', record.ward], ['LGA', record.lgaOfResidence], ['Address', record.residentialAddress], ['Health facility', record.healthFacility]] },
    { title: 'Documents', icon: FileText, rows: [['Passport', record.passportName], [record.idType, record.idDocumentName]] },
  ]

  return <div className="px-4 py-5">
    <Link to="/beneficiaries" className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-neutral-600"><ArrowLeft size={17} />Beneficiaries</Link>
    <div className="card p-5 text-center"><span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success text-xl font-bold text-success-foreground">{record.firstName[0]}{record.lastName[0]}</span><h1 className="mt-3 text-xl font-bold">{record.firstName} {record.lastName}</h1><p className="mt-1 font-mono text-xs text-neutral-400">{record.beneficiaryCode}</p><div className="mt-3"><StatusBadge status={record.syncStatus} /></div></div>
    <div className="mt-4 space-y-3">{sections.map(({ title, icon: Icon, rows }) => <section className="card p-4" key={title}><h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><Icon size={17} />{title}</h2><dl className="space-y-2">{rows.map(([label, value]) => <div className="flex justify-between gap-4 text-sm" key={label}><dt className="shrink-0 text-neutral-500">{label}</dt><dd className="break-words text-right font-semibold">{value.trim() || '—'}</dd></div>)}</dl></section>)}</div>
  </div>
}
