# Frontend Architecture Spec — Routing & Data Layer

**What this pattern is called.** Routing is the *Bulletproof React / Feature-Sliced*
split: an **app layer** (composition root) holding a **centralized route manifest**, and
a **thin route-entry layer** (FSD calls it the *pages layer*) whose files are pure
adapters. The data layer is a **three-layer feature architecture** with a
**unidirectional dependency rule**: a **transport facade** over one HTTP client, a
**service layer** acting as an **anti-corruption layer** (wire DTOs → domain types), and
a **server-state adapter** layer of React Query hooks.

---

# Part A — Routing

## A0. Layout

```
src/
  app/router.tsx        # the ONLY place URL paths are declared
  routes/               # flat, one file per route, no subfolders, no index.ts
  features/<name>/
    components/         # index.ts barrel; contains <name>-view.tsx (the real page)
    hooks/  services/  types/  utils/
  components/layout/protected-layout.tsx
  main.tsx              # providers + <RouterProvider router={router} />
```

## A1. One centralized route manifest

All paths live in a single `createBrowserRouter` array in `src/app/router.tsx`.
Public/auth routes are top-level siblings. Everything authenticated is a child of one
layout route at `path: '/'`. A `*` catch-all redirects to `/`.

```tsx
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/verify-otp', element: <VerifyOtpPage /> },  // sibling on purpose: must sit
                                                        // outside the layout, and an
                                                        // unregistered path would be
                                                        // swallowed by the catch-all
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <DashboardPage />, handle: { title: 'Dashboard' } },
      { path: 'users', element: <UsersPage />, handle: { title: 'Users' } },
      { path: 'users/:userId', element: <UserDetailPage /> },
      { path: 'roles', element: <RolesPage />, handle: { title: 'Roles' } },
      { path: 'roles/create', element: <CreateRolePage /> },   // static BEFORE :param
      { path: 'roles/:roleId/edit', element: <EditRolePage /> },
      { path: 'roles/:roleId', element: <RoleDetailPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
```

Ordering: static sub-routes (`create`, `:id/edit`) are always declared **before** the
bare `:id` route.

## A2. Route files are adapters, never implementations

A file in `src/routes/` may do exactly two things: read URL params, and render one
feature view. No markup, no data fetching, no business logic, no more than ~10 lines.

```tsx
// src/routes/users.tsx — canonical shape
import { UsersView } from '@/features/users/components'

export function UsersPage() {
  return <UsersView />
}
```

```tsx
// src/routes/user-detail.tsx — param variant.
// The route narrows the optional param so the feature view takes a plain string.
import { useParams } from 'react-router-dom'
import { UserDetailView } from '@/features/users/components'

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  if (!userId) return null
  return <UserDetailView userId={userId} />
}
```

- Import **only** from the feature's `components/` barrel (`@/features/users/components`).
  Never a deep file path, never from `hooks/` or `services/`.
- Naming: file `kebab-case.tsx`, export `<Name>Page`, feature component `<Name>View`.
- **Named exports only — no default exports anywhere in `src/routes/`.**

## A3. One layout route owns the auth guard

Gate auth inside the layout component, not with loaders or a `<RequireAuth>` wrapper.
Public routes opt out by being siblings of the layout route.

```tsx
const status = useAuthStore(selectAuthStatus)
if (status === 'restoring') return <FullPageSpinner />
if (status === 'unauthenticated')
  return <Navigate to="/login" replace state={{ from: location.pathname }} />
return (/* sidebar + header + <PageHeader /> + <Outlet /> */)
```

Kick off the auth bootstrap in `main.tsx` **before** `createRoot`, as an idempotent
memoised promise so StrictMode's double-effect is safe.

## A4. `handle: { title }` drives the page header

Only top-level nav destinations declare `handle.title`; detail and sub-routes omit it
and render no title band. Read it in the layout with a typed guard:

```tsx
interface RouteHandle { title?: string }
function hasTitle(h: unknown): h is Required<RouteHandle> { /* ... */ }

function usePageTitle(): string | undefined {
  const match = useMatches().findLast((m) => hasTitle(m.handle))
  return match && hasTitle(match.handle) ? match.handle.title : undefined
}
```

`handle.title` strings must match the sidebar nav labels one-for-one.

## A5. No React Router data APIs

No `loader`, `action`, or `errorElement`. All server state is TanStack Query inside
feature hooks. The manifest stays purely declarative.

## A6. Barrels inside features only

Every feature subfolder with 2+ files gets an `index.ts`. `src/routes/` and `src/app/`
have none — `router.tsx` imports each route file by path.

## A7. Lazy-load every non-auth route

Use React Router's `lazy` so the app does not ship as a single bundle. The thin-route
convention makes this one line per route.

---

# Part B — API / data layer

