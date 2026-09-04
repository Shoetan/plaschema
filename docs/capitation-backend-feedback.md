# Capitation backend feedback

Date: 4 September 2026

## What the admin app now uses

The admin Capitation page is built around these production endpoints:

- `GET /api/capitations?month=&year=&cursor=&limit=&lga=&search=`
- `GET /api/capitations/preview?month=&year=`
- `POST /api/capitations/generate`

The frontend does not send a rate when previewing or generating. It uses the rate configured on the backend.

## Summary field may be getting removed

Swagger says `GET /api/capitations` returns the records, pagination details, and a `summary` containing the full totals for the latest run.

Expected information:

```json
{
  "data": [],
  "meta": {
    "nextCursor": null,
    "hasMore": false,
    "limit": 50
  },
  "summary": {
    "runId": "uuid",
    "month": 9,
    "year": 2026,
    "rate": 700,
    "generatedAt": "2026-09-04T10:00:00.000Z",
    "totalFacilities": 20,
    "totalBeneficiaries": 1000,
    "totalCapitation": 700000
  }
}
```

The current global response wrapper checks for `data` and `meta`, then creates a new response containing only `success`, `data`, and `meta`. This appears to remove `summary` before the response reaches the frontend.

Likely response reaching the frontend:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "nextCursor": null,
    "hasMore": false,
    "limit": 50
  }
}
```

Please either:

1. Preserve `summary` at the top level of the success response; or
2. Put both records and summary inside `data`, then update Swagger to show that structure.

The first option causes less frontend change because it matches the current Swagger description most closely.

Until this is corrected, the frontend uses `summary` when present. If records arrive without it, the page clearly labels its cards as **Current page** totals so admins are not shown incomplete figures as full-run figures.

## Features not covered by the current endpoints

The current capitation API does not provide:

- Payment status such as paid, partly paid, or unpaid.
- An action for marking a facility as paid.
- Printing or exporting a capitation run.
- An exceptions list.
- A separate payment or facility breakdown.
- Generating for only selected LGAs or selected facilities.

The frontend has removed those controls for now. They can be added later when backend endpoints and response fields exist.

## Repeat generation

The backend allows another run to be generated for the same month and year. The latest run becomes the one returned by the list endpoint, while older runs remain stored. The frontend calls this **Regenerate capitation** and shows a warning before continuing.
