# PLASCHEMA Project Handoff

Last updated: 2 September 2026
Last verified code commit: `a73ed09`

## Purpose

This is the living context document for engineers and future coding sessions. Update it after major changes.

## Project layout

| Folder | Purpose | Current state |
| --- | --- | --- |
| `frontend/` | Admin web app | Designs implemented; login and session APIs integrated |
| `pwa/` | Field-worker mobile PWA | Production auth/profile and offline-first enrollment sync integrated |
| `backend/` | NestJS API, Prisma, PostgreSQL and Redis | Existing backend project; frontend work must not change it unless requested |
| `docs/` | Project guides and handoff | Read before architecture or routing work |

This is a pnpm workspace. The root scripts manage all three apps.

## Current frontend state

### Admin app

- React, TypeScript, Vite and Tailwind.
- Feature folders live under `frontend/src/features/`.
- Thin route files live under `frontend/src/routes/`.
- Admin designs and navigation are implemented.
- Dashboard and most feature data remain mock-only; ward and health-facility admin screens are API-backed.
- Admin login uses `POST /auth/login`; saved sessions are validated with `GET /auth/me`.
- The typed API layer is split into client, request, error and contract modules and is consumed through feature services and React Query hooks.
- Authentication is admin-only. Zustand owns the access token, authenticated user and session status.
- “Remember me” stores the token and user in local storage; unchecked sessions use session storage. No password is stored.
- There is no refresh-token endpoint. A protected-request 401 clears the session, while a transient `/auth/me` failure preserves it and offers retry/sign-out actions.
- Sonner provides login and session notifications. The existing forgot/reset-password screens are still mock-only.
- Ward creation uses `POST /wards`; the form sends only `name` and `lga`, while Plateau and Active remain fixed display values.
- Ward batch upload uses `POST /wards/batch` with a multipart `file` field. The UI accepts CSV, XLSX and XLS files up to 2 MB and displays created, failed and row-level results.
- Ward list data uses `GET /wards` with debounced server search, status filters and cursor-based Previous/Next navigation.
- Ward detail data uses `GET /wards/:id/detail` for overview statistics, enrollment trends, field workers, health facilities and activity.
- Ward editing uses `PATCH /wards/:id`, field-worker assignment uses `PUT /wards/:id/field-workers`, and deletion uses `DELETE /wards/:id`.
- The assignment picker reads real candidates from `GET /users?role=field_worker` with cursor pagination. Assignment replaces the ward's complete field-worker selection.
- The ward Beneficiaries tab is visible but disabled because the detail response does not contain beneficiary rows.
- Ward API server state is owned by React Query and is not mirrored into Zustand.
- Health-facility list data uses `GET /health-facilities` with debounced search, searchable ward selection, LGA/type/level/status filters and cursor navigation.
- Health-facility creation uses `POST /health-facilities`; the frontend submits `name`, `wardId`, `type`, `level` and `status`. LGA is displayed from the selected ward but is derived by the backend rather than duplicated in the request.
- Health-facility batch upload uses `POST /health-facilities/batch` with CSV/XLSX and XLS files up to 2 MB and displays server row errors.
- Health-facility detail uses `GET /health-facilities/:id/detail` for overview statistics, capitation history and activity.
- Facility editing/status changes use `PATCH /health-facilities/:id`, and deletion uses `DELETE /health-facilities/:id` with confirmation.
- Unsupported mock-only facility fields (code, ownership, community, address, contacts and onboarding date) are not displayed or submitted. The Beneficiaries tab reads `GET /enrollments?healthFacilityId=` with cursor pagination and remains display-only until beneficiary detail is API-backed.
- Facility list KPI cards are explicitly current-page totals because cursor metadata does not contain programme-wide totals.
- Field-worker list data uses `GET /users?role=field_worker` with debounced search, status filters and cursor-based Previous/Next navigation.
- Field-worker creation uses `POST /users` with the role fixed to `field_worker`, optional multi-ward assignment and active/inactive status.
- Empty field-worker ward assignment intentionally means access to all wards and is labelled explicitly throughout the UI.
- Initial and reset passwords can be cryptographically generated in the browser or entered manually. Successful credentials are displayed once for the admin to copy and are not persisted in stores, query caches, URLs or browser storage.
- Field-worker detail uses `GET /users/:id/detail`; edits and status changes use `PATCH /users/:id`, and admin password reset uses `POST /users/:id/reset-password`.
- Field-worker Enrollment Activity and Sync Activity tabs filter the unified detail activity log. The Beneficiaries Enrolled tab reads `GET /enrollments?enrolledByUserId=` with cursor pagination and remains display-only until beneficiary detail is API-backed.
- Field-worker server state is owned by React Query and is no longer mirrored from the mock Zustand store.

### Field-worker PWA

