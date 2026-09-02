import { QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

import { AuthSessionGate } from '@/features/auth/components'
import { queryClient } from '@/lib/query-client'

export function AppProviders({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}><AuthSessionGate>{children}</AuthSessionGate></QueryClientProvider>
}
