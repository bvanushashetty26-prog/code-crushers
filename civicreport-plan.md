# CivicReport — Community Problem Reporting & Resolution Platform Plan

## Overview

**Goal:** Extend the existing CivicReport Flask application into a fully functional community
platform matching all specified requirements: user authentication with three roles, a public
browsable reports list and map, reviewer tools, staff progress updates, resident fix-verification,
a complete set of statuses, server-enforced permissions, EXIF stripping, rate limiting, and a
thorough README with demo walk-through.

**Stack:** Flask (Python) + SQLite + vanilla JavaScript + Leaflet.js + custom CSS. This is the
existing stack. Two new Python dependencies are added:
- `flask-login` — session-based authentication (resident, reviewer, staff/admin roles)
- `Pillow` — EXIF metadata removal from uploaded images

No framework rewrite is needed. All additions follow existing patterns: Jinja2 templates,
`fetch()` API calls, `script.js` page-detection blocks, and `style.css`.

**Scope:** Smallest complete version first — all core flows working end-to-end. Notification
hooks, multilingual additions, offline support, and city-system integrations are scaffolded
but inactive.

---

## Sub-Tasks

---

### Sub-Task 1 — Database Schema & Migration

**Status:** `[ ] pending`

**Intent:**
Add new columns and tables to support authentication, the expanded status set, and change
attribution (who changed a status). Provide a migration path for the existing database.

**Expected Outcomes:**
- `users` table with id, username, email (hashed for privacy), password_hash, role, created_at, is_active
- `reports` table gains: `submitted_by` (user id, nullable for anonymous), `is_demo` flag (bool, marks seed data)
- `status_history` table gains: `changed_by` (user id or 'system'), `evidence_note` (text)
- Valid statuses expanded to: Submitted, Under Review, Assigned, In Progress,
  Resolved—Awaiting Verification, Closed, Rejected, Duplicate
- Migration script applies changes safely to the existing `civicreport.db`

**Todo List:**
1. Update `init_db()` in `app.py` to create a `users` table
2. Add `submitted_by` INTEGER FK and `is_demo` INTEGER DEFAULT 0 to `reports`
3. Expand the `status` CHECK constraint to include the new statuses
4. Add `changed_by` TEXT and `evidence_note` TEXT columns to `status_history`
5. Add migration blocks for existing databases (ALTER TABLE IF NOT EXISTS pattern)
6. Update `_VALID_STATUSES` constant in `app.py`
7. Update `seed_data.py` to set `is_demo = 1` on all seed records and re-seed if run

**Relevant Context:**
- [`app.py`](civicreport/app.py:53) — `init_db()`, migration blocks around line 103
- [`seed_data.py`](civicreport/seed_data.py) — seed script

---

### Sub-Task 2 — Authentication (Flask-Login)

**Status:** `[ ] pending`

**Intent:**
Implement a real login/register system with three roles. Protect state-changing API endpoints
on the server. Keep personal details (email) off public pages. Provide three demo accounts.

**Expected Outcomes:**
- `requirements.txt` includes `flask-login` and `Pillow`
- `GET /login`, `POST /login` — login form
- `GET /register`, `POST /register` — resident self-registration (username, email, password)
- `POST /logout`
- Demo accounts created at startup if absent: `resident@demo` (resident), `reviewer@demo` (reviewer), `staff@demo` (staff), password `demo1234` for all
- `current_user` available in all templates; header shows username + role badge + logout
- `@login_required` on admin/staff pages; role-checked decorator `@require_role(...)` for API writes
- `POST /api/reports` — anonymous allowed (submitted_by = NULL)
- `PUT /api/reports/<id>/status` — requires reviewer or staff role
- `POST /api/reports/<id>/verify` — requires resident role (new endpoint)
- `POST /api/reports/<id>/link-duplicate` — requires reviewer role (new endpoint)
- All sensitive fields (email, password_hash) never returned in API JSON responses
- Passwords hashed with `werkzeug.security.generate_password_hash`

