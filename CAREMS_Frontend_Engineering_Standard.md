# CAREMS — Frontend Engineering Standard (v1.0)
**Attach this alongside:** `Master_Plan.md`, `API_Contract.md`, `CAREMS_ERD.mermaid`, `CAREMS_Wireframes.html`, `Chart_of_Accounts.md`, and the **Backend & Database: Complete Decision Summary**.

**Purpose of this document:** a prior frontend build attempt produced real, working screens (Executive Dashboard, Accountant Workspace, Project Manager Workspace) but also produced repeated problems: invented API function names presented as verified, an approved screen silently deleted during a later rebuild, unexplained stray files, and no login/authentication flow at all despite five role-based portals being planned. This document exists so the next build avoids all of that. **Treat every rule below as non-negotiable unless the Instructor (the human, or whoever is coordinating this project) explicitly changes it.**

---

## 1. Tech stack (locked decision)

- **React + Vite**. No plain HTML/JS/CSS app — that approach was tried and became unmaintainable within three tickets.
- **Supabase JS client** (`@supabase/supabase-js`) talking directly to Postgres functions via **RPC** — this is not a REST API. There is no `/api/v1/...` path-based backend. Do not build or assume one.
- **Supabase Auth** for login/session (Section 4 below) — this has never been built and must be the first thing done in this rebuild, before any workspace screen.
- Credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) live only in a git-ignored `.env` file, never hardcoded in source, never invented. If you don't have confirmed real values, use placeholder env var names and tell the Instructor directly — do not guess or fabricate values, and do not claim to have "verified" a live schema unless you actually have a working, connected tool that did so.

---

## 2. Authoritative API surface — do not invent function names

The backend is **41 Postgres functions in Supabase's `api` schema**. This table is the only trusted source for their names. If a screen needs something not listed here, **do not invent a plausible-sounding function name** — flag it to the Instructor as a gap and build a clearly-labeled stub instead.

| Purpose | Real RPC function | Notes |
|---|---|---|
| List/get any master data (customers, suppliers, employees, projects, equipment) | `get_records(p_resource, p_id?, p_page, p_limit)` | Generic — `p_resource` is a string like `'customers'`, `'projects'`, etc. There is **no** `list_customers`, `list_projects`, etc. |
| Create any master data | `create_record(p_resource, p_payload)` | Same generic pattern |
| Update any master data | `update_record(p_resource, p_id, p_payload)` | Same generic pattern |
| Deactivate a CoA account | `accounts_deactivate(p_id)` | Sets `is_postable = false`; there is no separate active/inactive flag |
| Auto-assign next CoA code | `assign_next_code(...)` | Internal helper — accounts never accept a user-typed `code`, ever, anywhere |
| Get/update tax rates | `tax_rates_get()` / `tax_rates_update(p_tax_type, p_rate)` | |
| Payment method accounts (replaces old bank_accounts idea) | `list_payment_method_accounts()` | Returns CoA rows with `payment_method_type` set |
| Submit/approve/reject completion assessment | `completion_assessment_submit(p_project_id, ...)` / `_approve` / `_reject` | Revenue posts `Dr 1150 / Cr {project's revenue_account_id}` — never touches AR/Cash |
| Create invoice | `invoice_create(p_payload)` | `project_id` required; draws down WIP then Client Advances; server-generates `invoice_number` |
| Record customer payment | `payment_received_create(p_payload)` | No `invoice_id` → posts to Client Advances, never Revenue |
| Create expense | `expense_create(p_payload)` | `project_id` nullable (overhead is valid); returns `success:true` with `data.budget_flag = true` if over budget — **this is a successful save with a warning, not an error** |
| Record supplier payment | `payment_made_create(p_payload)` | |
| Create/approve/reject/pay payroll run | `payroll_run_create` / `payroll_run_approve` / `payroll_run_reject` / `payroll_run_pay(p_run_id, p_payload)` | Only `employment_status='Active'` employees included; every active employee needs `staff_category` set or the run must be blocked with a named-employee validation error |
| Fixed asset acquire/depreciate/dispose | `assets_create(p_payload)` / `assets_run_depreciation(p_period)` / `assets_dispose(p_id, p_payload?)` | |
| Reports | `report_trial_balance(p_as_of)`, `report_income_statement(p_from,p_to)`, `report_sofp(p_as_of)`, `report_cash_flow(p_from,p_to)`, `report_project_profitability(p_project_id)`, `report_budget_vs_actual(p_project_id)` *(total-only, not per-category)*, `report_ageing(p_type,p_page,p_limit)`, `report_tax(p_type,p_period)` | |
| Dashboards | `dashboard_executive()`, `dashboard_accountant_tasks()` | No arguments |

