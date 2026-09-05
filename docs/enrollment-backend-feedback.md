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

### 1. Admins cannot change an enrollment

There is no update, status-change or delete endpoint for enrollments. The admin UI therefore shows enrollment status as read-only and does not show the old mock Edit, Activate, Deactivate or Delete actions.

If admins should manage these later, the backend needs clear endpoints and rules for which fields and status changes are allowed.

### 2. Export filters do not fully match list filters

The enrollment list supports broad search, beneficiary name, enrollment ID and printed status. The report export endpoint does not accept those filters.

The frontend warns the admin and exports using only the supported ward, facility, field worker, status, category, LGA, date and age filters. Supporting the same filters on both endpoints would make the spreadsheet match the visible list.

### 3. There is no overall enrollment total

Cursor pagination reports whether another page exists, but not how many enrollments exist across every page. The frontend can only say how many rows are shown on the current page.

An overall total or summary endpoint would be needed for programme-wide enrollment cards and exact result counts.

### 4. Categories have no lookup endpoint

The API accepts an exact category string but does not provide a list of allowed or existing categories. The admin currently enters the category as text so the UI does not hide valid backend values.

A category lookup endpoint or fixed documented enum would allow a safer dropdown.

### 5. Failed report jobs cannot be repeated from Files

There is no file-job retry endpoint, and enrollment report job metadata does not keep the filters used to create the report. A failed ID-card job can be recreated because its enrollment IDs are available, but a failed report sends the admin back to CBHI Enrolments to start again.

Either a retry endpoint or report filters in job metadata would allow one-click report retries.