**Todo List:**
1. Add `flask-login` and `Pillow` to `requirements.txt`
2. Implement `User` model class with `UserMixin` and `get_id()`
3. Add `LoginManager` to `app.py`, configure `user_loader`
4. Create `templates/login.html` and `templates/register.html`
5. Implement `POST /login` and `POST /register` routes
6. Add `create_demo_accounts()` called in `with app.app_context()` startup
7. Implement `@require_role(*roles)` decorator
8. Guard existing `PUT /api/reports/<id>/status` with `@require_role('reviewer', 'staff', 'admin')`
9. Guard new duplicate-link and verify endpoints when added in later sub-tasks
10. Update all templates to show login state and role badge in the header
11. Add `GET /logout` route

**Relevant Context:**
- [`app.py`](civicreport/app.py:1) — imports section and route definitions
- [`templates/index.html`](civicreport/templates/index.html:12) — header nav (replicate pattern in all templates)
- [`static/style.css`](civicreport/static/style.css) — add `.role-badge`, `.user-chip` styles

---

### Sub-Task 3 — Public Reports Browse Page (`/browse`)

**Status:** `[ ] pending`

**Intent:**
Give unauthenticated residents a searchable, filterable, paginated list and map of public
reports. This is the missing public-facing discovery surface.

**Expected Outcomes:**
- New page `GET /browse` renders `templates/browse.html`
- Full-text search field filters by title + description client-side (debounced) or passes `q=` to API
- API `GET /api/reports` gains `q` (text search) and `date_from` / `date_to` filter params
- Filter controls: category, status, priority, date range
- Results list shows: tracking ID, title (truncated), category, priority badge, status, date, location (address only — no exact coordinates shown)
- Leaflet map panel shows pinned locations; clicking a pin opens the report detail
- Empty state: "No reports match your filters."
- Loading skeleton shown while fetching
- "Report a problem" CTA button prominent on page
- No personal information (email, name) shown
- `is_demo` reports shown with a "Demo data" badge

**Todo List:**
1. Add `q`, `date_from`, `date_to` query parameters to `GET /api/reports` in `app.py`
2. Create `templates/browse.html` with header, filter bar, results list, and map panel
3. Add `initBrowsePage()` to `static/script.js` with debounced search and filter handlers
4. Wire Leaflet map with report pins; popup links to `/reports/<tracking_id>`
5. Add "Demo data" badge styling in `style.css`
6. Add `/browse` link to all page headers
7. Implement loading skeleton and empty/error states in the browse page

**Relevant Context:**
- [`app.py`](civicreport/app.py:407) — `api_list_reports()` to extend
- [`templates/admin.html`](civicreport/templates/admin.html:95) — table + map pattern to reuse
- [`static/script.js`](civicreport/static/script.js:862) — `loadReports()` and `renderMarkers()` patterns

---

### Sub-Task 4 — Public Report Detail Page (`/reports/<tracking_id>`)

**Status:** `[ ] pending`

**Intent:**
Every report gets a canonical public URL showing full description, privacy-safe location,
images, and complete chronological status history. Replaces the "track by ID" only flow with
a direct-link page. The track page continues to work.

**Expected Outcomes:**
- `GET /reports/<tracking_id>` serves `templates/report_detail.html`
- Shows: title, description, category, priority, status, address (not exact GPS), submitted date, image (if any)
- Status history timeline shows status, note, changed_by (name/role, never email), timestamp
- "Duplicate of `<tracking_id>`" notice links to primary report
- "Me Too" upvote widget retained from existing track page
- Fix verification widget (see Sub-Task 6) shown when status is "Resolved—Awaiting Verification"
- No resident name, email, or exact coordinates exposed
- Image displayed from `/static/uploads/<filename>`; if no image, placeholder shown
- Meta `<title>` and `<description>` are set for social sharing

**Todo List:**
1. Add `GET /reports/<tracking_id>` Flask route rendering `report_detail.html`
2. Create `templates/report_detail.html` with all the described sections
3. Add `initDetailPage()` to `script.js` that fetches `/api/reports/<id>` and renders
4. Apply privacy filter: never expose latitude/longitude or email in the template or API call
5. Link browse page pins and admin table tracking IDs to `/reports/<id>`
6. Add link from old track page "view full details" button to this page
7. Ensure image EXIF is already stripped at upload time (see Sub-Task 5)

