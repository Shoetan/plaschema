# Backend

NestJS Clean Architecture API for Plaschema.

## Stack

- NestJS 11
- PostgreSQL + Prisma 7
- Redis (ioredis)
- UUID v7 (`uuid`)
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
```

### Full stack (frontend + backend + infra)

```bash
pnpm dev
```

### Backend only

```bash
pnpm --filter backend infra:up
pnpm --filter backend dev
# or from root:
pnpm dev:backend
```

- API prefix: `/api`
- Liveness: `GET /health/live`
- Readiness: `GET /health/ready` (Postgres + Redis)
- Swagger: `http://localhost:3000/api/docs` (when `SWAGGER_ENABLED=true`)

## Architecture

Clean Architecture only (no DDD / bounded contexts). Feature modules belong under `src/modules/<feature>/{domain,application,presentation,infrastructure}` when product work starts. Platform concerns live under `src/platform/`.

Primary keys should use PostgreSQL `Uuid` columns with application-generated UUID v7 values (`src/platform/ids`).

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
pnpm --filter backend prisma:validate
```
