import { Menu } from 'lucide-react'

interface AdminTopBarProps {
  onMenuOpen: () => void
  title: string
}

export function AdminTopBar({ onMenuOpen, title }: AdminTopBarProps) {
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

      <p className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</p>
    </header>
  )
}