Three strictly-layered modules: **transport → services → hooks → components**.
Each layer may import only the layer directly below it.

## B0. Layout

```
src/
  api/
    api.types.ts    # envelope, pagination, error body types
    client.ts       # the single axios instance + interceptors
    errors.ts       # error normalization helpers
    request.ts      # _get / _post / _put / _patch / _delete
    index.ts        # barrel — `@/api` is the ONLY import surface
  lib/query-client.ts
  features/<name>/
    services/<name>.service.ts + index.ts
    hooks/useXxx.ts + index.ts
    types/<name>.types.ts + index.ts
    utils/           # pure wire→domain mappers
    components/
```

## B1. Transport (`src/api/`)

### `request.ts` — the only functions services may call

```ts
import { api } from './client'
import type { QueryParams, RequestConfig } from './api.types'

export const _get = <T = unknown>(url: string, params?: QueryParams, config?: RequestConfig) =>
  api.get<T>(url, { ...config, params })

export const _post = <T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig) =>
  api.post<T>(url, data, config)

export const _put   = <T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig) => api.put<T>(url, data, config)
export const _patch = <T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig) => api.patch<T>(url, data, config)
export const _delete = <T = unknown>(url: string, config?: RequestConfig) => api.delete<T>(url, config)
```

Non-negotiable details:

- Generics default to `unknown`, **never `any`** — an untyped call must fail to compile.
- Write verbs take two generics: `<TResponse, TBody>`.
- Wrappers return the **full `AxiosResponse<T>`**, not `.data`. Unwrapping is the
  service's job (`response.data.data`).
- `_get` takes query params as a **params object in the second argument** — never
  hand-built `URLSearchParams` in the URL string. Let axios serialize.

### `api.types.ts` — the shared contracts

```ts
export type QueryParamValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryParamValue | QueryParamValue[]>
export type RequestConfig = Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>

export interface ApiResponse<T> { data: T; message?: string; success?: boolean }
export interface PaginationMeta { page: number; pageSize: number; total: number; totalPages: number }
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> { meta: PaginationMeta }
export interface ApiErrorBody { message?: string; error?: string; errors?: Record<string, string[]> }
export interface AuthTokens { accessToken: string; refreshToken: string }
```

### `client.ts` — one axios instance, two interceptors

- `baseURL` from a single typed env var (declare it in `vite-env.d.ts`).
- **Request interceptor** attaches `Authorization: Bearer <accessToken>` from the auth store.
- **Response interceptor** handles 401 with refresh-and-replay:
  - A separate bare `refreshClient` instance performs the refresh so it **cannot
    re-enter the interceptors and recurse**.
  - An `UNAUTHENTICATED_PATHS` allowlist (`/auth/login`, `/auth/verify-login`,
    `/auth/forgot-password`, the refresh endpoint) is exempt — a 401 on OTP verify
    means "wrong code", not "expired session", and must not trigger a redirect.
  - An `isRefreshing` flag plus a `failedQueue` so concurrent 401s park on the single
    in-flight refresh instead of each firing their own.
  - A `_retry` flag on the request config prevents infinite replay.
  - On refresh failure: clear auth state and redirect to `/login`.
- Export `requestNewTokens(refreshToken)` so cold-start session restore reuses the exact
  same call without triggering the redirect path.

### `errors.ts` — never read `error.response.data.message` at a call site

```ts
export const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.'
export const isApiError = (e: unknown): e is AxiosError<ApiErrorBody> => axios.isAxiosError(e)
export const getApiErrorMessage = (e: unknown, fallback = DEFAULT_ERROR_MESSAGE): string => {
  /* body.message ?? body.error ?? first field error ?? fallback */
}
export const getApiErrorStatus = (e: unknown): number | undefined => /* ... */
export const getApiFieldErrors = (e: unknown): Record<string, string[]> | undefined => /* for react-hook-form setError */
```

`index.ts` re-exports everything. **Nothing outside `src/api/` imports `axios` or the
`api` instance directly.**

## B2. Services

File: `features/<name>/services/<name>.service.ts` + a barrel. `export async function`
declarations only.

- **The only layer allowed to call `_get`/`_post`/`_put`/`_patch`/`_delete`.**
- No React, no hooks, no state.
- Naming: `fetchX` for reads; bare verbs for writes (`createRole`, `updateRole`,
  `deleteRole`, `suspendUser`).
- URLs are inline template strings; no endpoint-constant file.
- **Services own wire→domain mapping.** Raw backend shapes get an `Api` suffix
  (`DashboardOverviewApi`); pure mappers live in `../utils` (`normalizeRole`,
  `mapDashboardOverview`). Hooks and components only ever see domain types.
