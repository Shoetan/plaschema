# Mobile app — beneficiary enrollment handoff

Last updated: 10 September 2026

This document explains how **field-worker mobile clients** (native apps or PWAs) should integrate with the PLASCHEMA backend for **beneficiary enrollment**, with emphasis on the current **household enrollment** pattern, **offline-first behaviour**, and **which API endpoints to call for what**.

It is written for engineers building or maintaining a mobile enrollment client. The live reference implementation is the field-worker PWA in `pwa/`. All field enrollment create traffic uses **`POST /api/household-enrollments`**; standalone `POST /api/enrollments` create was removed.

---

## 1. Big picture

Field workers enroll beneficiaries in the field, often with poor connectivity. The product model is **offline-first**:

1. Capture everything on the device (forms + photos).
2. Save locally with a sync status.
3. Upload to the server when online, **one record at a time**.
4. Keep pending and failed records on the device; do **not** mirror the admin beneficiary table on the mobile client.

All enrollments are **household-based**: each beneficiary is created as a household **head** or **member** through `POST /api/household-enrollments`. File upload uses the shared presign flow; the create response is a slim sync acknowledgement plus household fields.

```text
┌─────────────────────┐     online      ┌──────────────────────┐
│  Mobile client      │ ──────────────► │  Backend API           │
│  local drafts/queue │   presign +   │  PostgreSQL +          │
│  pending/failed     │   create      │  object storage        │
└─────────────────────┘                 └──────────────────────┘
        │
        │ offline: read/write local storage only
        ▼
   Device database (SQLite, IndexedDB, etc.)
```

---

## 2. Current backend contract (summary)

| Area | Status |
| --- | --- |
| Login, session restore | **Live** — `POST /auth/login`, `GET /auth/me` |
| Profile, assigned wards, worker stats | **Live** — `GET /users/:id/detail` (own id only) |
| Reference data for pickers | **Live** — ward/facility list + NDJSON streams |
| File upload | **Live** — presigned PUT upload |
| Household create | **Live** — `POST /household-enrollments` (idempotent, head-first) |
| Household list/detail (late add) | **Live** — `GET /households`, `GET /households/:id` |
| Device sync reporting | **Live** — `POST /auth/sync` after a sync loop |
| Batch create | **Not available** — sync one record at a time |

Roles: `field_worker` only for mobile enrollment. Admin accounts must be rejected in the client.

---

## 3. Recommended mobile screens / flows

These mirror the current PWA routes. Adapt naming to your platform; keep the API sequence the same.

| Screen | Purpose |
| --- | --- |
| Login | Field-worker login (online required first time) |
| Home | Greeting, Today/Total/Pending cards, shortcuts |
| Enroll household | Ward setup → head wizard → member hub → review → save to device queue |
| Households | Device-cached households; entry point for late member addition |
| Add household member | Six-step wizard for one new member on an existing household |
| People / Beneficiaries | Search/filter **device-local** pending and failed records |
| Beneficiary detail | Review one local queued record; edit and retry |
| Sync | Pending/failed queue, Sync now, Retry, Review |
| Profile | Worker identity, assigned wards, sign out |

### Six enrollment steps (per person)

Each head or member uses the same six steps:

1. **Personal** — passport photo, category, title, names, gender, DOB, marital status, optional blood group / genotype
2. **Residence** — state (fixed Plateau), LGA, ward, residential address
3. **Contact** — phone (11 digits), optional email, optional emergency phone (11 digits)
4. **Background** — ID type, ID document; NIN required (10 digits) when ID type is NIN
5. **Facility** — health facility for the selected ward (auto-selected when ward has one active facility)
6. **Review** — confirm and save locally

Passport: JPEG/PNG/WebP. ID document: image or PDF. Max 5 MB each.

**Not collected:** next-of-kin name/relationship (removed from API). Do not send them.

**Categories (fixed):** `IDPs`, `Elderly 65+`, `Indigents / Very Poor / Others`.

---

## 4. Household enrollment — client model

### 4.1 Concepts

| Concept | Client responsibility | Server responsibility |
| --- | --- | --- |
| `householdLocalId` | Generate once per household session (UUID v7) | Stores same value; links head and members |
| `householdCode` | Allocate offline as `{wardCode}-{NNN}` (e.g. `JOS-VOM-001`) | Enforces uniqueness per ward |
| Head | First person enrolled; gets global year counter ID | Creates household row, sets `baseEnrollmentId` |
| Member | Additional people in same household | Assigns `memberSequence` and `{baseEnrollmentId}-{NN}` insurance ID |
| Shared address | Head's residential address copied to members; stored on household | Persisted on household record at head create |