- Separate app under `pwa/` in the same workspace.
- React, TypeScript, Vite, Tailwind, React Router, Zustand, Axios and TanStack React Query.
- Routes: login, home, enrollment, beneficiaries, beneficiary detail, sync and profile.
- Six-step enrollment includes passport and ID-document design inputs.
- Login uses `POST /auth/login`, accepts only active field-worker accounts and stores no password.
- Saved sessions persist locally, are checked with `GET /auth/me` when online and may continue offline only until the JWT expires.
- A protected-request 401, role mismatch or local token expiry clears the session. A transient `/auth/me` failure preserves it and offers Retry or Continue Offline.
- Worker profile identity and assigned wards come from the authenticated user response; empty ward assignment means access to all wards.
- Enrollment drafts, selected files, local queues, reference data and cached worker statistics use IndexedDB through Dexie. Authentication remains separate in local storage.
- The six-step enrollment wizard always saves locally first. One active draft survives refreshes and app restarts; completed drafts enter an owner-scoped pending queue with a UUID v7 idempotency key.
- Wards and health facilities are downloaded from their NDJSON stream endpoints when missing, older than 24 hours or when the worker's ward access changes. Workers can also refresh them manually.
- Synchronization runs in the foreground while the app is open: presign each file, upload it directly with the returned PUT URL, then create each enrollment one at a time.
- Pending work retries with durable leases and bounded delays. Failed records retain their form, error and files for Review, Edit, Retry or Discard actions.
- A successful create keeps a durable pending sync-report marker until `POST /auth/sync` succeeds, including when only part of a batch succeeded.
- File blobs are removed only after the backend accepts the enrollment. Recently synced text records remain on the device for 30 days for offline review.
- Home Pending is device-local. Today and Total combine own `/users/:id/detail` statistics with unsent device records without double-counting retained synced rows; dates use the Africa/Lagos calendar day.
- People and Sync display only records created on the current device. The PWA does not use `GET /enrollments` as a server-backed beneficiary list.
- Logout is immediate; no refresh-token or server logout endpoint exists.

### Backend contracts for PWA sync (ready)

- `POST /api/enrollments` returns a slim sync acknowledgement (`id`, `enrollmentId`, `idempotencyId`, `status`, `capturedAt`, `createdAt`, `idempotentReplay`).
- `POST /api/auth/sync` sets the authenticated user’s `lastSyncedAt` to now (call after the client’s one-by-one pending loop).
- `GET /api/users/:id/detail` allows `field_worker` for **own** id only; overview includes `lastSyncedAt`, plus `stats` (`totalEnrolled`, `enrollmentsToday`, `enrollmentsThisMonth`, …), `wards`, and `activityLog`. Pending counts stay device-local.
- No refresh-token endpoint; clients re-login when the JWT expires.
- No batch enrollment create; PWA syncs pending records one-by-one.

## PWA configuration

- `vite-plugin-pwa` generates the manifest and service worker.
- App name: **PLASCHEMA Field Worker**.
- Display mode: standalone.
- Static app files are precached.
- SPA navigation falls back to `index.html`.
- An update prompt appears when a new version is ready.
- Current icon is `pwa/public/logo.svg` for normal and maskable use.
- No push notifications, service-worker background sync or authenticated API caching. Private enrollment data is stored in IndexedDB and scoped by the authenticated worker id.
- PWA API responses are not cached by the service worker. Set `VITE_API_URL` in local and Netlify environments; never commit its deployed value.
- Production work should add tested PNG icons and an Apple touch icon.
- Production enrollment uploads require Railway object-storage CORS to allow the deployed PWA origin, `PUT` and the requested `Content-Type`. Uploaded objects that are never attached to a completed enrollment require backend lifecycle cleanup.

## Commands

From the repository root:

```bash
pnpm install
pnpm dev              # backend, admin and PWA
pnpm dev:frontend     # admin only, fixed at http://localhost:5173
pnpm dev:pwa          # PWA only, fixed at http://localhost:5174
pnpm dev:backend      # backend and infrastructure only

pnpm build
pnpm build:frontend
pnpm build:pwa
pnpm lint
pnpm lint:pwa
pnpm test:pwa
```

Both frontend development servers use Vite's `--strictPort` option and exit instead of choosing another port when `5173` or `5174` is occupied.

## Netlify deployment

- The admin app and field-worker PWA deploy as two separate Netlify sites from this repository.
- Admin production URL: `https://plaschema-admin.netlify.app`.
- Field-worker PWA production URL: `https://plaschema-pwa.netlify.app`.
- Select `frontend` as the package directory for the admin site and `pwa` for the field-worker site.
- Leave the Netlify base directory unset so dependency installation and builds run from the pnpm workspace root.
- Site-specific settings are committed in `frontend/netlify.toml` and `pwa/netlify.toml`.
- Both sites use SPA rewrites so direct navigation to React Router routes resolves to `index.html`.
- The PWA service worker is served with revalidation enabled so clients can discover new deployments.
- The initial sites were uploaded manually with the Netlify CLI. Connect both Netlify sites to this repository for continuous deployment, using the package directories above.
- Set a production `VITE_API_URL` separately for both Netlify sites and rebuild after changing it. Do not commit deployed environment values.

