# Plaschema

pnpm monorepo containing the frontend and backend applications.

## Requirements

- Node.js 20.19+, 22.12+, or 24+
- pnpm 10
- Docker (optional, for local Postgres/Redis used by the backend)

## Getting started

```bash
pnpm install
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

### Full local stack (recommended)

Starts Postgres + Redis, then runs frontend and backend in watch mode:

```bash
pnpm dev
# alias:
pnpm dev:all
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000/api`
- Login: `POST http://localhost:3000/api/auth/login`
- Liveness: `http://localhost:3000/health/live`
- Readiness: `http://localhost:3000/health/ready`
- Swagger: `http://localhost:3000/api/docs`

Seeded admin (see `backend/.env.example`): `admin@cbhi.local` / `ChangeMe123!`

### Individual apps

```bash
pnpm dev:frontend          # Vite only
pnpm dev:backend           # Docker infra + Nest watch
pnpm infra:up              # Postgres + Redis only
pnpm infra:down            # stop infra
```

### Common scripts

```bash
pnpm build
pnpm lint
pnpm test:backend
pnpm typecheck:backend
```

See [`docs/feature-folder-structure.md`](docs/feature-folder-structure.md) before adding frontend product features.
See [`backend/README.md`](backend/README.md) for Clean Architecture backend conventions.