Ward `code` comes from reference data (`GET /wards/stream`). Client increments a per-ward counter offline to produce `{wardCode}-001`, `{wardCode}-002`, etc.

### 4.2 New household flow (offline-capable)

```text
1. Worker selects ward (+ optional shared settlement address hint).
2. Client allocates householdLocalId (UUID v7) + householdCode ({wardCode}-{NNN}).
3. Worker completes six steps for the HEAD (ward locked for all members).
4. Worker may add zero or more MEMBERS (returns to a member hub between each).
5. Review screen shows head + all members.
6. On "Save household":
   - Queue one LocalEnrollmentRecord per person (head first in sort order).
   - Set enrollmentKind = household, householdRole = head|member.
   - Set syncStatus = pending for all; store file blobs locally.
7. When online, sync queue (see §8).
```

### 4.3 Late member addition

For households already on the device (synced or partially synced):

```text
1. Open Households list (device cache + optional GET /households when online).
2. Pick household → Add member.
3. Ward is locked; residential address prefilled from household.
4. Complete six steps → queue ONE member record with:
   - householdLocalId, householdCode (from cache)
   - householdId when known (from head sync acknowledgement)
   - householdRole = member
5. Sync when online; member must not upload before head is on server.
```

When online, `GET /households` can refresh the device cache for households the worker has enrolled.

---

## 5. Sync statuses (device-local)

Every queued enrollment on the device has one of these statuses:

| Status | Meaning | Shown on |
| --- | --- | --- |
| **pending** | Saved locally, not yet uploaded (or waiting for retry) | Home, People, Sync |
| **uploading** / **submitting** | Upload or create in progress | Sync |
| **failed** | Upload attempted; error stored for review/retry | Home, People, Sync |
| **synced** | Accepted by server; awaiting final `/auth/sync` report | Hidden, then removed after sync report |

**Retry rules:**

- Always retry with the **same** `idempotencyId`.
- On `idempotentReplay: true`, treat as success.
- On `409 HOUSEHOLD_HEAD_NOT_SYNCED`, revert to **pending** and retry later (do not mark failed).
- Store `error.code` and `error.message` from the API for Review screens.

### Typical error mapping

| API code | Suggested client action |
| --- | --- |
| Network / timeout | pending, retryable with backoff |
| `DUPLICATE_ENROLLMENT` | Failed + review, or success if same draft |
| `VALIDATION_ERROR`, `UPLOAD_NOT_FOUND`, `FORBIDDEN_WARD` | Failed, needs review |
| `HOUSEHOLD_HEAD_NOT_SYNCED` | pending, retry after head syncs |
| `HOUSEHOLD_HEAD_EXISTS`, `HOUSEHOLD_CODE_TAKEN` | Failed + review (head already created or code clash) |
| `HOUSEHOLD_NOT_FOUND` | Failed + review (bad householdId) |
| `401` / expired JWT | Stop sync, prompt re-login |

