import {
  Building2,
  CreditCard,
  FileText,
  FolderOpen,
  HeartPulse,
  Home,
  LogOut,
  MapPin,
  Users,
  X,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Dialog } from 'radix-ui'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { useAuthStore } from '@/features/auth/stores/auth.store'

interface AdminSidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

const mainItems = [
  { path: '/admin', label: 'Dashboard', icon: Home, end: true },
  { path: '/admin/wards', label: 'Wards', icon: MapPin },
  { path: '/admin/beneficiaries', label: 'CBHI Enrolments', icon: Users },
  { path: '/admin/id-cards', label: 'ID Cards', icon: CreditCard },
  { path: '/admin/reports', label: 'Reports', icon: FileText },
]

const administrationItems = [
  { path: '/admin/field-workers', label: 'Field Workers', icon: HeartPulse },
  { path: '/admin/facilities', label: 'Facilities', icon: Building2 },
  { path: '/admin/capitation', label: 'Capitation', icon: CreditCard },
]

function SidebarLink({
  path,
  label,
  icon: Icon,
  end,
  onSelect,
}: (typeof mainItems)[number] & { onSelect: () => void }) {
  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-muted-foreground transition-colors',
          isActive && 'bg-card text-foreground shadow-card',
        )
      }
      end={end}
      onClick={onSelect}
      to={path}
    >
      <Icon className="size-5" aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  )
}

export function AdminSidebar({
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const initials = user?.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AD'

  function handleLogout() {
    queryClient.removeQueries({ queryKey: ['auth'] })
    logout()
  }

  const content = (
    <aside className="flex h-full w-full flex-col border-r bg-muted/40">
      <div className="flex h-[72px] shrink-0 items-center gap-3 px-6">
        <img className="size-10 object-contain" src="/logo.png" alt="" />
        <span className="text-2xl font-semibold tracking-tight">PLASCHEMA</span>
        <button
          aria-label="Close navigation"
          className="ml-auto rounded-lg p-2 hover:bg-muted lg:hidden"
          onClick={onMobileClose}
          type="button"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="px-4">
        <div className="flex items-center gap-3 rounded-lg bg-card px-3 py-2.5 shadow-card">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5">
        <nav aria-label="Main menu">
          <p className="px-3 pb-3 text-xs font-semibold text-muted-foreground">
            MAIN MENU
          </p>
          <div className="flex flex-col gap-1">
            {mainItems.map((item) => (
              <SidebarLink key={item.path} {...item} onSelect={onMobileClose} />
            ))}
          </div>
        </nav>

        <nav aria-label="Administration">
          <p className="px-3 pb-3 text-xs font-semibold text-muted-foreground">
            ADMINISTRATION
          </p>
          <div className="flex flex-col gap-1">
            {administrationItems.map((item) => (
              <SidebarLink key={item.path} {...item} onSelect={onMobileClose} />
            ))}
          </div>
        </nav>

        <nav aria-label="Generated files">
          <p className="px-3 pb-3 text-xs font-semibold text-muted-foreground">
            FILES
          </p>
          <SidebarLink
            icon={FolderOpen}
            label="Files"
            onSelect={onMobileClose}
            path="/admin/files"
          />
        </nav>
      </div>

      <div className="border-t p-4">
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={handleLogout}
          type="button"
        >
          <LogOut className="size-5" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  )

  return (
    <>
      <div className="hidden h-full w-[270px] shrink-0 lg:block">{content}</div>
      <Dialog.Root
        onOpenChange={(open) => {
          if (!open) onMobileClose()
        }}
        open={mobileOpen}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[270px] outline-none lg:hidden">
            <Dialog.Title className="sr-only">Admin navigation</Dialog.Title>
            {content}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
