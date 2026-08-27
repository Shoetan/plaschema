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

## Key endpoints

- `POST /api/auth/login`
- `POST /api/users/:id/reset-password` (admin only; no email)
- `POST /api/wards/batch` — CSV or Excel (.xlsx/.xls); columns: `name,lga`
- `GET /api/wards` — cursor pagination (`cursor`, `limit`)
- `GET /api/wards/stream` — NDJSON stream for offline/mobile cache sync (`updatedSince` optional)
- `POST /api/health-facilities/batch` — CSV or Excel (.xlsx/.xls); columns: `name,lga,ward`
- `GET /api/health-facilities` — cursor pagination (`cursor`, `limit`)
- `GET /api/health-facilities/stream` — NDJSON stream for offline/mobile cache sync
- `POST /api/enrollments/files` — upload passport or ID document (local storage stub)
- `POST /api/enrollments` — create enrollment (idempotent via `idempotencyId`; duplicate = first+last+DOB)
- `GET /api/enrollments` / `GET /api/enrollments/:id`

Roles: `admin` | `field_worker`. Field workers may only enroll in assigned wards.

### Offline-first enrollment sync

1. On device, generate a UUID v7 `idempotencyId` and capture `capturedAt` when the form is filled offline.
2. When online, upload passport + ID files, then `POST /api/enrollments` with the object keys (server generates enrollment `id`).
3. Retrying with the same `idempotencyId` returns the original enrollment (`idempotentReplay: true`).
4. A different request with the same first name + last name + `dateOfBirth` (`YYYY-MM-DD`) is rejected as `DUPLICATE_ENROLLMENT`.

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