- Unwrap the envelope here: `return response.data.data`.
- Use defensive unwrap helpers for endpoints with inconsistent shapes (tolerate both a
  bare payload and a `{ data }` envelope) rather than spreading `?.` through callers.

```ts
/** GET /roles */
export async function fetchRoles(state: RolesTableState): Promise<RolesListResult> {
  const response = await _get<ApiResponse<unknown>>('/roles', { type: state.filters.type })
  const roles = unwrapRoleList(response.data.data).map(normalizeRole)
  return paginateRoles(roles, state)
}

/** POST /roles */
export async function createRole(payload: CreateRolePayload): Promise<Role> {
  const response = await _post<ApiResponse<Role>, CreateRolePayload>('/roles', payload)
  return normalizeRole(response.data.data)
}
```

## B3. Hooks

File: `features/<name>/hooks/useXxx.ts` (camelCase filenames) + a barrel. One file per
query; group a feature's mutations in one `useXxxMutations.ts`.

- **Never call `_get`/`_post` directly.** Only import from `../services`.
- Always return the whole `useQuery`/`useMutation` result object.
- **Query key conventions** — inline literal arrays, no keys factory:
  - list: `[feature, state]`
  - detail: `[feature, 'detail', id]`
  - sub-resource: `[feature, sub, id, state?]`
  - static lookup: `[feature, 'permissions']`
- `staleTime: 30_000` for lists/details; `60_000` for slow-changing lookups.
- Every paginated list gets `placeholderData: (previous) => previous`.
- Every id-dependent query gets `enabled: Boolean(id)`.
- **No `select`/transform option** — transforms belong in services/utils.
- Mutations always invalidate by broad prefix on success and always toast on error:

```ts
export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => createRole(payload),
    onSuccess: (role) => {
      toast.success(`${role.displayName} created`)
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
```

(`void` prefixes the invalidation to satisfy the floating-promise lint rule.)

## B4. Components

- **Never import from `services/`** — only from `hooks/`.
- Never call `_get`/`_post`.
- Own local UI state only; render `isLoading` / `isError` from the hook result.
- Named exports only.

## B5. Types

`features/<name>/types/<name>.types.ts`, barrel uses `export type { ... }`.

- Entity: `Role`. Detail extends it: `RoleDetail extends Role`.
- Request bodies: `CreateXPayload` / `UpdateXPayload`.
- Service list return: `XListResult { <plural>: X[]; meta: XListMeta }`.
- Table input: `XTableState { pagination: { page, pageSize }; filters: XTableFilters }`
  — this object is what goes in the query key.
- Raw wire shapes: `XApi` suffix.
- Shared across 2+ features → `src/types/<name>.types.ts`.
- **Never `any`.**

## B6. Shared config

```ts
// src/lib/query-client.ts
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } },
})
```

No global mutation defaults and no global error handler — error toasts are per-hook.

Auth store: persist **only the refresh token** (`partialize`); keep the access token in
memory. Status machine: `'restoring' | 'authenticated' | 'unauthenticated'`. Memoize the
session-restore call in a module-level in-flight promise so StrictMode's double effect
cannot double-spend a rotating refresh token.

---

# Part C — Definition of done

## Routing

- `grep -rn "<Route\b" src/` → no results (every path is in the manifest).
- `grep -r "export default" src/routes/` → no results.
- `grep -rL "features/" src/routes/` → no results (every route delegates to a feature).
- No file in `src/routes/` exceeds ~10 lines or contains more than one JSX element
  (plus an optional provider wrapper).
- Every `:param` route has its static siblings (`create`, `edit`) declared above it.
- Manual: unknown URL redirects to `/`; a protected URL while logged out lands on
  `/login` with `state.from` preserved; page titles render only on top-level nav pages.

## Data layer

- `grep -rn "_get\|_post\|_put\|_patch\|_delete" src --include=*.tsx` → no results
  (transport wrappers appear only in `services/`).
- `grep -rn "from '@/api'" src/features/*/components src/features/*/hooks` → only
  `getApiErrorMessage` / type imports, never a request wrapper.
- `grep -rn "from '../services'\|/services/" src/features/*/components` → no results.
- `grep -rn "from 'axios'" src --include=*.ts --include=*.tsx` → only inside `src/api/`.
- `grep -rn ": any\|<any>" src` → no results.
- Every list hook has `placeholderData`; every id-scoped query has `enabled`.
- Every mutation has both `onSuccess` invalidation and `onError` toast.
- Manual: expire the access token and fire two requests at once — exactly one refresh
  call goes out, both requests replay and succeed; a wrong OTP shows an inline error and
  does **not** redirect to `/login`.

## Both

- Typecheck, lint, and build pass.
- These rules are written into the new project's `CLAUDE.md` / architecture doc, so the
  convention survives without relying on imitation.
