# Feature modules

```text
modules/<feature>/
  domain/
  application/
  presentation/
  infrastructure/
```

Current modules:

- `identity` — login, JWT profile, admin user management (cursor list), admin password reset
- `ward` — ward CRUD + CSV/Excel batch upload + cursor list + NDJSON sync stream
- `health-facility` — health facility CRUD + CSV/Excel batch upload + cursor list + NDJSON sync stream
- `enrollment` — beneficiary enrollment (field worker + admin), offline-first idempotency, cursor list, Railway presigned file URLs

Wire new features through `src/composition/app.module.ts`.
