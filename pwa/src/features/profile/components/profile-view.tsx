import { Download, HelpCircle, LogOut, RefreshCw, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import { useAppStore } from '@/stores/app-store'

export function ProfileView() {
  const user = useAppStore((state) => state.user)!
  const pending = useAppStore((state) => state.beneficiaries.filter((record) => record.syncStatus !== 'Synced').length)
  const syncAll = useAppStore((state) => state.syncAll)
  const signOut = useAppStore((state) => state.signOut)
  const [message, setMessage] = useState('')
  const initials = user.name.split(' ').map((part) => part[0]).join('').slice(0, 2)

  function logout() {
    if (pending > 0) {
      setMessage(`Sync ${pending} pending mock record${pending === 1 ? '' : 's'} before signing out.`)
      return
    }
    signOut()
  }

  return <div className="space-y-5 px-4 py-6">
    <section className="flex flex-col items-center text-center"><span className="flex h-20 w-20 items-center justify-center rounded-full bg-success text-2xl font-bold text-success-foreground">{initials}</span><h1 className="mt-3 text-xl font-bold">{user.name}</h1><p className="font-mono text-xs text-neutral-400">{user.workerCode}</p><span className="mt-2 rounded-full bg-success px-3 py-1 text-xs font-bold text-success-foreground">Active</span></section>

    <section className="card divide-y divide-neutral-100 px-4">{[['Phone', user.phone], ['Email', user.email], ['Assigned wards', user.assignedWards.join(', ')], ['App version', 'Design demo 1.0']].map(([label, value]) => <div className="flex justify-between gap-4 py-3 text-sm" key={label}><span className="text-neutral-500">{label}</span><span className="text-right font-semibold">{value}</span></div>)}</section>

    {message && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">{message}</div>}
    <div className="space-y-3">
      <button className="primary-button flex w-full items-center justify-center gap-2" onClick={() => void syncAll()}><RefreshCw size={17} />Run mock sync</button>
      <button className="secondary-button flex w-full items-center justify-center gap-2" onClick={() => setMessage('To install: open your browser menu and choose “Add to Home Screen”.')}><Download size={17} />Install app help</button>
      <button className="secondary-button flex w-full items-center justify-center gap-2" onClick={() => setMessage('Contact your program administrator for support.')}><HelpCircle size={17} />Help and support</button>
      <button className="secondary-button flex w-full items-center justify-center gap-2 !border-red-200 !text-red-700" onClick={logout}><LogOut size={17} />Sign out</button>
    </div>
    <p className="flex items-center justify-center gap-1.5 text-center text-xs text-neutral-400"><ShieldCheck size={14} />Mock data only · No backend connected</p>
  </div>
}
