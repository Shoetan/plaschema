# Backend

NestJS Clean Architecture API for CBHI (Community-Based Health Insurance).

## Stack

- NestJS 11
- PostgreSQL + Prisma 7
- Redis (ioredis)
- UUID v7 (`uuid`)
- JWT auth (`@nestjs/jwt` + Passport)
- Swagger/OpenAPI
- Structured logging (Pino)

## Requirements

- Node.js 20.19+, 22.12+, or 24+
- pnpm 10
- Docker (for local Postgres/Redis)

## Setup

```bash
# from repo root
pnpm install
cp backend/.env.example backend/.env
pnpm --filter backend infra:up
pnpm --filter backend prisma:migrate:dev
pnpm --filter backend prisma:seed
```

### Full stack (frontend + backend + infra)

```bash
pnpm dev
```

### Backend only

```bash
pnpm dev:backend
```

- API prefix: `/api`
- Login: `POST /api/auth/login`
- Liveness: `GET /health/live`
- Readiness: `GET /health/ready` (Postgres + Redis)
- Swagger: `http://localhost:3000/api/docs` (when `SWAGGER_ENABLED=true`)

Default seed admin (from `.env.example`):

- email: `admin@cbhi.local`
- password: `ChangeMe123!`

## Architecture

Clean Architecture only (no DDD / bounded contexts). Feature modules:

- `src/modules/identity` — auth + users
- `src/modules/ward` — wards
- `src/modules/health-facility` — health facilities
- `src/modules/enrollment` — beneficiary enrollment
- `src/modules/activity-log` — ward-scoped activity/audit log for enrollment events

## Key endpoints

- `POST /api/auth/login`
- `GET /api/auth/me` — authenticated profile (`assignedWards`, `lastSyncedAt`, …)
- `POST /api/auth/sync` — report successful device sync (sets `lastSyncedAt` to now; returns updated user)
- `POST /api/users/:id/reset-password` (admin only; no email)
- `GET /api/users` — cursor list; with `role=field_worker` returns wards + enrollment stats (`beneficiariesEnrolled`, `lastEnrollmentAt`, `lastSyncedAt`)
- `GET /api/users/:id/detail` — field worker detail for admin **or the worker’s own profile** (`fieldWorker` overview with `lastSyncedAt`, `stats` with `totalEnrolled` / `enrollmentsToday` / `enrollmentsThisMonth`, `wards`, unified `activityLog`). Field workers may only request their own `id`. Beneficiaries tab uses `GET /api/enrollments?enrolledByUserId=`
- `POST /api/wards/batch` — CSV or Excel (.xlsx/.xls); columns: `name,lga`
- `GET /api/wards` — cursor list for wards table (`name`, `state`, `lga`, `fieldWorkers`, `beneficiaries`, `newEnrollments`, `status`)
- `GET /api/wards/:id/detail` — admin ward detail page payload (`ward`, `stats`, `enrollmentTrend`, `fieldWorkers`, `healthFacilities`, unified `activityLog`). Beneficiaries tab uses `GET /api/enrollments?wardId=`
- `PUT /api/wards/:id/field-workers` — assign multiple field workers to a ward (`fieldWorkerIds[]`; replaces existing assignments for that ward; returns `{ message }`)
- `GET /api/wards/stream` — NDJSON stream for offline/mobile cache sync (`updatedSince` optional)
- `POST /api/health-facilities/batch` — CSV or Excel (.xlsx/.xls); columns: `name,lga,ward`
- `GET /api/health-facilities` — cursor list (`name`, `type`, `level`, joined `ward`/`lga`, `beneficiaries`, `status`)
- `GET /api/health-facilities/:id/detail` — admin facility detail (`facility` with full schema fields + `state`, `stats`, capitation history, `activityLog`). Beneficiaries tab uses `GET /api/enrollments?healthFacilityId=`
- `GET /api/health-facilities/stream` — NDJSON stream for offline/mobile cache sync
- `GET /api/capitations/preview` — preview capitation for all active facilities (`month`, `year`, optional `rate`; defaults to `CAPITATION_RATE`)
- `POST /api/capitations/generate` — generate capitation for all active facilities and active enrollments; append-only (latest run per month/year wins)
- `GET /api/capitations` — list latest-run records for a month/year (defaults to current Lagos period). Filters: `lga`, `healthFacilityId`, `search`. Returns `{ data, meta, summary }`
- `POST /api/enrollments/files/presign-upload` — Railway presigned PUT URL for passport/ID upload
- `POST /api/enrollments/files/dev-upload` — **dev/test only**: multipart upload that presigns + PUTs to Railway (returns `objectKey`)
- `POST /api/enrollments` — create enrollment (idempotent via `idempotencyId`; duplicate = first+last+DOB). Returns slim sync acknowledgement (`id`, `enrollmentId`, `idempotencyId`, `status`, `capturedAt`, `createdAt`, `idempotentReplay`)
- `GET /api/enrollments` — cursor list for beneficiaries / ID-card page (`enrollmentId`, name, category, lga, facility, ward, status, `hasPrinted`, `printCount`, `printedAt`). Filters: `category`, `printedStatus` (`all`|`printed`|`not_printed`), `lga`, `wardId`, `healthFacilityId`, `enrolledByUserId` (admin), `beneficiaryName`, `enrollmentId`, `createdFrom`/`createdTo`, `status`, `search`, `enrolledByMe`, `ageMin`/`ageMax`
- `GET /api/enrollments/:id/detail` — beneficiary detail page payload (`overview` personal details + unified `activityLog` for sync/activity tabs)
- `GET /api/enrollments/:id` — full enrollment detail with presigned `passportUrl` + `idDocumentUrl` (+ print fields)
- `POST /api/enrollments/id-cards/generate` — admin; enqueue async PDF job for 1–9 enrollments (9-up A4 front+back via HTML/CSS + reused headless Chromium); returns `202 { jobId }`. Poll status and download via `/api/file-jobs`
- `POST /api/enrollments/reports/export` — admin; enqueue async enrollment report export (`format: xlsx`; filters: `lga`, `wardId`, `healthFacilityId`, `enrolledByUserId`, `createdFrom`/`createdTo`, `category`, `status`, `ageMin`/`ageMax`). Returns `202 { jobId }`. Poll status and download via `/api/file-jobs`
- `GET /api/file-jobs` — list file generation jobs for the current user (ID cards + enrollment reports). Active jobs (`queued`/`processing`) first, then newest. Optional `status` filter; cursor pagination
- `GET /api/file-jobs/:id` — file job detail (current user only)
- `GET /api/file-jobs/:id/download` — fresh presigned download URL for a completed job (current user only)

