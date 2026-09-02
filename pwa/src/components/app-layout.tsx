import { Home, RefreshCw, UserRound, UsersRound, Wifi, WifiOff, Plus } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { UpdatePrompt } from '@/components/update-prompt'
import { useNetworkStatus } from '@/hooks/use-network-status'

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/beneficiaries', label: 'People', icon: UsersRound },
  { to: '/enroll', label: 'Enroll', icon: Plus, primary: true },
  { to: '/sync', label: 'Sync', icon: RefreshCw },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export function AppLayout() {
  const isOnline = useNetworkStatus()
  return (
    <div className="app-frame flex flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="" className="h-8 w-8" />
          <span className="font-bold">PLASCHEMA</span>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${isOnline ? 'bg-success text-success-foreground' : 'bg-amber-50 text-amber-700'}`}>
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}{isOnline ? 'Online' : 'Offline'}
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto pb-24"><Outlet /></main>
      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-[430px] items-end border-t border-neutral-200 bg-white px-1 pb-[max(.35rem,env(safe-area-inset-bottom))]">
        {navItems.map(({ to, label, icon: Icon, primary }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-bold ${isActive ? 'text-neutral-950' : 'text-neutral-400'}`}>
            <span className={primary ? '-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg' : 'flex h-6 items-center'}><Icon size={primary ? 24 : 20} /></span>
            {label}
          </NavLink>
        ))}
      </nav>
      <UpdatePrompt />
    </div>
  )
}
