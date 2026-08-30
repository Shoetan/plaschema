# PLASCHEMA Project Handoff

Last updated: 30 August 2026
Last verified code commit: `a73ed09`

## Purpose

This is the living context document for engineers and future coding sessions. Update it after major changes.

## Project layout

| Folder | Purpose | Current state |
| --- | --- | --- |
| `frontend/` | Admin web app | Designs implemented; login and session APIs integrated |
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
- Dashboard and feature data remain mock-only.
- Admin login uses `POST /auth/login`; saved sessions are validated with `GET /auth/me`.
- The typed API layer is split into client, request, error and contract modules and is consumed through feature services and React Query hooks.
- Authentication is admin-only. Zustand owns the access token, authenticated user and session status.
- “Remember me” stores the token and user in local storage; unchecked sessions use session storage. No password is stored.
- There is no refresh-token endpoint. A protected-request 401 clears the session, while a transient `/auth/me` failure preserves it and offers retry/sign-out actions.
- Sonner provides login and session notifications. The existing forgot/reset-password screens are still mock-only.

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
- The admin deployment currently uses the safe relative `/api` fallback. Set a production `VITE_API_URL` in Netlify and rebuild when the live API is available. Do not commit its value.

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

## Known gaps

- Remaining admin API integration beyond authentication.
- Refresh-token support and automatic session renewal.
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
