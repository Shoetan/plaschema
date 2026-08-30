import { LoaderCircle, RefreshCw, Search, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useEffect, useMemo, useState } from 'react'

import { getApiErrorMessage } from '@/api'
import { btnPrimary, btnSecondary } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useAssignableFieldWorkers } from '@/features/field-workers/hooks'
import type { AssignableFieldWorker } from '@/features/field-workers/types'

import { useAssignWardFieldWorkers } from '../hooks'
import type { WardDetailFieldWorker } from '../types'

interface AssignFieldWorkersDialogProps {
  open: boolean
  wardId: string
  wardName: string
  currentWorkers: WardDetailFieldWorker[]
  onOpenChange: (open: boolean) => void
}

export function AssignFieldWorkersDialog({ open, wardId, wardName, currentWorkers, onOpenChange }: AssignFieldWorkersDialogProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(currentWorkers.map((worker) => worker.id)),
  )
  const workersQuery = useAssignableFieldWorkers(debouncedSearch)
  const mutation = useAssignWardFieldWorkers()

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const workers = useMemo(() => {
    const byId = new Map<string, AssignableFieldWorker | WardDetailFieldWorker>()
    for (const worker of currentWorkers) byId.set(worker.id, worker)
    for (const page of workersQuery.data?.pages ?? []) {
      for (const worker of page.items) byId.set(worker.id, worker)
    }
    const normalizedSearch = debouncedSearch.toLowerCase()
    return [...byId.values()].filter((worker) =>
      !normalizedSearch || worker.name.toLowerCase().includes(normalizedSearch) || (worker.phone ?? '').toLowerCase().includes(normalizedSearch),
    )
  }, [currentWorkers, debouncedSearch, workersQuery.data])

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen && mutation.isPending) return
    onOpenChange(nextOpen)
  }

  function toggleWorker(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
    mutation.reset()
  }

  function submit() {
    mutation.mutate({ id: wardId, fieldWorkerIds: [...selectedIds] }, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog.Root onOpenChange={changeOpen} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-card shadow-2xl outline-none" onEscapeKeyDown={(event) => mutation.isPending && event.preventDefault()} onInteractOutside={(event) => mutation.isPending && event.preventDefault()}>
          <div className="flex items-start justify-between border-b border-border px-6 py-5">
            <div>
              <Dialog.Title className="text-lg font-semibold">Assign Field Workers</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">Choose the field workers assigned to {wardName}. Saving replaces the current list.</Dialog.Description>
            </div>
            <Button aria-label="Close assignment dialog" disabled={mutation.isPending} onClick={() => changeOpen(false)} size="icon" variant="ghost"><X aria-hidden="true" /></Button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-5">
            {mutation.isError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{getApiErrorMessage(mutation.error, 'Unable to assign the field workers.')}</div>}
            <div className="relative">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Search field workers" className="pl-9" onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or phone..." value={search} />
            </div>
            <p className="text-sm text-muted-foreground" aria-live="polite">{selectedIds.size} selected</p>
            <div className="min-h-40 flex-1 overflow-y-auto rounded-lg border border-border">
              {workersQuery.isPending ? (
                <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><LoaderCircle aria-hidden="true" className="animate-spin" /> Loading field workers…</div>
              ) : workersQuery.isError ? (
                <div className="flex flex-col items-center gap-3 p-8 text-center" role="alert">
                  <p className="text-sm text-muted-foreground">Unable to load field workers.</p>
                  <Button onClick={() => void workersQuery.refetch()} variant="outline"><RefreshCw aria-hidden="true" /> Retry</Button>
                </div>
              ) : workers.length === 0 ? (
                <p className="p-10 text-center text-sm text-muted-foreground">No field workers match this search.</p>
              ) : (
                <div className="divide-y divide-border">
                  {workers.map((worker) => {
                    const checkboxId = `assign-worker-${worker.id}`
                    return (
                      <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/40" htmlFor={checkboxId} key={worker.id}>
                        <Checkbox checked={selectedIds.has(worker.id)} disabled={mutation.isPending} id={checkboxId} onCheckedChange={(checked) => toggleWorker(worker.id, checked === true)} />
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{worker.name}</span><span className="block truncate text-xs text-muted-foreground">{worker.phone ?? 'No phone number'}</span></span>
                        <span className="text-xs capitalize text-muted-foreground">{worker.status}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
            {workersQuery.hasNextPage && <Button disabled={workersQuery.isFetchingNextPage} onClick={() => void workersQuery.fetchNextPage()} variant="outline">{workersQuery.isFetchingNextPage ? 'Loading…' : 'Load more field workers'}</Button>}
          </div>
          <div className="flex gap-3 border-t border-border px-6 py-5">
            <Button className={`${btnSecondary} flex-1`} disabled={mutation.isPending} onClick={() => changeOpen(false)} variant="outline">Cancel</Button>
            <Button className={`${btnPrimary} flex-1`} disabled={mutation.isPending || workersQuery.isPending || workersQuery.isError} onClick={submit}>
              {mutation.isPending ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> Saving…</> : 'Save Assignments'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
