# PWA beneficiary enrollment — handoff

Last updated: 2 September 2026

This document explains how beneficiary enrollment is meant to work on the **PLASCHEMA Field Worker PWA**, with emphasis on **offline behaviour**, **sync**, and **which API endpoints to call for what**.

It is written for engineers maintaining the live PWA enrollment integration.

---

## 1. Big picture

The PWA lets field workers enroll beneficiaries in the field, often with poor connectivity.

The model is **offline-first**:

1. Capture everything on the device (form + photos).
2. Save locally with a sync status.
3. Upload to the server when online, one record at a time.
4. Keep pending and failed records on the device; do **not** rely on listing synced server records in the PWA.

```text
┌─────────────────┐     online      ┌──────────────────┐
│  PWA (device)   │ ──────────────► │  Backend API     │
│  local drafts   │   presign +     │  PostgreSQL +    │
│  pending/failed │   create        │  object storage  │
└─────────────────┘                 └──────────────────┘
        │
        │ offline: read/write local storage only
        ▼
   IndexedDB / local storage
```

---

## 2. Current implementation

| Area | Status |
| --- | --- |
| Login, session restore, offline session | **Live** — `POST /auth/login`, `GET /auth/me`, local storage |
| Profile name, phone, assigned wards | **Live** — from authenticated user |
| Six-step enrollment UI | **Built** — design-complete |
| Saving enrollments | **Live** — durable IndexedDB draft and outbox |
| File upload to server | **Live** — presigned PUT upload |
| Real sync to backend | **Live** — foreground one-by-one sync |
| Backend create/sync APIs | **Ready** — see endpoint table below |
| Ward/facility pickers offline cache | **Live** — NDJSON streams cached in IndexedDB |

---

## 3. Enrollment screens (PWA routes)

| Route | Purpose |
| --- | --- |
| `/login` | Field-worker login (online required first time) |
| `/` (Home) | Greeting, Today/Total/Pending cards, recent local records |
| `/enroll` | Six-step enrollment wizard |
| `/beneficiaries` | Search/filter device-local pending and failed records |
| `/beneficiaries/:id` | Review one local draft |
| `/sync` | Pending/failed queue, Sync now, Retry, Review |
| `/profile` | Worker identity, assigned wards, sign out |

### Six enrollment steps

1. **Personal** — passport photo, title, names, gender, DOB, marital status
2. **Residence** — state, LGA, ward, address
3. **Contact** — phone, optional email
4. **Background** — ID type, ID document, next of kin
5. **Facility** — health facility for the selected ward
6. **Review** — confirm and save locally

Passport and ID files: images or PDF (ID only), max 5 MB each. State is fixed to `PLATEAU`; both phone fields require exactly 11 digits; optional NIN requires exactly 10 digits.

---

## 4. Sync statuses (device-local)

Every saved enrollment on the device has one of these statuses:

| Status | Meaning | Shown on |
| --- | --- | --- |
| **Pending** | Saved locally, not yet uploaded (or waiting for retry) | Home, People, Sync |
| **Syncing** | Upload in progress (UI-only transient state) | Sync |
| **Failed** | Upload attempted; error stored for review/retry | Home, People, Sync |
| **Synced** | Successfully accepted but final sync reporting is still finishing | Hidden, then removed after `/auth/sync` succeeds |

**Failed sync handling (client-side, no special API):**

- Keep the full draft on the device.
- Store `syncError` (message from API `error.message`, optionally `error.code`).
- **Retry** — run the same upload + create flow again with the **same** `idempotencyId`.
- **Review** — open the beneficiary detail screen so the worker can fix data/files, then retry.

Typical error mapping:

| API code | Suggested client action |
| --- | --- |
| Network / timeout | Failed, retryable |
| `DUPLICATE_ENROLLMENT` | Treat as success if same person, or Failed + review |
| `VALIDATION_ERROR`, `UPLOAD_NOT_FOUND`, `FORBIDDEN_WARD` | Failed, needs review |
| `401` / expired JWT | Stop sync, prompt re-login |

---

## 5. Online enrolment flow

When the device is **online** at save time, you can sync immediately or still save locally first — product prefers **always save locally**, then sync.

### Step A — Save on device

On “Save enrollment”:

- Generate **UUID v7** → `idempotencyId` (keep forever for this draft).
- Set `capturedAt` = now (ISO datetime).
- Store form fields + file blobs locally.
- Set status = `Pending` (even if online — sync step confirms server acceptance).

