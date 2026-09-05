import { Check, ChevronsUpDown, LoaderCircle, Search } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useState } from 'react'

export interface SearchableFilterOption {
  id: string
  label: string
  description?: string
}

interface SearchableFilterSelectProps {
  label: string
  allLabel: string
  searchPlaceholder: string
  emptyText: string
  value: SearchableFilterOption | null
  options: SearchableFilterOption[]
  search: string
  loading?: boolean
  onSearchChange: (value: string) => void
  onSelect: (option: SearchableFilterOption | null) => void
}

export function SearchableFilterSelect({
  label,
  allLabel,
  searchPlaceholder,
  emptyText,
  value,
  options,
  search,
  loading = false,
  onSearchChange,
  onSelect,
}: SearchableFilterSelectProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="grid gap-1 text-xs font-medium text-muted-foreground">
      <span>{label}</span>
      <Popover.Root open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) onSearchChange('') }}>
        <Popover.Trigger asChild>
          <button
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={`Filter by ${label.toLowerCase()}`}
            className="flex h-10 min-w-0 items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 text-left text-sm font-normal text-foreground"
            type="button"
          >
            <span className="truncate">{value?.label ?? allLabel}</span>
            <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            className="z-50 w-[var(--radix-popover-trigger-width)] min-w-64 rounded-xl border border-border bg-card p-2 shadow-xl"
            sideOffset={5}
          >
            <div className="relative">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                aria-label={`Search ${label.toLowerCase()} options`}
                autoFocus
                className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm text-foreground outline-none focus:border-primary"
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                value={search}
              />
              {loading && <LoaderCircle aria-label="Loading options" className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            </div>
            <div className="mt-2 max-h-60 overflow-y-auto" role="listbox">
              <Popover.Close asChild>
                <button
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-normal text-foreground hover:bg-muted"
                  onClick={() => onSelect(null)}
                  role="option"
                  aria-selected={!value}
                  type="button"
                >
                  {allLabel}
                  {!value && <Check aria-hidden="true" className="size-4 text-primary" />}
                </button>
              </Popover.Close>
              {options.map((option) => (
                <Popover.Close asChild key={option.id}>
                  <button
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-normal text-foreground hover:bg-muted"
                    onClick={() => onSelect(option)}
                    role="option"
                    aria-selected={value?.id === option.id}
                    type="button"
                  >
                    <span className="min-w-0"><span className="block truncate">{option.label}</span>{option.description && <span className="block truncate text-xs text-muted-foreground">{option.description}</span>}</span>
                    {value?.id === option.id && <Check aria-hidden="true" className="size-4 shrink-0 text-primary" />}
                  </button>
                </Popover.Close>
              ))}
              {!loading && options.length === 0 && <p className="px-3 py-6 text-center text-sm font-normal text-muted-foreground">{emptyText}</p>}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
