# Feature modules

Add product capabilities here as Clean Architecture feature folders:

```text
modules/<feature>/
  domain/
  application/
  presentation/
  infrastructure/
```

Do not invent sample domain features in this scaffold. Wire new features through `src/composition/app.module.ts`.
