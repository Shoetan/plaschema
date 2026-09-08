# Frontend handoff — list totals & KPI cards

Date: 7 September 2026  
Backend branch: `feat/list-filter-totals` (commit `6762074`)  
Audience: admin frontend (`frontend/`)

## Summary

Three related backend tasks are ready for frontend wiring. Together they fix admin list pages where KPI cards and pagination copy only reflect the **current page** instead of the **full filtered dataset**.

| # | Task | Backend status | Frontend status |
| --- | --- | --- | --- |
| 1 | Add `meta.total` to cursor-paginated lists | Done | Not wired |
| 2 | Confirm non-breaking API change | Done (additive only) | Safe to deploy backend first |
| 3 | Wire KPI cards to filter-scoped totals | Done (`summary` / `filteredSummary`) | Not wired |

**Problem today:** KPI cards on Field Workers, Facilities, and Capitation count `data.length` or sum fields on the current page. Pagination footers say things like “Showing 50 field workers” with no total.

**Goal:** Cards and footers should match the active search/filters across all pages.

---

## Compatibility (read before you start)

All backend changes are **additive**. Nothing removes or renames existing fields.

| Change | Impact on current frontend |
| --- | --- |
| `meta.total` on cursor lists | Safe. Extra JSON field; ignored until you read it. |
| `summary` on field-worker / facility lists | Safe. Services do not read it yet. |
| `filteredSummary` on capitation list | Safe. Service does not read it yet. |
| Response interceptor keeps `summary` | Improvement. Capitation already reads `summary`; it was previously dropped. After backend deploy, capitation may show run totals even before Task 3 — but still wrong when LGA/search filters are applied until you use `filteredSummary`. |
| `data[]` item shapes | Unchanged |

No new required query params. No response validation changes in the admin app.

**TypeScript:** add `total` to `CursorPaginationMeta` in `frontend/src/api/api.types.ts` when you wire Task 1. Runtime works without it.

---

## Task 1 — `meta.total` on cursor lists

### Contract

Every cursor-paginated list now includes `meta.total`: the **full count matching current filters**, not just the current page.

```json
{
  "success": true,
  "data": [ /* page rows */ ],
  "meta": {
    "nextCursor": "...",
    "hasMore": true,
    "limit": 50,
    "total": 237
  }
}
```

### Endpoints

| Endpoint | Notes |
| --- | --- |
| `GET /api/wards` | Filtered ward count |
| `GET /api/health-facilities` | Filtered facility count |
| `GET /api/users` | Filtered user count (field-worker table uses `?role=field_worker`) |
| `GET /api/enrollments` | Filtered enrollment count |
| `GET /api/file-jobs` | Filtered job count |
| `GET /api/capitations` | Filtered record count for the selected run + filters |

### Frontend work

1. **Types** — extend shared cursor meta:

```ts
// frontend/src/api/api.types.ts
export interface CursorPaginationMeta {
  nextCursor: string | null
  hasMore: boolean
  limit: number
  total: number
}
```

2. **Pagination footers** — update list views to show “Showing X of Y” (or equivalent):

| View | File |
| --- | --- |
| Wards | `frontend/src/features/wards/components/wards-view.tsx` |
| Facilities | `frontend/src/features/facilities/components/facilities-view.tsx` |
| Field workers | `frontend/src/features/field-workers/components/field-workers-view.tsx` |
| Capitation | `frontend/src/features/capitation/components/capitation-view.tsx` |
| Enrollments | `frontend/src/features/enrollments/components/enrollments-view.tsx` |
| Files | `frontend/src/features/enrollments/components/files-view.tsx` |
| ID card queue | `frontend/src/features/enrollments/components/id-card-generation-view.tsx` |

Suggested pattern:

```ts
const rows = query.data?.items ?? []
const total = query.data?.meta.total ?? rows.length

// Footer copy
`Showing ${rows.length} of ${total.toLocaleString()} …`
```

Use `rows.length` as fallback only while loading or if an older backend is hit during rollout.

---

## Task 2 — No frontend work

This task is documentation only: confirm backend can ship before frontend changes. See **Compatibility** above.

---

## Task 3 — KPI cards (filter-scoped totals)

### Problem screens

Design references (admin UI):

- Field Workers — KPI cards labelled “· Current page”
- Facilities — KPI cards labelled “· Current page”
- Capitation — KPI cards + amber banner when `summary` missing

### Backend response shape

List responses use the standard envelope `{ success, data, meta, …extras }`. Extra top-level fields are preserved by the response interceptor.

#### Field workers — `GET /api/users?role=field_worker`

Same query params as today (`cursor`, `limit`, `search`, `status`).

```json
{
  "success": true,
  "data": [ /* FieldWorkerListItem[] */ ],
  "meta": { "nextCursor": "...", "hasMore": true, "limit": 50, "total": 42 },
  "summary": {
    "active": 38,
    "totalBeneficiariesEnrolled": 1250
  }
}
```

| KPI card | Source |
| --- | --- |
| Field workers | `meta.total` |
| Active | `summary.active` |
| Beneficiaries enrolled | `summary.totalBeneficiariesEnrolled` |

`summary` is only returned when `role=field_worker`.

#### Facilities — `GET /api/health-facilities`

```json
{
  "success": true,
  "data": [ /* HealthFacilityListItem[] */ ],
  "meta": { "nextCursor": "...", "hasMore": true, "limit": 50, "total": 180 },
  "summary": {
    "active": 120,
    "totalBeneficiaries": 890
  }
}
```

| KPI card | Source |
| --- | --- |
| Facilities | `meta.total` |
| Active | `summary.active` |
| Beneficiaries | `summary.totalBeneficiaries` |