**Relevant Context:**
- [`templates/track.html`](civicreport/templates/track.html) — reuse timeline and stepper components
- [`app.py`](civicreport/app.py:470) — `api_get_report()` — add public detail route alongside
- [`static/script.js`](civicreport/static/script.js:457) — `render()` function to adapt

---

### Sub-Task 5 — Image Upload: EXIF Stripping & Server Validation

**Status:** `[ ] pending`

**Intent:**
Protect resident privacy by removing GPS and other EXIF metadata from uploaded images.
Add server-side file-type verification beyond extension checking.

**Expected Outcomes:**
- `Pillow` used to open and re-save uploaded images, stripping EXIF data
- `piexif` or Pillow's built-in `image.save()` without `exif=` arg removes metadata
- Server verifies file magic bytes (JPEG/PNG/GIF/WebP signatures) before saving
- Files larger than 5 MB rejected server-side (not just client-side)
- Animated GIF metadata stripped or file saved as static image
- Error response returned if validation fails; file not saved

**Todo List:**
1. Add `Pillow` import to `app.py` (already in requirements from Sub-Task 2)
2. Update `save_upload()` in `app.py` to open image with PIL, strip EXIF, and re-save
3. Add magic-byte check: read first 12 bytes and match against known signatures
4. Add 5 MB server-side size check before processing
5. Return JSON error if validation fails
6. Keep original filename extension but use UUID stem (already done)
7. Add test: submit a JPEG with GPS EXIF; confirm stripped file has no GPS tag

**Relevant Context:**
- [`app.py`](civicreport/app.py:123) — `save_upload()` function

---

### Sub-Task 6 — Reviewer Tools & Expanded Statuses

**Status:** `[ ] pending`

**Intent:**
Give reviewers a dedicated panel to approve, reject, categorize, prioritize, assign, and
manually link duplicate reports. Enforce reviewer role server-side. Introduce the full status
set including Rejected, Closed, Duplicate, and Resolved—Awaiting Verification.

**Expected Outcomes:**
- Admin panel is now the "Reviewer Dashboard" (accessible to reviewer + admin roles)
- Status dropdown includes all 8 statuses; Rejected requires a note; Resolved transitions to "Resolved—Awaiting Verification" automatically
- "Reject" sets status=Rejected and records reason in status_history
- "Mark Duplicate" panel: reviewer picks primary tracking ID from search box; sets status=Duplicate; `duplicate_of` set; note recorded
- New `POST /api/reports/<id>/link-duplicate` endpoint: `{ "primary_tracking_id": "CIV-1007" }` — requires reviewer role
- "Unreviewed" badge shown on reports that have never had a reviewer action (status is still Submitted and no history entry by a reviewer)
- Dashboard gains "Overdue" metric: Assigned/In Progress reports older than 14 days
- Dashboard gains "Awaiting Verification" count
- Admin table "Actions" column gets Approve / Reject / Mark Duplicate quick buttons
- Category and priority overrides possible from the reviewer panel (new API fields)
- `PUT /api/reports/<id>/status` extended to accept `category` and `priority_level` overrides when called by reviewer

**Todo List:**
1. Update `_VALID_STATUSES` to include all 8 statuses
2. Add `POST /api/reports/<id>/link-duplicate` route with reviewer role guard
3. Extend `PUT /api/reports/<id>/status` to accept optional `category` and `priority_level`
4. Add overdue query to `GET /api/stats`
5. Add "awaiting verification" count to `GET /api/stats`
6. Update `templates/admin.html` status dropdown with all 8 statuses
7. Add "Mark Duplicate" panel to admin action section
8. Add Approve / Reject quick-action buttons to table rows
9. Add overdue and awaiting-verification cards to dashboard stats row
10. Add "Unreviewed" indicator logic: reports with status=Submitted and no reviewer history
11. Update status stepper in track/detail pages to handle new statuses

**Relevant Context:**
- [`app.py`](civicreport/app.py:565) — `api_update_status()`, `_VALID_STATUSES`
- [`templates/admin.html`](civicreport/templates/admin.html:119) — action panel
- [`static/script.js`](civicreport/static/script.js:706) — `initAdminPage()`

---

### Sub-Task 7 — Staff Progress Updates & Resident Fix Verification

**Status:** `[ ] pending`

