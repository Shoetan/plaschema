# Admin enrollment backend feedback

Date: 4 September 2026

The admin enrollment list, detail, ID-card generation, Excel export and generated-files screens are now connected to the production contracts.

## What works with the current API

- Admins can list and filter enrollments with `GET /api/enrollments`.
- The full enrollment record and its activity can be shown by combining `GET /api/enrollments/{id}` and `GET /api/enrollments/{id}/detail`.
- ID-card PDFs can be queued for one to nine enrollments.
- Excel enrollment reports can be queued.
- The Files page can list jobs, follow their progress and request a fresh download link.

## Gaps to discuss

### 1. Status changes are resolved; general editing and deletion remain unavailable

Admins can now activate or deactivate one enrollment with `PATCH /api/enrollments/{id}` and up to 100 enrollments with `POST /api/enrollments/status`. The admin UI integrates both endpoints and reports partial bulk results.

There is still no general record-editing or deletion endpoint. Those actions remain unavailable in the admin UI.

### 2. Export filters do not fully match list filters

The enrollment list supports broad search, beneficiary name, enrollment ID and printed status. The report export endpoint does not accept those filters.

The frontend warns the admin and exports using only the supported ward, facility, field worker, status, category, LGA, date and age filters. The confirmation dialog lists the exact supported filters being submitted; if none are selected, it explicitly confirms that all enrollments will be exported. Supporting the same filters on both endpoints would make the spreadsheet match the visible list completely.

### 3. There is no overall enrollment total

Cursor pagination reports whether another page exists, but not how many enrollments exist across every page. The frontend can only say how many rows are shown on the current page.

An overall total or summary endpoint would be needed for programme-wide enrollment cards and exact result counts.

### 4. Categories have no lookup endpoint

The API accepts an exact category string but does not provide a list of allowed or existing categories. The admin now uses the same three fixed programme categories as the PWA and dashboard: IDPs, Elderly 65+, and Indigents / Very Poor / Others.

A category lookup endpoint or fixed documented enum would keep this frontend list authoritative if programme categories change later.

### 5. Failed report jobs cannot be repeated from Files

There is no file-job retry endpoint, and enrollment report job metadata does not keep the filters used to create the report. A failed ID-card job can be recreated because its enrollment IDs are available, but a failed report sends the admin back to CBHI Enrolments to start again.

Either a retry endpoint or report filters in job metadata would allow one-click report retries.