### Step B — Upload files (when syncing)

For each pending record:

1. `POST /api/enrollments/files/presign-upload`
   - Body: `{ purpose: "passport" | "id_document", filename, contentType }`
   - Returns presigned PUT URL + `objectKey`

2. **PUT** file bytes to the presigned URL (Railway object storage).

3. Repeat for passport and ID document.

> Dev-only shortcut: `POST /api/enrollments/files/dev-upload` (multipart). Not for production.

### Step C — Create enrollment

`POST /api/enrollments` with the form payload + `passportObjectKey` + `idDocumentObjectKey`.

**Slim success response** (all the client needs):

```json
{
  "id": "uuid",
  "enrollmentId": "PL/CBHI/2026/001",
  "idempotencyId": "uuid-v7",
  "status": "pending",
  "capturedAt": "2026-09-02T08:15:00.000Z",
  "createdAt": "2026-09-02T09:00:00.000Z",
  "idempotentReplay": false
}
```

- On **retry with same `idempotencyId`**: same shape, `idempotentReplay: true` → treat as success.
- Store `enrollmentId` temporarily and mark **Synced** while the final sync report is owed.

### Step D — Report sync complete

After the **one-by-one** pending loop finishes (all success or user stops):

`POST /api/auth/sync` → updates the user’s `lastSyncedAt` on the server.

After this succeeds, delete all successfully synced local records and their file blobs. If it fails, keep the records and retry only `/auth/sync`; do not upload or create those enrollments again.

---

## 6. Offline enrolment flow

When the device is **offline** at save time:

1. Worker completes the same six steps.
2. App saves the draft **only on device** in IndexedDB.
3. Status = **Pending**.
4. Passport/ID files stay as **local blobs** (not uploaded).
5. Home **Pending** count increases; **Today** can count local captures by `capturedAt` calendar day.

When connectivity returns:

1. User opens **Sync** (or app auto-triggers when online).
2. For each **Pending** or **Failed** record: run Step B + C above.
3. On full run completion: `POST /api/auth/sync`.

**Important:** offline save does **not** call the API. The server only sees the record after a successful create.

---

## 7. What data lives where

### On the device (source of truth for the PWA UI)

- Pending and failed enrollment drafts (full form + files).
- Local counters for **Pending**.
- Local unsent count used alongside server totals so new device records appear immediately without double-counting accepted records.
- Session token + cached user profile (for offline app access).

### On the server (source of truth after sync)

- Accepted enrollments in PostgreSQL.
- Passport and ID files in object storage.
- Worker stats: `totalEnrolled`, `enrollmentsToday`, `enrollmentsThisMonth`.

### Do **not** fetch synced beneficiary lists for the PWA

The PWA does **not** mirror the admin beneficiary table. After the final sync report, synced rows are deleted locally. Server-backed history belongs in admin, not the field app.

---

## 8. Home analytics (Today / Total / Pending)

| Card | Source |
| --- | --- |
| **Pending** | Count device records where status is Pending or Failed |
| **Today** | **Synced today (server)** + **captured today (device, not yet synced)** |
| **Total** | **All-time synced (server)** + **unsent records on this device** |

Server side for synced portions:

`GET /api/users/:id/detail` (own id only) → `stats`:

- `totalEnrolled` — all-time synced count for this worker
- `enrollmentsToday` — synced today (Africa/Lagos calendar day)
- `enrollmentsThisMonth` — optional, not on home design

Combine with local pending/today captures in the client.

---

## 9. API endpoints — what to use for what

Base URL: configure `VITE_API_URL` (e.g. production API). All paths below are prefixed with `/api`.

Auth header: `Authorization: Bearer <accessToken>`

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
| `GET /wards/stream` | NDJSON bulk download for **offline ward cache** |
| `GET /health-facilities` | Paginated facilities (online) |
| `GET /health-facilities/stream` | NDJSON bulk download for **offline facility cache** |

Field workers only see wards they are assigned to (empty assignment = all wards).

### Enrollment sync

| Endpoint | Use for |
| --- | --- |
| `POST /enrollments/files/presign-upload` | Get upload URL before create |
| `POST /enrollments` | Submit enrollment (idempotent) |
| `GET /enrollments` | **Not for PWA lists** — admin / display-only tabs |
| `GET /enrollments/:id` | **Not needed for sync** — full detail + file URLs |

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

## 10. Create enrollment — required fields (summary)

Key fields for `POST /api/enrollments`:

| Field | Notes |
| --- | --- |
| `idempotencyId` | UUID v7, generated once per draft |
| `capturedAt` | Optional ISO datetime from device |
| `category` | Beneficiary category label |
| `passportObjectKey`, `idDocumentObjectKey` | From presign upload |
| `title`, `gender`, `firstName`, `lastName`, `dateOfBirth`, … | Personal details |
| `wardId`, `healthFacilityId` | UUIDs from cached reference data |
| `phone`, `maritalStatus`, `idType`, next-of-kin fields, address | As per form |

Duplicate detection: same first name + last name + date of birth → `409 DUPLICATE_ENROLLMENT`.

---

## 11. Accessing the PWA offline (after online login)

The PWA is installable and works offline **only after at least one successful online login**.

### What “offline access” means here

| Works offline | Does not work offline |
| --- | --- |
| Open installed app / cached shell | Login (first time or after expiry) |
| Navigate between app screens | Upload files or create enrollments on server |
| View saved session profile | `GET /auth/me` validation |
| Enroll using local drafts (once storage is built) | Download ward/facility streams |
| Continue with unexpired JWT | Sync until back online |

### How it works technically

1. **Service worker** (`vite-plugin-pwa`) precaches static assets (HTML, JS, CSS, icons).
   - SPA routes fall back to `index.html`.
   - API responses are **not** cached.

2. **Session in local storage** (`plaschema-field-worker-session`):
   - Stores `accessToken`, `expiresAt` (from JWT), and `user` snapshot.
   - On app open: restore session if token not expired.

3. **Online restore** (`GET /auth/me`):
   - When online, verify session and refresh user.
   - If `/auth/me` fails transiently: user can choose **Continue offline** with saved profile.

4. **Expiry**:
   - When JWT expires, session is cleared — user must log in online again.

5. **Install on phone**:
   - Browser menu → “Add to Home Screen” / “Install app”.
   - Opens in standalone mode like a native app.

### Recommended first-time worker flow

```text
Online:  Install PWA → Login → (optional) cache wards/facilities streams
Offline: Open app → Enroll beneficiaries → save locally as Pending
Online:  Open Sync → upload each pending record → POST /auth/sync
```

---

## 12. Local storage shape

Each pending enrollment record on device:

```typescript
{
  id: string                    // local id
  idempotencyId: string         // UUID v7, sent to API
  capturedAt: string            // ISO
  syncStatus: 'Pending' | 'Failed' | 'Syncing'
  syncError?: string
  enrollmentId?: string         // set after successful create
  passportBlob: Blob
  idDocumentBlob: Blob
  // ... all form fields
  wardId: string
  healthFacilityId: string
}
```

Use **IndexedDB** for blobs + drafts; keep auth session in **localStorage** (already done).

---

## 13. Implementation checklist

1. Durable IndexedDB drafts, files and outbox — **complete**.
2. Always save locally before sync — **complete**.
3. Offline ward/facility stream cache — **complete**.
4. Presign → PUT → one-by-one create — **complete**.
5. Durable errors, Review, Edit and Retry with the same idempotency key — **complete**.
6. Server and local Home statistics — **complete**.
7. Durable final `/auth/sync` reporting — **complete**.
8. Remove synced device rows after final reporting — **complete**.

---

## 14. Related docs and code

| Resource | Location |
| --- | --- |
| Project handoff (high level) | `docs/HANDOFF.md` |
| Backend endpoint list | `backend/README.md` |
| PWA auth store | `pwa/src/features/auth/stores/auth.store.ts` |
| Enrollment wizard | `pwa/src/features/enrollment/components/enrollment-view.tsx` |
| Offline sync | `pwa/src/features/enrollment/services/sync.service.ts` |
| PWA service worker config | `pwa/vite.config.ts` |

---

## 15. Quick reference — sync loop pseudocode

```text
for each local record where status in (Pending, Failed):
  set status = Syncing
  try:
    passportKey = presign + PUT passport blob
    idKey = presign + PUT id blob
    response = POST /enrollments { ...draft, passportObjectKey, idDocumentObjectKey, idempotencyId, capturedAt }
    save response.enrollmentId on draft
    set status = Synced while final reporting is owed
  catch error:
    set status = Failed, syncError = error.message

if any record synced successfully:
  POST /auth/sync
  delete successfully synced device records and blobs
  refresh GET /users/:id/detail for home stats
```

This is the intended production behaviour. The UI designs already match this model; backend contracts are ready on branch `feat/pwa-enrollment-sync-api`.
