import { Download, HelpCircle, LogOut, RefreshCw, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import { useFieldWorkerLogout } from '@/features/auth/hooks'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useEnrollmentReferences, useEnrollmentSync, useLocalEnrollments, useReferenceSync } from '@/features/enrollment/hooks'

function formatDateTime(value: string | null) {
  if (!value) return 'Never'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not available' : new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function ProfileView() {
  const user = useAuthStore((state) => state.user)!
  const validation = useAuthStore((state) => state.validation)
  const enrollments = useLocalEnrollments(user.id)
  const sync = useEnrollmentSync()
  const referenceSync = useReferenceSync()
  const references = useEnrollmentReferences(user.id)
  const logout = useFieldWorkerLogout()
  const [message, setMessage] = useState('')
  const initials = user.name.split(' ').map((part) => part[0]).join('').slice(0, 2)
  const wardAccess = user.assignedWards.length === 0
    ? 'All wards'
    : user.assignedWards.map((ward) => `${ward.name} (${ward.lga})`).join(', ')

  return <div className="space-y-5 px-4 py-6">
    <section className="flex flex-col items-center text-center"><span aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-full bg-success text-2xl font-bold text-success-foreground">{initials}</span><h1 className="mt-3 text-xl font-bold">{user.name}</h1><p className="mt-1 break-all text-xs text-neutral-500">{user.email}</p><span className="mt-2 rounded-full bg-success px-3 py-1 text-xs font-bold text-success-foreground">Active</span>{validation === 'offline' && <span className="mt-2 text-xs font-semibold text-amber-700">Using saved profile · Awaiting online verification</span>}</section>

    <section className="card divide-y divide-neutral-100 px-4">{[['Phone', user.phone ?? 'Not provided'], ['Assigned wards', wardAccess], ['Last complete sync', formatDateTime(user.lastSyncedAt)], ['Enrollment data', references.metadata ? formatDateTime(references.metadata.syncedAt) : 'Not downloaded'], ['Pending on device', String(enrollments.filter((record) => record.syncStatus !== 'synced').length)], ['App version', 'PWA 1.0']].map(([label, value]) => <div className="flex justify-between gap-4 py-3 text-sm" key={label}><span className="shrink-0 text-neutral-500">{label}</span><span className="min-w-0 break-words text-right font-semibold">{value}</span></div>)}</section>

    {message && <div aria-live="polite" role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">{message}</div>}
    <div className="space-y-3">
      <button className="primary-button flex w-full items-center justify-center gap-2" disabled={!navigator.onLine || sync.isPending} onClick={() => sync.mutate()}><RefreshCw aria-hidden="true" className={sync.isPending ? 'animate-spin' : ''} size={17} />{sync.isPending ? 'Synchronizing…' : 'Synchronize now'}</button>
      <button className="secondary-button flex w-full items-center justify-center gap-2" disabled={!navigator.onLine || referenceSync.isPending} onClick={() => referenceSync.mutate()}><RefreshCw aria-hidden="true" className={referenceSync.isPending ? 'animate-spin' : ''} size={17} />Refresh wards and facilities</button>
      <button className="secondary-button flex w-full items-center justify-center gap-2" onClick={() => setMessage('To install: open your browser menu and choose “Add to Home Screen”.')}><Download aria-hidden="true" size={17} />Install app help</button>
      <button className="secondary-button flex w-full items-center justify-center gap-2" onClick={() => setMessage('Contact your programme administrator for support or password assistance.')}><HelpCircle aria-hidden="true" size={17} />Help and support</button>
      <button className="secondary-button flex w-full items-center justify-center gap-2 !border-red-200 !text-red-700" onClick={logout}><LogOut aria-hidden="true" size={17} />Sign out</button>
    </div>
    <p className="flex items-center justify-center gap-1.5 text-center text-xs text-neutral-400"><ShieldCheck aria-hidden="true" size={14} />Signed in as a PLASCHEMA field worker</p>
  </div>
}
