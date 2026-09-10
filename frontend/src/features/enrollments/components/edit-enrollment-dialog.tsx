import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, Search, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { getApiErrorMessage } from '@/api'
import { btnPrimary, btnSecondary } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useHealthFacilities } from '@/features/facilities/hooks'
import { useWardOptions } from '@/features/wards/hooks'
import type { WardListItem } from '@/features/wards/types'

import { useUpdateEnrollmentProfile } from '../hooks'
import type { EnrollmentRecord, UpdateEnrollmentProfilePayload } from '../types'
import { BENEFICIARY_CATEGORIES, PLATEAU_LGAS } from '../utils'

const schema = z.object({
  category: z.string().min(2),
  title: z.enum(['mr', 'mrs', 'miss', 'ms', 'dr', 'chief', 'rev', 'alhaji', 'hajia', 'other']),
  gender: z.enum(['male', 'female']),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  middleName: z.string().max(80),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phone: z.string().trim().min(1).max(30),
  email: z.string().max(160),
  nin: z.string().max(20),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed', 'separated']),
  bloodGroup: z.enum(['a_pos', 'a_neg', 'b_pos', 'b_neg', 'ab_pos', 'ab_neg', 'o_pos', 'o_neg', 'unknown', '']),
  genotype: z.enum(['aa', 'as', 'ss', 'ac', 'sc', 'unknown', '']),
  idType: z.enum(['nin', 'national_id', 'voters_card', 'drivers_license', 'international_passport', 'other']),
  emergencyPhone: z.string().max(30),
  stateOfResidence: z.string().trim().min(1).max(80),
  lgaOfResidence: z.string().trim().min(1).max(120),
  residentialAddress: z.string().trim().min(1).max(300),
  wardId: z.string().min(1),
  healthFacilityId: z.string().min(1),
})

type Values = z.infer<typeof schema>

