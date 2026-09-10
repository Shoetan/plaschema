import { ChevronRight, FilePenLine, UserRound } from 'lucide-react'

import type { EnrollmentFormValues, ReferenceFacility } from '@/features/enrollment/types'

type ReviewRole = 'head' | 'member'

function memberName(form: EnrollmentFormValues) {
  return [form.firstName, form.lastName].filter(Boolean).join(' ')
}

function memberInitials(form: EnrollmentFormValues) {
  return `${form.firstName[0] ?? ''}${form.lastName[0] ?? ''}`.toUpperCase() || '?'
}

function facilityName(facilities: ReferenceFacility[], facilityId: string) {
  return facilities.find((facility) => facility.id === facilityId)?.name ?? 'Not selected'
}

function reviewRows(form: EnrollmentFormValues, facilities: ReferenceFacility[], wardName?: string) {
  return [
    ['Category', form.category],
    ['Date of birth', form.dateOfBirth],
    ['Phone', form.phone],
    ...(form.emergencyPhone ? [['Emergency contact', form.emergencyPhone] as const] : []),
    ...(form.bloodGroup ? [['Blood group', form.bloodGroup] as const] : []),
    ...(form.genotype ? [['Genotype', form.genotype] as const] : []),
    ...(form.idType === 'nin' ? [['NIN', form.nin] as const] : []),
    ['Health facility', facilityName(facilities, form.healthFacilityId)],
    ...(wardName ? [['Ward', wardName] as const] : []),
  ]
}

export function HouseholdMemberReviewCard({
  form,
  role,
  memberLabel,
  facilities,
  wardName,
  onEdit,
}: {
  form: EnrollmentFormValues
  role: ReviewRole
  memberLabel?: string
  facilities: ReferenceFacility[]
  wardName?: string
  onEdit: () => void
}) {
  const name = memberName(form)
  return (
    <article className="card overflow-hidden p-0">
      <div className="flex items-start gap-3 p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold text-neutral-700">
          {memberInitials(form)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-bold">{name}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${role === 'head' ? 'bg-brand/20 text-neutral-800' : 'bg-neutral-100 text-neutral-600'}`}>
              {role === 'head' ? 'Head' : memberLabel ?? 'Member'}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500">{form.category || 'Category not set'}</p>
        </div>
        <button type="button" className="secondary-button !min-h-9 shrink-0 !px-3 !py-2 text-xs" onClick={onEdit}>
          <FilePenLine size={14} />
          Edit
        </button>
      </div>
      <dl className="space-y-2 border-t border-neutral-100 px-4 py-3 text-sm">
        {reviewRows(form, facilities, wardName).map(([label, value]) => (
          <div className="flex justify-between gap-4" key={label}>
            <dt className="shrink-0 text-neutral-500">{label}</dt>
            <dd className="break-words text-right font-semibold">{value.trim() || '—'}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}

export function HouseholdMemberReviewStep({
  form,
  role,
  facilities,
  wardName,
  onEdit,
}: {
  form: EnrollmentFormValues
  role: ReviewRole
  facilities: ReferenceFacility[]
  wardName?: string
  onEdit: () => void
}) {
  const name = memberName(form)
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-2 py-6">
      <div className="card w-full max-w-sm p-6 text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand/15 text-2xl font-bold text-neutral-800">
          {memberInitials(form)}
        </span>
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-neutral-400">
          {role === 'head' ? 'Household head' : 'Household member'}
        </p>
        <h2 className="mt-1 text-xl font-bold">{name}</h2>
        <p className="mt-2 text-sm text-neutral-500">Review the details below before continuing.</p>
        <dl className="mt-5 space-y-2 rounded-xl bg-neutral-50 p-4 text-left text-sm">
          {reviewRows(form, facilities, wardName).map(([label, value]) => (
            <div className="flex justify-between gap-4" key={label}>
              <dt className="shrink-0 text-neutral-500">{label}</dt>
              <dd className="break-words text-right font-semibold">{value.trim() || '—'}</dd>
            </div>
          ))}
        </dl>
        <button type="button" className="secondary-button mt-5 inline-flex w-full items-center justify-center gap-2" onClick={onEdit}>
          <FilePenLine size={16} />
          Edit details
        </button>
      </div>
      <p className="mt-4 flex items-center gap-1 text-xs text-neutral-400">
        <UserRound size={14} />
        Tap continue when everything looks correct
        <ChevronRight size={14} />
      </p>
    </div>
  )
}
