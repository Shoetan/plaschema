# Plaschema

pnpm monorepo containing the frontend and backend applications.

## Requirements

- Node.js 20.19+ or 22.12+
- pnpm 10

## Getting started

```bash
pnpm install
cp frontend/.env.example frontend/.env
pnpm dev
```

Root commands target the frontend until a backend stack is selected:

```bash
pnpm dev
pnpm build
pnpm lint
```

See [`docs/feature-folder-structure.md`](docs/feature-folder-structure.md) before adding product features.