**Intent:**
Staff can record progress notes and resolution details. Residents can confirm a fix worked
or report the problem persists. A report cannot show as Resolved without a recorded update.

**Expected Outcomes:**
- `GET /staff` renders `templates/staff.html` — shows only reports assigned to current user
- Staff can add a progress note (POST to status endpoint with status=In Progress + note)
- Staff can record resolution: sets status to "Resolved—Awaiting Verification" and requires a resolution note (not blank)
- Server rejects a transition to "Resolved—Awaiting Verification" if `note` is empty
- Fix verification: logged-in residents (or anonymous via cookie-token) on the report detail page see a "Was this fixed?" widget when status is "Resolved—Awaiting Verification"
- `POST /api/reports/<tracking_id>/verify` accepts `{ "resolved": true|false, "note": "..." }`
  - If resolved=true: status → Closed; history entry: "Resident confirmed resolution"
  - If resolved=false: status → In Progress; history entry: "Resident reports issue persists"
- Rate-limit verify endpoint: once per tracking_id per browser session (cookie)
- Staff dashboard shows: my assigned reports, recently resolved, overdue assignments

**Todo List:**
1. Create `GET /staff` route and `templates/staff.html`
2. Add `initStaffPage()` to `script.js` — fetches assigned reports for current user
3. Add `POST /api/reports/<tracking_id>/verify` route in `app.py`
4. Add server validation: status "Resolved—Awaiting Verification" requires non-empty note
5. Add cookie-based one-vote guard on the verify endpoint
6. Update `report_detail.html` to show verification widget when status matches
7. Add staff-specific nav link and role guard in the header

**Relevant Context:**
- [`app.py`](civicreport/app.py:565) — `api_update_status()` — add note-required validation
- [`templates/report_detail.html`](civicreport/templates/report_detail.html) — created in Sub-Task 4
- Auth decorator from Sub-Task 2

---

### Sub-Task 8 — Rate Limiting & Basic Spam Controls

**Status:** `[ ] pending`

**Intent:**
Prevent abuse of the public report submission and verify endpoints. Keep it lightweight
(in-process dictionary, no Redis needed for MVP) with clear error messaging.

**Expected Outcomes:**
- `POST /api/reports` limited to 5 submissions per IP per hour
- `POST /api/reports/<id>/metoo` limited to 1 per tracking_id per IP
- `POST /api/reports/<id>/verify` limited to 1 per tracking_id per browser cookie
- Rate-limit exceeded returns HTTP 429 with a human-readable error message
- Minimum description length enforced: 20 characters
- Title sanitized: strip HTML, max 200 chars
- Description sanitized: strip HTML, max 2000 chars

**Todo List:**
1. Implement `RateLimiter` class in `app.py` — in-memory dict `{ip: [(timestamp,), ...]}` with sliding window cleanup
2. Add IP-based rate-limit check at top of `api_create_report()`
3. Add IP-based check in `api_metoo()`
4. Add cookie-token check in `api_verify()` (cookie set on first visit)
5. Add minimum description length check (20 chars)
6. Add HTML-strip utility function using `re` (no extra dependency)
7. Return 429 with `{ "error": "Too many requests. Please wait before submitting again." }`

**Relevant Context:**
- [`app.py`](civicreport/app.py:302) — `api_create_report()`
- [`app.py`](civicreport/app.py:511) — `api_metoo()`

---

### Sub-Task 9 — Accessibility, Responsiveness & UX Polish

**Status:** `[ ] pending`

**Intent:**
Ensure the app is usable on phones, keyboard-navigable, and clear to screen readers. Add
complete loading, empty, and error states across all new pages.

**Expected Outcomes:**
- All interactive elements have visible focus styles
- Form labels and inputs correctly associated with `for`/`id` pairs
- Map panels have `aria-label` and keyboard trap is avoided
- Status badges use both color and text (not color alone)
- All images have meaningful `alt` text
- New pages (browse, detail, staff) are responsive: single-column on mobile, two-column on desktop
- Loading skeleton used consistently on all data-loading pages
- Empty state illustrations/messages on browse (no results), staff (no assignments), admin (no reports)
- Error banners on network failure
- Demo data badge styled clearly but unobtrusively