## Railway / ID-card Chromium

- Backend ID-card PDFs need Puppeteer's Chrome binary on the Railway image.
- `puppeteer` is allowlisted in `onlyBuiltDependencies` so its install script can download Chrome.
- `backend` `build` also runs `puppeteer browsers install chrome`.
- `nixpacks.toml` (repo root and `backend/`) installs the Linux libraries Chrome needs.
- Optional: `PUPPETEER_EXECUTABLE_PATH` to point at a custom Chromium binary.

## Decisions already made

- Keep admin and PWA as separate apps in the same Git repository.
- Use `frontend/` for admin and `pwa/` for the mobile field-worker app.
- Use Zustand for shared client state.
- Convert and review designs before integrating APIs.
- Keep both frontend apps mock-only until backend integration is requested.
- Do not modify the backend as part of frontend design work.
- Support both Android and iPhone layouts.
- Ask before adding packages that were not already approved for the task.
- Integrate admin APIs one Swagger endpoint at a time through API client → feature service → React Query hook → component.
- Restrict the admin frontend to users whose API role is `admin`.
- `sonner` is the approved toast dependency for the admin frontend.
- Keep server-owned ward records out of Zustand; React Query owns ward API state as read endpoints are integrated.
- Keep `GET /wards/stream` for a separate PWA offline-sync phase; it is not used by the admin app.
- Use the admin-specific `GET /wards/:id/detail` response rather than adding the simpler ward-by-ID endpoint without a consumer.
- Keep `GET /health-facilities/stream` for a separate PWA offline-sync phase, and use the admin detail endpoint rather than the simpler by-ID endpoint without a consumer.
- Keep the field-worker role implicit on the Field Workers screens; the UI always submits `field_worker` and does not expose a role selector.
- Field workers with no assigned wards have deliberate all-ward access; clearing every assignment preserves that backend behavior.
- Generate field-worker passwords client-side with Web Crypto by default, allow manual passwords, reveal successful credentials once, and keep password recovery admin-controlled without an invitation/setup flow.
- Persist the PWA field-worker session in local storage without a Remember me control. Revalidate through `/auth/me` when online and permit offline access only before the JWT expires.
- Keep PWA authentication separate from local enrollment state, reject admin accounts in the PWA, and never cache authenticated API responses in the service worker.
- PWA enrollment sync is one-by-one via `POST /enrollments` (idempotent); after the loop call `POST /auth/sync` to persist `lastSyncedAt`.
- PWA profile does not use a worker code field; use `/auth/me` or own `/users/:id/detail`.
- Home/People/Sync analytics and pending/failed queues are device-local; do not list server-synced enrollments on the PWA. Today/Total can use detail `stats.enrollmentsToday` / `stats.totalEnrolled`.
- Keep PWA enrollment API traffic in typed services. Components consume hooks; direct `fetch` is limited to the NDJSON and presigned-upload transport helpers.
- Keep recent synced device records for 30 days, but remove their file blobs immediately after the backend acknowledges enrollment creation.
- Refresh offline reference streams when absent, more than 24 hours old or ward access changes; do not download both streams on every queue polling interval.

## Structure rules

- Follow `docs/feature-folder-structure.md`.
- Follow `docs/routing-entry-pattern.md`.
- Route files should stay thin and delegate to feature views.
- Keep reusable app UI in `components/` and feature-specific UI inside its feature.
- Do not call Axios or `fetch` directly from components when API work begins.
- Never use real beneficiary data in mocks, tests or committed files.

## Verification status

At commit `a73ed09`:

- PWA lint passes.
- PWA TypeScript and production build pass.
- Three PWA tests pass.
- The generated manifest and preview output were smoke-tested.
- Backend had no working-tree changes.

After later edits, rerun the relevant checks before updating this section.

On 2 September 2026 after the PWA offline enrollment integration:

- PWA lint and TypeScript pass.
- All 22 PWA tests pass, including durable draft/outbox storage, UUID v7, file blobs, NDJSON parsing, bearer isolation for presigned PUTs, partial sync batches, delayed `/auth/sync` reporting, reference freshness and Africa/Lagos Home counts.
- The PWA production build passes and generates its service worker. Vite reports a non-blocking warning because the main JavaScript chunk is larger than 500 kB.
- A local production-preview smoke test returned HTTP 200 for the root, a nested beneficiary route, the web manifest and the generated service worker.
- Static checks confirm enrollment components use hooks/services rather than direct Axios or fetch, and the old mock beneficiary/Zustand enrollment store has been removed.
- Live authenticated uploads were not run in this coding session. Production still needs a real-device offline/reconnect test and confirmation of Railway object-storage CORS and abandoned-upload cleanup.