Roles: `admin` | `field_worker`. Field workers with assigned wards are scoped to those wards; with no assignments they can enroll and view enrollments in all wards.

### Offline-first enrollment sync

1. On device, generate a UUID v7 `idempotencyId` and capture `capturedAt` when the form is filled offline.
2. When online, request presigned upload URLs, PUT passport + ID files to Railway, then `POST /api/enrollments` with the object keys. Response is a slim acknowledgement (`id`, `enrollmentId`, `idempotencyId`, `status`, `capturedAt`, `createdAt`, `idempotentReplay`).
3. Retrying with the same `idempotencyId` returns the same slim acknowledgement with `idempotentReplay: true`.
4. A different request with the same first name + last name + `dateOfBirth` (`YYYY-MM-DD`) is rejected as `DUPLICATE_ENROLLMENT`.
5. After the client finishes its one-by-one pending loop, call `POST /api/auth/sync` to persist `lastSyncedAt` on the user record.

## Scripts

```bash
pnpm --filter backend infra:up
pnpm --filter backend infra:down
pnpm --filter backend dev
pnpm --filter backend build
pnpm --filter backend lint
pnpm --filter backend typecheck
pnpm --filter backend test
pnpm --filter backend test:e2e
pnpm --filter backend architecture:check
pnpm --filter backend prisma:seed
```

## Railway / Chromium (ID cards)

ID-card PDF generation needs Puppeteer's Chrome binary plus Linux shared libraries.

1. Set the Railway service **Root Directory** to `backend` so `backend/nixpacks.toml` installs Chrome system deps.
2. Ensure the build command runs `pnpm build` (or `pnpm --filter backend build` from the monorepo root) — the backend build downloads Chrome via `puppeteer browsers install chrome`.
3. Optional override: set `PUPPETEER_EXECUTABLE_PATH` if you provide your own Chromium binary.
4. pnpm must allow Puppeteer's install script (`puppeteer` is listed under `onlyBuiltDependencies` in `pnpm-workspace.yaml`).

After deploy, the warm-up log should say `ID card Chromium ready` instead of "Could not find Chrome".