### Error shape (all endpoints)

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_ENROLLMENT",
    "message": "Human-readable message",
    "details": {}
  }
}
```

---

## 6. Online enrollment flow

When the device is **online** at save time, still **save locally first**, then sync.

### Step A — Save on device

On “Save enrollment” or “Save household”:

- Generate **UUID v7** → `idempotencyId` per person (keep forever for that draft).
- Generate **UUID v7** → `householdLocalId` once per household (household flow only).
- Set `capturedAt` = now (ISO datetime).
- Store form fields + file blobs locally.
- Set `syncStatus` = `pending`.

### Step B — Upload files (when syncing each record)

For each pending record:

1. `POST /api/enrollments/files/presign-upload`
   - Body: `{ "purpose": "passport" | "id_document", "filename": "...", "contentType": "..." }`
   - Returns presigned PUT URL + `objectKey`

2. **PUT** file bytes to the presigned URL (Railway object storage).

3. Repeat for passport and ID document.

> Dev-only shortcut: `POST /api/enrollments/files/dev-upload` (multipart). Not for production.

### Step C — Create enrollment

`POST /api/household-enrollments` with the enrollment body plus a `household` object (see §10).

**Slim success response:**

```json
{
  "id": "uuid",
  "enrollmentId": "PL/CBHI/2026/010-01",
  "idempotencyId": "uuid-v7",
  "status": "pending",
  "capturedAt": "2026-09-10T08:15:00.000Z",
  "createdAt": "2026-09-10T09:00:00.000Z",
  "idempotentReplay": false,
  "householdId": "uuid",
  "householdRole": "head",
  "memberSequence": null,
  "householdCode": "JOS-VOM-001"
}
```

Member example: `enrollmentId` = `PL/CBHI/2026/010-02`, `householdRole` = `member`, `memberSequence` = `2`.

After head sync succeeds, persist `householdId` on all pending member records for the same `householdLocalId`.

### Step D — Report sync complete

After the **one-by-one** pending loop finishes (all success or user stops):

`POST /api/auth/sync` → updates the user's `lastSyncedAt` on the server.

After this succeeds, delete all successfully synced local records and their file blobs. If it fails, keep the records and retry only `/auth/sync`; do not re-upload or re-create those enrollments.

---

## 7. Offline enrollment flow

When the device is **offline** at save time:

1. Worker completes the household wizard.
2. App saves drafts **only on device**.
3. Status = **pending** for each queued person.
4. Passport/ID files stay as **local blobs** (not uploaded).
5. Home **Pending** count increases.

When connectivity returns:

1. User opens **Sync** (or app auto-triggers when online).
2. For each **pending** or **failed** record: run Step B + C (§6).
3. Order matters for households: **head before members** (§8).
4. On loop completion: `POST /api/auth/sync`.

**Important:** offline save does **not** call the API. The server only sees records after a successful create.

---

## 8. Sync ordering (household)

The sync loop must process pending records in this order:

1. **Household head** before any members sharing the same `householdLocalId`.
2. Among members, ascending `localMemberOrder` (or capture order).
3. Unrelated records by `capturedAt`.

Pseudocode:

```text
sort pending records:
  if same householdLocalId:
    head first, then members by localMemberOrder
  else:
    by capturedAt

for each record in sort order:
  presign + PUT passport
  presign + PUT id document
  POST /household-enrollments
  on success:
    store enrollmentId, server id
    if head: propagate householdId to sibling pending members
  on HOUSEHOLD_HEAD_NOT_SYNCED:
    leave pending, skip to next record (head may sync later in same run)