On 30 August 2026:

- Admin TypeScript and production build passed.
- PWA TypeScript and production build passed.
- Netlify's local production build simulation passed for both package configurations.
- Both production roots and nested SPA routes returned HTTP 200.
- The deployed PWA service worker returned HTTP 200 with cache revalidation enabled.

On 30 August 2026 after the admin authentication integration:

- Admin frontend lint passes.
- Admin frontend TypeScript and production build pass.
- Static architecture checks confirm Axios is limited to `frontend/src/api/`, request wrappers are absent from components, and auth components do not import services.
- A live API smoke test was not run because the backend was not listening on `localhost:3000`.

On 30 August 2026 after the ward write integration:

- Admin frontend lint passes.
- Admin frontend TypeScript and production build pass.
- Static architecture checks confirm ward components use hooks, request wrappers remain in the ward service, and no `any` was introduced.
- Live create and batch-upload requests were not run because the backend was not listening on `localhost:3000`.

On 30 August 2026 after the complete admin ward integration:

- Admin frontend lint passes without warnings.
- Admin frontend TypeScript and production build pass.
- Static checks confirm ward components do not import Axios or services directly, and no `any` or ward mock-store dependency was introduced.
- A live authenticated smoke test was not run because the backend was not listening on `localhost:3000`.

On 30 August 2026 after the admin health-facility integration:

- Admin frontend lint passes without warnings.
- Admin frontend TypeScript and production build pass.
- Static checks confirm facility components use hooks rather than services, contain no mock-store dependency, and introduce no `any` or direct Axios usage.
- Ward list and detail builds still pass after adding the reusable ward-options query.
- A live authenticated smoke test was not run because the backend was not available to this coding session.

On 1 September 2026 after the admin health-facility upgrade:

- Admin frontend lint, TypeScript and production build pass.
- Facility creation exposes and submits type, level and status while leaving LGA derivation to the selected ward on the backend.
- Facility list filtering supports searchable ward selection through the production `wardId` query parameter.
- Facility beneficiary rows use `GET /enrollments?healthFacilityId=` with cursor pagination, loading, empty and retry states.
- Facility wire types were aligned with the required and nullable fields in production Swagger.
- No admin test dependencies were added; interactive browser verification was unavailable in this coding session.
On 1 September 2026 after the admin field-worker integration:

- Admin frontend lint passes without warnings.
- Admin frontend TypeScript and production build pass.
- Static checks confirm field-worker components use hooks, contain no mock-store dependency, introduce no `any`, and keep request wrappers inside the field-worker service.
- Field-worker list, detail, optional ward access, create/edit/status actions, one-time generated/manual passwords, password reset, activity filtering and attributed beneficiary pagination are implemented.
- A live authenticated smoke test was not run because the backend was not listening on `localhost:3000` during verification.

On 2 September 2026 after the PWA authentication integration:

- PWA login and `/me` use production contracts through a typed Axios service and React Query hooks.
- Persistent field-worker-only sessions, online restoration, unexpired offline continuation, background revalidation, local expiry, cross-tab logout and real Profile/Home identity are implemented.
- The mock user was removed from the general app store; unfinished enrollment screens retain explicit demo-data labelling.
- PWA TypeScript, lint, production build and eight Vitest tests pass.
- No live authenticated production login was run because no field-worker credentials were supplied to this coding session.

## Known gaps

- Remaining admin API integration beyond authentication and ward writes.
- Ward beneficiary-list integration; the detail endpoint does not provide beneficiary rows.
- Programme-wide facility KPI totals.
- PWA ward and health-facility stream synchronization.
- Beneficiary list/detail API integration outside the field-worker display-only beneficiary tab.
- Refresh-token support and automatic session renewal.
- PWA enrollment sync client integration (backend contracts ready).
- Durable offline enrollment storage.
- Real file upload and synchronization.
- Production PWA PNG icons and iPhone install assets.
- Full real-device browser testing.
- Broader frontend test coverage.

## Suggested next work

1. Wire PWA sync to `POST /enrollments` + `POST /auth/sync` and home stats to own `/users/:id/detail`.
2. Add durable offline enrollment storage.
3. Stream wards and health facilities for offline enrollment forms.
4. Production PWA icons and real-device browser testing.

## Handoff update checklist

When finishing major work:

1. Update the current state and known gaps.
2. Record important decisions and new packages.
3. Update commands if scripts changed.
4. Run and record relevant checks.
5. Replace the last verified commit after the work is committed.