**Known gaps — do not build screens that call these, use disabled placeholders instead:**
- Rental invoicing (`POST /rentals/:id/invoice` equivalent) — **no backing function exists**
- `settings/company-profile` (company name/phone/locations) — **no backing function exists**
- An aggregate all-projects profitability endpoint and a rental-revenue-trend endpoint (both referenced by the CEO dashboard's chart panels) — **no backing function exists**
- Site Reports (`POST /projects/:id/site-reports`) — **no backing function exists**
- Tax remittance/payment — **no backing function exists**; tax reports are read-only

**Standing rule:** if you are not fully certain a function name or parameter shape is correct, say so explicitly in your report. A wrong function name presented with false confidence is worse than an honestly-flagged guess — it fails silently once connected to a real database.

---

## 3. Role-based portals (per Master Plan / Wireframes)

Five roles, five distinct routed sections in one app, never built as separate apps:

| Role | Portal | Key screens |
|---|---|---|
| CEO/MD | Executive | Dashboard (view-only), Financial Overview, Project Portfolio, Equipment Rentals, Tax & Compliance, Reports, Alerts |
| Accountant | Accountant Workspace | Full read/write: CoA, Journal Entries (read-only), Invoicing, Expenses, Payroll, Rentals (placeholder), Tax, Fixed Assets, Reporting, Settings |
| Project Manager | PM Workspace | My Projects (own projects only), Completion Assessment submission (never approval), Site Reports (placeholder), Budget vs Actual (read-only, total-only) |
| Employee | Self-Service | Profile, Payslips, Leave, Assigned Projects, Announcements |
| Admin | Admin Panel | User Management, Roles & Permissions, Audit Log, Security Monitoring — **no financial endpoints at all** |

A user only ever sees their own portal. Role comes from `public.users.role`, resolved server-side — **never let the frontend self-select a role via a "role switcher"** in production; that was a demo-only placeholder in the prior build and must not be treated as real access control.

---

## 4. Authentication & Login — build this first, it does not exist yet

This is the single biggest gap from the previous attempt: every workspace was built as if a user were already logged in, with no actual sign-in flow. Before any workspace screen, build:

1. **A login page** — email + password, using Supabase Auth (`supabase.auth.signInWithPassword`). Company branding area at the top (logo/name) pulled from the company-profile placeholder object — never hardcode a business name here either.
2. **No self-registration.** Per the Master Plan, accounts are provisioned by an Admin — there is no "Sign Up" link or flow on this login page.
3. **Session handling.** On successful login, resolve the user's role (via their linked `public.users` row) and redirect to their portal. Persist the session across reloads using Supabase's built-in session storage — don't hand-roll token storage.
4. **Protected routes.** Every portal route must check for an active session and correct role before rendering; redirect to login if absent, and redirect to the user's *own* portal (not an error page) if they try to access a different role's route.
5. **Logout** — a visible action in the nav shell, available from every portal.
6. **Failed login** — a clear inline error, no hint about which part (email vs. password) was wrong.
7. Password reset / "forgot password" can be a simple Supabase `resetPasswordForEmail` flow if time allows, but is not blocking for Phase One — flag it as deferred if skipped, don't silently omit it without saying so.

---

## 5. Design system standards

- **Theming:** dark and light mode via CSS custom properties, toggle in the top nav on every screen, defaults to OS preference (`prefers-color-scheme`), persists the user's explicit choice. No component may hardcode a color directly.
- **Responsive breakpoints:** Desktop ≥1024px (full sidebar), Tablet 768–1023px (collapsed/icon sidebar, 2-column grids), Phone <768px (bottom nav or drawer, single-column, tables become scrollable or stacked cards). Every screen must be checked at all three, not inherited-and-assumed.
- **Company details** (name, phone, locations) are never hardcoded anywhere — nav bar, login page, invoice previews, footers. Pull from a company-profile object; until the backend endpoint exists, use an obvious placeholder ("Your Company Name") and mark the Settings screen as pending-backend.
- **Three states on every screen:** loading, empty, error — with real messaging, never blank space.
- **Pending-backend / not-yet-built features** (Rentals invoicing, Site Reports, Company Profile save, aggregate charts) must be visibly labeled — "Coming soon" on disabled actions, "Mock data — pending backend" captions on placeholder charts. Never present a non-functional screen as if it works.
- **Money formatting:** GHS with two decimals and thousands separators. Foreign-currency transactions show both the transaction-currency amount and the GHS `functional_amount`.
- **Account codes are never user-typed**, anywhere, including "add account" forms — always server-assigned.
- **No manual journal entry UI, anywhere** — Journal Entries screens are strictly read-only/filterable.

---

## 6. Regression discipline

Every workspace must coexist as its own routed section. **Rebuilding or extending one workspace must never delete, break, or silently alter another already-approved workspace.** After finishing any ticket, do a quick pass confirming every previously-approved screen still renders and behaves as before — this is not optional, and it was skipped at least once in the prior build with real consequences.

---

## 7. Reporting format for every ticket

Every completed ticket must be reported back in this format, in full, not as a running tool-log:

```
## [Ticket ID] Completed
### Screens built
### RPC functions called per screen (confirmed vs. assumed — flag any uncertainty)
### Specific requirement confirmations (list each one from the ticket individually, with a yes/no and a code reference)
### Breakpoints tested (desktop / tablet / phone)
### Regression check (which previously-approved screens were reverified, and that they still work)
### Any real gap found in the API surface
### Any credentials/env vars needed but not available (never invented)
```

A tool-call trace ending in "Made changes." is not a completed ticket report.
