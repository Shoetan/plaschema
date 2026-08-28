import { Bell, Menu, Search } from 'lucide-react'

interface AdminTopBarProps {
  onMenuOpen: () => void
}

export function AdminTopBar({ onMenuOpen }: AdminTopBarProps) {
  return (
    <header className="flex h-[72px] shrink-0 items-center gap-4 border-b bg-card px-4 md:px-6">
      <button
        aria-label="Open navigation"
        className="rounded-lg p-2 hover:bg-muted lg:hidden"
        onClick={onMenuOpen}
        type="button"
      >
        <Menu className="size-5" />
      </button>

      <label className="flex h-10 w-full max-w-[265px] items-center gap-2 rounded-full border bg-card px-3 opacity-60 shadow-sm">
        <Search className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Global search unavailable</span>
        <input
          className="min-w-0 flex-1 bg-transparent text-xs outline-none"
          disabled
          placeholder="Search unavailable"
        />
      </label>

      <div className="flex-1" />
      <button
        aria-label="Notifications unavailable"
        className="flex size-9 items-center justify-center rounded-full opacity-50"
        disabled
        type="button"
      >
        <Bell className="size-5" />
      </button>
    </header>
  )
}