All list filters (`search`, `wardId`, `lga`, `type`, `level`, `status`) are reflected in `meta.total` and `summary`.

#### Capitation — `GET /api/capitations`

Query params unchanged: `month`, `year`, `cursor`, `limit`, `lga`, `search`, optional `healthFacilityId`.

```json
{
  "success": true,
  "data": [ /* CapitationRecord[] */ ],
  "meta": { "nextCursor": "...", "hasMore": true, "limit": 50, "total": 15 },
  "summary": {
    "runId": "uuid",
    "month": 8,
    "year": 2026,
    "rate": 700,
    "generatedAt": "2026-08-30T00:00:00.000Z",
    "totalFacilities": 200,
    "totalBeneficiaries": 5000,
    "totalCapitation": 3500000
  },
  "filteredSummary": {
    "totalFacilities": 15,
    "totalBeneficiaries": 320,
    "totalCapitation": 224000
  }
}
```

| KPI card | Source | Notes |
| --- | --- | --- |
| Facilities | `filteredSummary.totalFacilities` | Matches table filters. Equals `summary` when no search/LGA/facility filter. |
| Beneficiaries | `filteredSummary.totalBeneficiaries` | Same |
| Capitation rate | `summary.rate` | Run-wide; unchanged |
| Capitation amount | `filteredSummary.totalCapitation` | Same |
| “Latest run generated …” | `summary.generatedAt` | Keep existing copy |

**Capitation logic recommendation:**

```ts
const filteredSummary = query.data?.filteredSummary
const summary = query.data?.summary

const totals = filteredSummary ?? summary ?? {
  totalFacilities: meta?.total ?? records.length,
  totalBeneficiaries: 0,
  totalCapitation: 0,
}
```

Remove:

- “· Current page” / “· Run total” suffixes on card labels (use plain labels: Facilities, Beneficiaries, Capitation)
- Amber banner: “Full run totals were not included by the API…” (interceptor fix + `filteredSummary` make this obsolete)

### Frontend files to touch (Task 3)

| Area | Service | Types | View |
| --- | --- | --- | --- |
| Field workers | `features/field-workers/services/field-worker.service.ts` | `features/field-workers/types/field-worker.types.ts` | `features/field-workers/components/field-workers-view.tsx` |
| Facilities | `features/facilities/services/facility.service.ts` | `features/facilities/types/facility.types.ts` | `features/facilities/components/facilities-view.tsx` |
| Capitation | `features/capitation/services/capitation.service.ts` | `features/capitation/types/capitation.types.ts` | `features/capitation/components/capitation-view.tsx` |

Service pattern (field workers example):

```ts
type FieldWorkerListResponse = ApiResponse<FieldWorker[], CursorPaginationMeta> & {
  summary?: FieldWorkerListSummary
}

return {
  items: response.data.data,
  meta: response.data.meta,
  summary: response.data.summary,
}
```

Export new types from each feature’s `types/index.ts`.

### Current buggy code (replace)

Field workers (`field-workers-view.tsx`):

```ts
// Today — page-only
const activeCount = workers.filter((w) => w.status === 'active').length
const enrolledCount = workers.reduce((t, w) => t + w.beneficiariesEnrolled, 0)
```

Facilities (`facilities-view.tsx`):

```ts
// Today — page-only
const activeCount = facilities.filter((f) => f.status === 'active').length
const beneficiaryCount = facilities.reduce((t, f) => t + f.beneficiaries, 0)
```

Capitation (`capitation-view.tsx`):

```ts
// Today — run summary OR page fallback
const totals = summary ?? { totalFacilities: records.length, ... }
```

---

## Suggested implementation order

1. Task 1 types + pagination footers (all list pages — quick win, low risk)
2. Task 3 field workers + facilities KPI cards
3. Task 3 capitation KPI cards + remove warning banner
4. `pnpm build:frontend` and smoke-test with filters + multi-page data

---

## Acceptance criteria

### Task 1

- [ ] With 120 filtered rows and `limit=50`, page 1 footer shows “50 of 120” (or equivalent)
- [ ] Changing search/status/LGA resets to page 1 and updates `total`
- [ ] Empty filter result shows `total: 0`

### Task 3 — Field workers

- [ ] KPI “Field workers” matches `meta.total`, not `workers.length`, when more pages exist
- [ ] “Active” and “Beneficiaries enrolled” stay correct when status/search filters change
- [ ] No “· Current page” label on cards

### Task 3 — Facilities

- [ ] Same as field workers for Facilities / Active / Beneficiaries cards

### Task 3 — Capitation

- [ ] With LGA filter applied, KPI cards reflect filtered subset, not full run
- [ ] With no table filters, KPI cards match full run totals
- [ ] Rate still from `summary.rate`; “Latest run generated” still shown when `summary` present
- [ ] Amber “page only” banner removed

---

## Out of scope

- Wards list KPI cards (no cards on that page today)
- Admin dashboard mock → `GET /api/dashboard` (separate task)
- Enrolments list KPI cards (no summary aggregate on that endpoint)
- Backend changes — already on `feat/list-filter-totals`

---

## References

- Project conventions: `docs/feature-folder-structure.md`, `docs/routing-entry-pattern.md`
- Living context: `docs/HANDOFF.md`
- Historical capitation note (interceptor issue — now fixed): `docs/capitation-backend-feedback.md`
- Backend README list endpoint section: `backend/README.md`

## Questions

If `summary` or `filteredSummary` is missing on a deployed environment, confirm the API is running commit `6762074` or later from `feat/list-filter-totals`. Older backends will still work; KPI cards will fall back to page totals.
