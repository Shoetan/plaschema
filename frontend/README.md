# Frontend

React + TypeScript application built with Vite, Tailwind CSS, and shadcn.

## Commands

Run these from the repository root:

```bash
pnpm dev
pnpm build
pnpm lint
```

## Adding a shadcn component

```bash
pnpm --dir frontend dlx shadcn@latest add card
```

## Environment

Copy `.env.example` to `.env` and set `VITE_API_URL` to the backend API base URL.

Follow the repository's [`feature-folder-structure.md`](../docs/feature-folder-structure.md) when adding features.
