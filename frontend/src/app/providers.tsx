import { QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { Toaster } from 'sonner'

import { AuthSessionGate } from '@/features/auth/components'
import { queryClient } from '@/lib/query-client'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionGate>{children}</AuthSessionGate>
      <Toaster closeButton richColors position="top-right" />
    </QueryClientProvider>
  )
}
