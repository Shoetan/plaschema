# Feature Folder Structure — Handoff Guide

## Root structure

```text
src/
├── types/
└── features/
    └── [feature]/
```

## Feature folder anatomy

```text
src/features/[feature]/
├── components/
├── hooks/
├── services/
├── stores/
├── types/
└── utils/
```

## The three layers

### Layer 1 — Service (`services/[feature].service.ts`)

```ts
import { _get } from '@/api'

export async function fetchVerifications(state: VerificationTableState) {
  const params = new URLSearchParams({
    page: String(state.pagination.page),
    pageSize: String(state.pagination.pageSize),
  })

  if (state.filters.referenceId) {
    params.set('referenceId', state.filters.referenceId)
  }
  if (state.filters.status) params.set('status', state.filters.status)

  const response = await _get<VerificationListResponse>(
    `/verifications?${params.toString()}`,
  )
  return response.data.data
}
```

Rules:

- This is the only layer allowed to call `_get`, `_post`, `_put`, or `_delete`.
- Never import a service directly in a component.
- Return raw, unwrapped data.
- Do not use React, hooks, or state.
- Arrow functions and function declarations are both allowed.
- Never use `any`; define an explicit type.

### Layer 2 — Hook (`hooks/use[Feature].ts`)

```ts
import { useQuery } from '@tanstack/react-query'
import { fetchVerifications } from '../services/verification.service'

export function useVerifications(state: VerificationTableState) {
  return useQuery({
    queryKey: ['verifications', state],
    queryFn: () => fetchVerifications(state),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  })
}
```

Rules:

- Never call `_get` or `_post` directly.
- Always return the complete `useQuery` or `useMutation` result.
- Include every state value that should trigger a refetch in the query key.
- Keep one hook per logical data concern.
- Arrow functions and function declarations are both allowed.
- Never use `any`; define an explicit type.

### Layer 3 — Component (`components/`)

```tsx
// Named exports are required. Either syntax is acceptable.

export function VerificationTable({
  tableState,
  onPageChange,
}: VerificationTableProps) {
  const { data, isLoading, isError } = useVerifications(tableState)
  // Render only.
}

export const VerificationTable = ({
  tableState,
  onPageChange,
}: VerificationTableProps) => {
  const { data, isLoading, isError } = useVerifications(tableState)
  // Render only.
}
```

Rules:

- Always use named exports; never default-export components.
- Arrow functions and function declarations are both allowed.
- Import data access from `hooks/`, never `services/`.
- Never call `_get` or `_post` directly.
- Own only local UI state.
- Never use `any`; define explicit prop types.

## Barrel exports

Each folder containing multiple files exposes one `index.ts`:

```ts
// features/verifications/components/index.ts
export { VerificationTable } from './verification-table'
export { VerificationFilters } from './verification-filters'
export { VerificationStatusBadge } from './verification-status-badge'

// features/verifications/hooks/index.ts
export { useVerifications } from './useVerifications'

// features/verifications/services/index.ts
export { fetchVerifications } from './verification.service'

// features/verifications/types/index.ts
export type {
  Verification,
  VerificationListResponse,
} from './verification.types'
export type {
  VerificationFilters,
  VerificationTableState,
} from './verification-filter.types'
```

Consumers import from the folder rather than an individual file:

```ts
import { VerificationTable } from '@/features/verifications/components'
import { useVerifications } from '@/features/verifications/hooks'
```

Rules:

- Add a barrel export when a folder has two or more files.
- Single-file folders do not need an `index.ts`.
- Always use `export type` for type-only exports.

## Data flow

```text
Component
  calls → useVerifications(state)

Hook
  calls → fetchVerifications(state)
  wraps in → useQuery({ queryKey, queryFn })
  returns → { data, isLoading, isError, ...queryResult }

Service
  builds → URLSearchParams from state
  calls → _get('/verifications?...')
  returns → response.data.data
```

## Types placement

- Feature-specific types: `features/[feature]/types/[feature].types.ts`
- Types shared by two or more features: `src/types/[name].types.ts`

## Naming conventions

| Concern | Filename | Export |
| --- | --- | --- |
| Service | `verification.service.ts` | `fetchVerifications` |
| Hook | `useVerifications.ts` | `useVerifications` |
| Types | `verification.types.ts` | `Verification`, `VerificationListResponse` |
| Filters | `verification-filter.types.ts` | `VerificationFilters`, `VerificationTableState` |
| Component | `verification-table.tsx` | `VerificationTable` (named export) |

## Full example

```text
src/features/verifications/
├── components/
│   ├── index.ts
│   ├── verification-table.tsx
│   ├── verification-filters.tsx
│   ├── verification-status-badge.tsx
│   ├── status-select.tsx
│   ├── reference-id-input.tsx
│   ├── service-select.tsx
│   └── date-range-picker.tsx
├── hooks/
│   ├── index.ts
│   └── useVerifications.ts
├── services/
│   ├── index.ts
│   └── verification.service.ts
├── types/
│   ├── index.ts
│   ├── verification.types.ts
│   └── verification-filter.types.ts
└── utils/
    └── format.ts
```