interface EditEnrollmentDialogProps {
  record: EnrollmentRecord
  open: boolean
  onOpenChange: (open: boolean) => void
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function buildPayload(record: EnrollmentRecord, values: Values): UpdateEnrollmentProfilePayload {
  const payload: UpdateEnrollmentProfilePayload = {}
  if (values.category !== record.category) payload.category = values.category
  if (values.title !== record.title) payload.title = values.title
  if (values.gender !== record.gender) payload.gender = values.gender
  if (values.firstName !== record.firstName) payload.firstName = values.firstName
  if (values.lastName !== record.lastName) payload.lastName = values.lastName
  const middleName = emptyToNull(values.middleName)
  if (middleName !== record.middleName) payload.middleName = middleName
  if (values.dateOfBirth !== record.dateOfBirth) payload.dateOfBirth = values.dateOfBirth
  if (values.phone !== record.phone) payload.phone = values.phone
  const email = emptyToNull(values.email)?.toLowerCase() ?? null
  if (email !== record.email) payload.email = email
  const nin = emptyToNull(values.nin)
  if (nin !== record.nin) payload.nin = nin
  if (values.maritalStatus !== record.maritalStatus) payload.maritalStatus = values.maritalStatus
  const bloodGroup = values.bloodGroup ? values.bloodGroup : null
  if (bloodGroup !== record.bloodGroup) payload.bloodGroup = bloodGroup
  const genotype = values.genotype ? values.genotype : null
  if (genotype !== record.genotype) payload.genotype = genotype
  if (values.idType !== record.idType) payload.idType = values.idType
  const emergencyPhone = emptyToNull(values.emergencyPhone)
  if (emergencyPhone !== record.emergencyPhone) payload.emergencyPhone = emergencyPhone
  if (values.stateOfResidence !== record.stateOfResidence) payload.stateOfResidence = values.stateOfResidence
  if (values.lgaOfResidence !== record.lgaOfResidence) payload.lgaOfResidence = values.lgaOfResidence
  if (values.residentialAddress !== record.residentialAddress) payload.residentialAddress = values.residentialAddress
  if (values.wardId !== record.wardId) payload.wardId = values.wardId
  if (values.healthFacilityId !== record.healthFacilityId) payload.healthFacilityId = values.healthFacilityId
  return payload
}

export function EditEnrollmentDialog({ record, open, onOpenChange }: EditEnrollmentDialogProps) {
  const [wardSearch, setWardSearch] = useState('')
  const [debouncedWardSearch, setDebouncedWardSearch] = useState('')
  const [facilitySearch, setFacilitySearch] = useState('')
  const [debouncedFacilitySearch, setDebouncedFacilitySearch] = useState('')
  const mutation = useUpdateEnrollmentProfile()
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: record.category,
      title: record.title,
      gender: record.gender,
      firstName: record.firstName,
      lastName: record.lastName,
      middleName: record.middleName ?? '',
      dateOfBirth: record.dateOfBirth,
      phone: record.phone,
      email: record.email ?? '',
      nin: record.nin ?? '',
      maritalStatus: record.maritalStatus,
      bloodGroup: record.bloodGroup ?? '',
      genotype: record.genotype ?? '',
      idType: record.idType,
      emergencyPhone: record.emergencyPhone ?? '',
      stateOfResidence: record.stateOfResidence,
      lgaOfResidence: record.lgaOfResidence,
      residentialAddress: record.residentialAddress,
      wardId: record.wardId,
      healthFacilityId: record.healthFacilityId,
    },
  })

  const wardId = useWatch({ control, name: 'wardId' })
  const wardsQuery = useWardOptions(debouncedWardSearch)
  const facilitiesQuery = useHealthFacilities({
    limit: 100,
    wardId,
    search: debouncedFacilitySearch || undefined,
  })

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedWardSearch(wardSearch.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [wardSearch])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedFacilitySearch(facilitySearch.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [facilitySearch])

  const wards = useMemo(() => {
    const byId = new Map<string, WardListItem>([[record.ward.id, {
      id: record.ward.id,
      name: record.ward.name,
      lga: record.ward.lga,
      state: 'Plateau',
      fieldWorkers: 0,
      beneficiaries: 0,
      newEnrollments: 0,
      status: 'active',
    }]])
    for (const ward of wardsQuery.data?.pages.flatMap((page) => page.items) ?? []) {
      byId.set(ward.id, ward)
    }
    return [...byId.values()]
  }, [record.ward, wardsQuery.data])

  const facilities = useMemo(() => {
    const items = facilitiesQuery.data?.items ?? []
    if (!items.some((item) => item.id === record.healthFacility.id)) {
      return [record.healthFacility, ...items]
    }
    return items
  }, [facilitiesQuery.data, record.healthFacility])

  const selectedWard = wards.find((ward) => ward.id === wardId)

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen && mutation.isPending) return
    onOpenChange(nextOpen)
  }

  function submit(values: Values) {
    const payload = buildPayload(record, values)
    if (Object.keys(payload).length === 0) {
      toast.info('No beneficiary changes to save.')
      changeOpen(false)
      return
    }
    mutation.mutate({ id: record.id, payload }, { onSuccess: () => changeOpen(false) })
  }

  return (
    <Dialog.Root onOpenChange={changeOpen} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-card shadow-2xl outline-none" onEscapeKeyDown={(event) => mutation.isPending && event.preventDefault()} onInteractOutside={(event) => mutation.isPending && event.preventDefault()}>
          <div className="flex items-start justify-between border-b border-border px-6 py-5">
            <div>
              <Dialog.Title className="text-lg font-semibold">Edit beneficiary</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">Update profile and enrollment details. Changes are recorded in the activity log.</Dialog.Description>
            </div>
            <Button aria-label="Close edit beneficiary dialog" disabled={mutation.isPending} onClick={() => changeOpen(false)} size="icon" variant="ghost"><X aria-hidden="true" /></Button>
          </div>
          <form onSubmit={handleSubmit(submit)}>
            <div className="space-y-6 px-6 py-5">
              {mutation.isError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{getApiErrorMessage(mutation.error, 'Unable to update beneficiary details.')}</div>}

              <section className="space-y-4">
                <h3 className="text-sm font-semibold">Personal details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-category">Category</label><select {...register('category', { onChange: () => mutation.reset() })} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" id="edit-category">{BENEFICIARY_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
                  <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-title">Title</label><select {...register('title', { onChange: () => mutation.reset() })} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" id="edit-title"><option value="mr">Mr</option><option value="mrs">Mrs</option><option value="miss">Miss</option><option value="ms">Ms</option><option value="dr">Dr</option><option value="chief">Chief</option><option value="rev">Rev</option><option value="alhaji">Alhaji</option><option value="hajia">Hajia</option><option value="other">Other</option></select></div>
                  <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-first-name">First name</label><Input {...register('firstName', { onChange: () => mutation.reset() })} aria-invalid={Boolean(errors.firstName)} id="edit-first-name" />{errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName.message}</p>}</div>
                  <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-last-name">Last name</label><Input {...register('lastName', { onChange: () => mutation.reset() })} aria-invalid={Boolean(errors.lastName)} id="edit-last-name" />{errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName.message}</p>}</div>
                  <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-middle-name">Middle name</label><Input {...register('middleName', { onChange: () => mutation.reset() })} id="edit-middle-name" placeholder="Optional" /></div>
                  <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-gender">Gender</label><select {...register('gender', { onChange: () => mutation.reset() })} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" id="edit-gender"><option value="male">Male</option><option value="female">Female</option></select></div>
                  <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-dob">Date of birth</label><Input {...register('dateOfBirth', { onChange: () => mutation.reset() })} aria-invalid={Boolean(errors.dateOfBirth)} id="edit-dob" type="date" />{errors.dateOfBirth && <p className="mt-1 text-xs text-destructive">Use YYYY-MM-DD.</p>}</div>
                  <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-marital-status">Marital status</label><select {...register('maritalStatus', { onChange: () => mutation.reset() })} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" id="edit-marital-status"><option value="single">Single</option><option value="married">Married</option><option value="divorced">Divorced</option><option value="widowed">Widowed</option><option value="separated">Separated</option></select></div>
                  <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-blood-group">Blood group</label><select {...register('bloodGroup', { onChange: () => mutation.reset() })} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" id="edit-blood-group"><option value="">Not provided</option><option value="a_pos">A+</option><option value="a_neg">A-</option><option value="b_pos">B+</option><option value="b_neg">B-</option><option value="ab_pos">AB+</option><option value="ab_neg">AB-</option><option value="o_pos">O+</option><option value="o_neg">O-</option><option value="unknown">Unknown</option></select></div>
                  <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-genotype">Genotype</label><select {...register('genotype', { onChange: () => mutation.reset() })} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" id="edit-genotype"><option value="">Not provided</option><option value="aa">AA</option><option value="as">AS</option><option value="ss">SS</option><option value="ac">AC</option><option value="sc">SC</option><option value="unknown">Unknown</option></select></div>
                  <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-nin">NIN</label><Input {...register('nin', { onChange: () => mutation.reset() })} id="edit-nin" placeholder="Optional" /></div>
                  <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-id-type">ID document type</label><select {...register('idType', { onChange: () => mutation.reset() })} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" id="edit-id-type"><option value="nin">NIN</option><option value="national_id">National ID</option><option value="voters_card">Voter&apos;s card</option><option value="drivers_license">Driver&apos;s license</option><option value="international_passport">International passport</option><option value="other">Other</option></select></div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold">Contact</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-phone">Phone</label><Input {...register('phone', { onChange: () => mutation.reset() })} aria-invalid={Boolean(errors.phone)} id="edit-phone" />{errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}</div>
                  <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-email">Email</label><Input {...register('email', { onChange: () => mutation.reset() })} id="edit-email" placeholder="Optional" type="email" /></div>
                  <div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-emergency-phone">Emergency contact</label><Input {...register('emergencyPhone', { onChange: () => mutation.reset() })} id="edit-emergency-phone" placeholder="Optional" /></div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold">Address and placement</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-state">State</label><Input id="edit-state" readOnly value="Plateau" /></div>
                  <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-lga">LGA of residence</label><select {...register('lgaOfResidence', { onChange: () => mutation.reset() })} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" id="edit-lga">{PLATEAU_LGAS.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
                  <div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-semibold" htmlFor="edit-address">Residential address</label><Input {...register('residentialAddress', { onChange: () => mutation.reset() })} aria-invalid={Boolean(errors.residentialAddress)} id="edit-address" />{errors.residentialAddress && <p className="mt-1 text-xs text-destructive">{errors.residentialAddress.message}</p>}</div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-sm font-semibold" htmlFor="edit-ward-search">Ward</label>
                    <div className="relative"><Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" id="edit-ward-search" onChange={(event) => setWardSearch(event.target.value)} placeholder="Search wards..." value={wardSearch} /></div>
                    <select {...register('wardId', { onChange: () => { mutation.reset(); setValue('healthFacilityId', '') } })} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" id="edit-ward"><option value="">Select ward</option>{wards.map((ward) => <option key={ward.id} value={ward.id}>{ward.name} — {ward.lga}</option>)}</select>
                    {wardsQuery.hasNextPage && <Button disabled={wardsQuery.isFetchingNextPage} onClick={() => void wardsQuery.fetchNextPage()} type="button" variant="outline">{wardsQuery.isFetchingNextPage ? 'Loading…' : 'Load more wards'}</Button>}
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-sm font-semibold" htmlFor="edit-facility-search">Health facility</label>
                    <div className="relative"><Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" id="edit-facility-search" onChange={(event) => setFacilitySearch(event.target.value)} placeholder="Search facilities..." value={facilitySearch} /></div>
                    <select {...register('healthFacilityId', { onChange: () => mutation.reset() })} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" disabled={!wardId} id="edit-facility"><option value="">{wardId ? 'Select facility' : 'Select a ward first'}</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</select>
                    {selectedWard && <p className="text-xs text-muted-foreground">Selected ward: {selectedWard.name}, {selectedWard.lga}</p>}
                  </div>
                </div>
              </section>
            </div>
            <div className="flex gap-3 border-t border-border px-6 py-5">
              <Button className={`${btnSecondary} flex-1`} disabled={mutation.isPending} onClick={() => changeOpen(false)} type="button" variant="outline">Cancel</Button>
              <Button className={`${btnPrimary} flex-1`} disabled={mutation.isPending} type="submit">{mutation.isPending ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> Saving…</> : 'Save changes'}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