**Todo List:**
1. Audit all new templates for missing `aria-label`, `role`, and `for` attributes
2. Add `:focus-visible` styles in `style.css` for all interactive elements
3. Add responsive breakpoints in `style.css` for browse, detail, and staff pages
4. Add loading skeleton CSS and markup to browse and staff pages
5. Add empty-state components to browse, staff, and admin pages
6. Verify status badges convey status in text (not only via color class)
7. Add `alt` attributes to all uploaded image `<img>` tags

**Relevant Context:**
- [`static/style.css`](civicreport/static/style.css) — existing responsive patterns

---

### Sub-Task 10 — README, Demo Data & Run Instructions

**Status:** `[ ] pending`

**Intent:**
Document how to run the application, configure services, sign in with demo roles, and walk
through the main resident and reviewer/admin flows. List implemented and future features.

**Expected Outcomes:**
- `civicreport/README.md` updated with:
  - Prerequisites (Python 3.11+, pip)
  - Install & run instructions (virtualenv, `pip install -r requirements.txt`, `python app.py`)
  - Demo account credentials table (username, password, role)
  - Resident flow walk-through (submit → track → verify)
  - Reviewer/admin flow walk-through (review → assign → link duplicate → update)
  - Staff flow walk-through (see assigned → add progress → mark resolved)
  - Map configuration section (default centre coordinates, how to change)
  - Optional services section (email notifications: not active in demo mode)
  - Feature implementation table: what is done, what is phase 2
  - How demo seed data is marked and how to clear/re-seed it

**Todo List:**
1. Rewrite `civicreport/README.md` from scratch with all sections above
2. Ensure `seed_data.py` marks all rows with `is_demo=1` and documents re-seed procedure
3. Add a `DEMO_ACCOUNTS` section in `app.py` comments referencing the README
4. Update `LIMITATIONS.md` to reflect what has now been implemented

**Relevant Context:**
- [`civicreport/README.md`](civicreport/README.md) — existing file to overwrite
- [`civicreport/LIMITATIONS.md`](civicreport/LIMITATIONS.md) — update to reflect new work
- [`civicreport/seed_data.py`](civicreport/seed_data.py) — update `is_demo` flag

---

## Dependency & Ordering

```
Sub-Task 1  (schema)
    ↓
Sub-Task 2  (auth)
    ↓
Sub-Task 5  (EXIF — depends on Pillow from ST2)
Sub-Task 3  (browse — depends on API extensions from ST1)
Sub-Task 4  (detail page — depends on ST3 routes)
    ↓
Sub-Task 6  (reviewer tools — depends on auth + new statuses)
Sub-Task 7  (staff + verify — depends on auth + new statuses)
    ↓
Sub-Task 8  (rate limiting — depends on all endpoints being defined)
Sub-Task 9  (UX polish — depends on all pages existing)
Sub-Task 10 (README — depends on everything else being done)
```

---

## Files Affected

| File | Change |
|---|---|
| `civicreport/app.py` | Schema, auth, new routes, rate limiter, EXIF |
| `civicreport/requirements.txt` | Add flask-login, Pillow |
| `civicreport/static/script.js` | New page init blocks |
| `civicreport/static/style.css` | New components, focus styles, responsive |
| `civicreport/static/i18n.js` | New translation keys |
| `civicreport/templates/login.html` | New |
| `civicreport/templates/register.html` | New |
| `civicreport/templates/browse.html` | New |
| `civicreport/templates/report_detail.html` | New |
| `civicreport/templates/staff.html` | New |
| `civicreport/templates/admin.html` | Extended |
| `civicreport/templates/index.html` | Header update |
| `civicreport/templates/report.html` | Header update |
| `civicreport/templates/track.html` | Header update |
| `civicreport/seed_data.py` | Add is_demo flag |
| `civicreport/README.md` | Complete rewrite |
| `civicreport/LIMITATIONS.md` | Update |

---

## What Is Not In Scope (Phase 2)

- Email notifications (Twilio / SMTP) — hooks scaffolded, inactive
- Multilingual additions beyond existing i18n.js skeleton
- Offline reporting (service worker / IndexedDB)
- Recurring-issue analysis beyond existing hotspot detection
- Service-time analytics
- PostgreSQL migration
- Municipality ERP / GIS integration
- Image AI classification
- OTP phone verification