```

---

## 9. What data lives where

### On the device (source of truth for mobile UI)

- Pending and failed enrollment drafts (full form + files).
- Active household wizard draft (in-progress head/members before queueing).
- Cached households list (for late member addition).
- Per-ward household code counter (restored from `GET /households/code-counters` when online).
- Local counters for **Pending**.
- Session token + cached user profile (for offline app access).
- Cached ward/facility reference rows (from NDJSON streams).

### On the server (source of truth after sync)

- Accepted enrollments in PostgreSQL.
- Household grouping (head, members, codes, shared address).
- Passport and ID files in object storage.
- Worker stats: `totalEnrolled`, `enrollmentsToday`, `enrollmentsThisMonth`.

### Do **not** fetch synced beneficiary lists for the mobile app

After the final sync report, synced rows should be deleted locally. Server-backed history belongs in the admin app, not the field client.

---

## 10. API payloads

Base URL: configure per environment (e.g. production API). All paths below are prefixed with `/api`.

Auth header: `Authorization: Bearer <accessToken>`

### 10.1 Shared create body (`CreateEnrollmentDto`)

Used by `POST /household-enrollments` (via `CreateEnrollmentDto` fields on the request body).

| Field | Required | Notes |
| --- | --- | --- |
| `idempotencyId` | Yes | UUID v7, generated once per person |
| `capturedAt` | No | ISO datetime from device |
| `category` | Yes | One of the three fixed categories |
| `passportObjectKey` | Yes | From presign upload |
| `idDocumentObjectKey` | Yes | From presign upload |
| `title` | Yes | `mr`, `mrs`, `miss`, `ms`, `dr`, `chief`, `rev`, `alhaji`, `hajia`, `other` |
| `gender` | Yes | `male`, `female` |
| `firstName`, `lastName` | Yes | Max 80 chars |
| `middleName` | No | |
| `dateOfBirth` | Yes | `YYYY-MM-DD` |
| `phone` | Yes | Max 30 chars; client validates 11 digits |
| `email` | No | |
| `nin` | No | Required in practice when `idType` is `nin` (10 digits) |
| `maritalStatus` | Yes | `single`, `married`, `divorced`, `widowed`, `separated` |
| `bloodGroup`, `genotype` | No | |
| `idType` | Yes | `nin`, `national_id`, `voters_card`, `drivers_license`, `international_passport`, `other` |
| `emergencyPhone` | No | 11 digits if provided |
| `stateOfResidence` | No | Defaults to `Plateau` |
| `lgaOfResidence` | Yes | |
| `residentialAddress` | Yes | Max 300 chars |
| `wardId` | Yes | UUID v7 |
| `healthFacilityId` | Yes | UUID v7; must belong to `wardId` |

Duplicate detection: same first name + last name + date of birth → `409 DUPLICATE_ENROLLMENT`.

### 10.2 Household extension

Add to the create body for `POST /household-enrollments`:

```json
{
  "household": {
    "householdLocalId": "01900000-0000-7000-8000-000000000010",
    "householdCode": "JOS-VOM-001",
    "role": "head",
    "sharedResidentialAddress": "Settlement Road, Vom"
  }
}
```

| Field | Head | Member |
| --- | --- | --- |
| `householdLocalId` | Required | Required |
| `householdCode` | Required | Required |
| `role` | `"head"` | `"member"` |
| `sharedResidentialAddress` | Recommended (stored on household) | Omit |
| `householdId` | Omit | Optional until head sync returns it; then include for late add |

Member insurance IDs are assigned server-side: `{baseEnrollmentId}-{NN}` where `NN` is zero-padded `memberSequence` (e.g. `PL/CBHI/2026/010-01`).

---

## 11. API endpoints — what to use for what

### Authentication and profile

| Endpoint | Role | Use for |
| --- | --- | --- |
| `POST /auth/login` | Public | First login; returns token + user |
| `GET /auth/me` | Field worker | Refresh profile when online; validate session |
| `POST /auth/sync` | Field worker | After sync loop; sets `lastSyncedAt` |
| `GET /users/:id/detail` | Field worker (own id only) | Home **Today/Total** stats, wards list, `lastSyncedAt` |

No logout endpoint — clear token locally. No refresh token — re-login when JWT expires (~8h).

### Reference data (for enrollment form pickers)

| Endpoint | Use for |
| --- | --- |
| `GET /wards` | Paginated ward list (online) |
| `GET /wards/stream` | NDJSON bulk download for **offline ward cache** (includes `code`) |
| `GET /health-facilities` | Paginated facilities (online) |
| `GET /health-facilities/stream` | NDJSON bulk download for **offline facility cache** |

Field workers only see wards they are assigned to (empty assignment = all wards). Refresh streams periodically (reference implementation: 24h) and after ward assignment changes.

### Enrollment sync

| Endpoint | Use for |
| --- | --- |
| `POST /enrollments/files/presign-upload` | Get upload URL before create |
| `POST /household-enrollments` | Submit **household head or member** (idempotent) |
| `GET /households` | Optional: refresh device household cache when online |
| `GET /households/:id` | Optional: household detail with head + members |
| `GET /enrollments` | **Not for mobile lists** — admin / display-only |
| `GET /enrollments/:id` | **Not needed for sync** — full detail + file URLs |

---

## 12. Home analytics (Today / Total / Pending)

| Card | Source |
| --- | --- |
| **Pending** | Count device records where status is pending or failed |
| **Today** | **Synced today (server)** + **captured today (device, not yet synced)** |
| **Total** | **All-time synced (server)** + **unsent records on this device** |

Server side for synced portions:

`GET /api/users/:id/detail` (own id only) → `stats`:

- `totalEnrolled` — all-time synced count for this worker
- `enrollmentsToday` — synced today (Africa/Lagos calendar day)
- `enrollmentsThisMonth` — optional

Combine with local pending/today captures in the client (see reference: `getEnrollmentHomeSummary` in `pwa/src/features/enrollment/utils/form.ts`).

---

## 13. Local storage shape (reference)

Adapt to your platform; preserve these identifiers and relationships.

### Queued enrollment record

```typescript
{
  localId: string                 // same as idempotencyId is fine
  ownerUserId: string
  idempotencyId: string           // UUID v7, sent to API
  capturedAt: string              // ISO
  syncStatus: 'pending' | 'uploading' | 'submitting' | 'failed' | 'synced'
  passportObjectKey?: string
  idDocumentObjectKey?: string
  enrollmentId?: string           // set after successful create
  serverId?: string
  householdLocalId?: string
  householdId?: string            // set after head sync
  householdCode?: string
  householdRole?: 'head' | 'member'
  localMemberOrder?: number
  memberSequence?: number         // set after member sync
  // ... all form fields + local file references
}
```

### Household wizard draft (before queueing)

```typescript
{
  ownerUserId: string
  householdLocalId: string        // UUID v7
  householdCode: string           // e.g. JOS-VOM-001
  wardId: string
  sharedResidentialAddress: string
  head: MemberDraft | null
  members: MemberDraft[]
  phase: 'setup' | 'head' | 'members' | 'review'
}
```

### Cached household (for late member add)

```typescript
{
  ownerUserId: string
  id?: string                     // server householdId when known
  householdLocalId: string
  householdCode: string
  wardId: string
  headName: string | null
  memberCount: number
  residentialAddress: string | null
}
```

---

## 14. Offline access (after online login)

| Works offline | Does not work offline |
| --- | --- |
| Open app with saved session | Login (first time or after JWT expiry) |
| Navigate between screens | Upload files or create enrollments on server |
| View saved session profile | `GET /auth/me` validation |
| Enroll using local drafts | Download ward/facility streams (unless cached) |
| Continue with unexpired JWT | Sync until back online |

Recommended first-time worker flow:

```text
Online:  Login → cache wards/facilities streams → enroll household → save locally
Offline: Continue enrolling / review pending queue
Online:  Sync → upload each pending record (head-first) → POST /auth/sync
```

---

## 15. Implementation checklist

1. Durable local drafts, files and outbox queue.
2. Always save locally before sync.
3. Offline ward/facility stream cache (include ward `code` for household codes).
4. Presign → PUT → one-by-one `POST /household-enrollments`.
5. Household: allocate codes offline, queue head + members, sync head-first.
6. Propagate `householdId` to pending members after head acknowledgement.
7. Handle `HOUSEHOLD_HEAD_NOT_SYNCED` as retryable pending, not hard failure.
8. Durable errors, Review, Edit and Retry with the same idempotency key.
9. Server + local Home statistics.
10. Final `/auth/sync` reporting; remove synced device rows after success.

---

## 16. Quick reference — full sync loop

```text
optional: refresh GET /wards/stream + GET /health-facilities/stream

