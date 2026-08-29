# PLASCHEMA Project Handoff

Last updated: 28 August 2026  
Last verified code commit: `a73ed09`

## Purpose

This is the living context document for engineers and future coding sessions. Update it after major changes.

## Project layout

| Folder | Purpose | Current state |
| --- | --- | --- |
| `frontend/` | Admin web app | Designs implemented with mock data |
| `pwa/` | Field-worker mobile PWA | Designs implemented with mock data |
| `backend/` | NestJS API, Prisma, PostgreSQL and Redis | Existing backend project; frontend work must not change it unless requested |
| `docs/` | Project guides and handoff | Read before architecture or routing work |

This is a pnpm workspace. The root scripts manage all three apps.

## Current frontend state

### Admin app

- React, TypeScript, Vite and Tailwind.
- Feature folders live under `frontend/src/features/`.
- Thin route files live under `frontend/src/routes/`.
- Admin designs and navigation are implemented.
- Data, dashboard values and login behavior are mock-only.
- `frontend/src/api/index.ts` contains an Axios client, but no feature calls it yet.
- No real authentication or API integration exists.

### Field-worker PWA

- Separate app under `pwa/` in the same workspace.
- React, TypeScript, Vite, Tailwind, React Router and Zustand.
- Routes: login, home, enrollment, beneficiaries, beneficiary detail, sync and profile.
- Six-step enrollment includes passport and ID-document design inputs.
- Login accepts any non-empty email and password.
- Beneficiaries, worker profile, statistics and synchronization are mock-only.
- Mock enrollment adds a local in-memory beneficiary through Zustand.
- Refreshing the browser resets the mock session and unsaved mock changes.
- No backend requests, real uploads, database storage or real synchronization.

## PWA configuration

- `vite-plugin-pwa` generates the manifest and service worker.
- App name: **PLASCHEMA Field Worker**.
- Display mode: standalone.
- Static app files are precached.
- SPA navigation falls back to `index.html`.
- An update prompt appears when a new version is ready.
- Current icon is `pwa/public/logo.svg` for normal and maskable use.
- No push notifications, background sync, authenticated API caching or private offline storage.
- Production work should add tested PNG icons and an Apple touch icon.

## Commands

From the repository root:

```bash
pnpm install
pnpm dev              # backend, admin and PWA
pnpm dev:frontend     # admin only
pnpm dev:pwa          # PWA only, normally http://localhost:5174
pnpm dev:backend      # backend and infrastructure only

pnpm build
pnpm build:frontend
pnpm build:pwa
pnpm lint
pnpm lint:pwa
pnpm test:pwa
```

Vite may choose the next port if `5174` is already occupied.

## Decisions already made

- Keep admin and PWA as separate apps in the same Git repository.
- Use `frontend/` for admin and `pwa/` for the mobile field-worker app.
- Use Zustand for shared client state.
- Convert and review designs before integrating APIs.
- Keep both frontend apps mock-only until backend integration is requested.
- Do not modify the backend as part of frontend design work.
- Support both Android and iPhone layouts.
- Ask before adding packages that were not already approved for the task.

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

## Known gaps

- Admin API integration.
- PWA API integration and real authentication.
- Durable offline enrollment storage.
- Real file upload and synchronization.
- Production PWA PNG icons and iPhone install assets.
- Full real-device browser testing.
- Broader frontend test coverage.

## Suggested next work

1. Review every admin and PWA screen against the source designs.
2. Record UI fixes before starting API work.
3. Agree on backend contracts for login, lists, enrollment, files and sync.
4. Add typed services and hooks one feature at a time.
5. Add durable offline storage only when backend integration begins.

## Handoff update checklist

When finishing major work:

1. Update the current state and known gaps.
2. Record important decisions and new packages.
3. Update commands if scripts changed.
4. Run and record relevant checks.
5. Replace the last verified commit after the work is committed.
