# Feature modules

```text
modules/<feature>/
  domain/
  application/
  presentation/
  infrastructure/
```

Current modules:

- `identity` — login, JWT profile, admin user management (cursor list), admin password reset, field worker detail endpoint
- `ward` — ward CRUD + CSV/Excel batch upload + cursor list + NDJSON sync stream + detail endpoint
- `health-facility` — health facility CRUD + CSV/Excel batch upload + cursor list + NDJSON sync stream + admin detail endpoint
- `enrollment` — beneficiary enrollment (field worker + admin), offline-first idempotency, cursor list with ID-card filters (`printedStatus`, `printCount`, etc.), async ID card PDF generation (BullMQ, 9-up A4), Railway presigned file URLs, activity log writes on create/print
- `activity-log` — ward-scoped activity/audit log (enrollment create/print initially)

Wire new features through `src/composition/app.module.ts`.