for each local record where status in (pending, failed), sorted (§8):
  set status = uploading
  try:
    passportKey = presign + PUT passport blob
    idKey = presign + PUT id blob
    response = POST /household-enrollments { ...draft, passportObjectKey, idDocumentObjectKey, household }
    save response.enrollmentId (+ householdId for head)
    if head: copy householdId to pending members with same householdLocalId
    set status = synced (awaiting final report)
  catch HOUSEHOLD_HEAD_NOT_SYNCED:
    set status = pending
  catch other error:
    set status = failed or pending (transient), store error

if any record synced successfully:
  POST /auth/sync
  delete successfully synced device records and blobs
  refresh GET /users/:id/detail for home stats
```

---

## 17. Related docs and code

| Resource | Location |
| --- | --- |
| Project handoff (high level) | `docs/HANDOFF.md` |
| Legacy single-enrollment PWA notes | `docs/pwa-enrollment-handoff.md` |
| Backend endpoint list | `backend/README.md` |
| PWA sync loop (reference) | `pwa/src/features/enrollment/services/sync.service.ts` |
| PWA household offline queue | `pwa/src/features/household-enrollment/services/offline-household-enrollment.service.ts` |
| PWA household API client | `pwa/src/features/household-enrollment/services/household-enrollment.service.ts` |
| Backend household create | `backend/src/modules/household/application/create-household-enrollment.use-case.ts` |
| Enrollment form steps | `pwa/src/features/enrollment/components/enrollment-form-steps.tsx` |

---

## 18. Production notes

- Object-storage CORS must allow the mobile app origin for presigned `PUT` uploads.
- Orphan uploads (presigned but never attached to a create) require backend lifecycle cleanup.
- No push notifications or background sync in the current contract — sync runs in the foreground while the app is open.
- Private enrollment data on device must be scoped by authenticated worker id.
