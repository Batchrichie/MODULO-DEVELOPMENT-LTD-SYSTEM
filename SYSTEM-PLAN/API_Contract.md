# CAREMS — API Contract (v1.0)
**Purpose:** This is the master interface between the Backend/API Expert and the Frontend Expert. It is owned and issued by the Instructor. Neither expert should invent endpoints outside this contract without the Instructor updating this document first.

---

## 0. Conventions

- **Base URL:** `/api/v1`
- **Auth:** Bearer token in `Authorization` header. Role is embedded in the token (CEO, Accountant, ProjectManager, Employee, Admin).
- **Response envelope (all endpoints):**
```json
{
  "success": true,
  "data": { },
  "error": null
}
```
On failure:
```json
{
  "success": false,
  "data": null,
  "error": { "code": "VALIDATION_ERROR", "message": "..." }
}
```
- **Pagination (all list endpoints):** `?page=1&limit=25` → response includes `"meta": { "page": 1, "limit": 25, "total": 132 }`
- **Dates:** ISO 8601 (`YYYY-MM-DD`)
- **Money:** always minor-unit-free decimal (e.g., `1234.50`), currency implied as GHS unless stated

---

## 1. Master Data Endpoints

| Resource | Endpoints |
|---|---|
| Chart of Accounts | `GET/POST /accounts`, `PATCH /accounts/:id`, `PATCH /accounts/:id/deactivate` |
| Customers | `GET/POST /customers`, `GET/PATCH /customers/:id` |
| Suppliers | `GET/POST /suppliers`, `GET/PATCH /suppliers/:id` |
| Employees | `GET/POST /employees`, `GET/PATCH /employees/:id` |
| Projects | `GET/POST /projects`, `GET/PATCH /projects/:id` |
| Equipment | `GET/POST /equipment`, `GET/PATCH /equipment/:id` |
| Fixed Assets | `GET/POST /assets`, `GET/PATCH /assets/:id`, `POST /assets/:id/dispose` |
| Bank/MoMo Accounts | `GET/POST /bank-accounts` |
| Tax Rate Settings | `GET/PATCH /settings/tax-rates` (VAT %, NHIL %, GETFund %, SSNIT employee %, SSNIT employer %) |

**Example — Create Project**
```
POST /projects
{
  "name": "Accra Office Complex",
  "client_id": "CUST-0012",
  "contract_value": 850000.00,
  "project_manager_id": "EMP-0034",
  "expected_completion": "2027-03-31",
  "budget": {
    "labour": 200000, "materials": 350000, "fuel": 30000,
    "transport": 20000, "subcontractors": 150000, "miscellaneous": 20000
  }
}
```

---

## 2. Transactional Endpoints (each triggers automatic GL posting per Section 7/9 of the SRS)

| Transaction | Endpoint | Auto-Posts To |
|---|---|---|
| Project Completion Assessment | `POST /projects/:id/completion-assessments` (submit), `PATCH .../:id/approve` (approve) | Contract Assets/WIP, Revenue |
| Customer Invoice | `POST /invoices` | AR, Contract Assets/WIP (drawdown) and/or Client Advances (excess billing), VAT/NHIL/GETFund Output |
| Customer Payment (against invoice) | `POST /payments/received` | Bank, AR |
| Customer Payment (advance, no invoice) | `POST /payments/received` (omit `invoice_id`) | Bank, Client Advances/Unearned Revenue |
| Supplier Invoice | `POST /expenses` | Expense/Asset, VAT Input, AP |
| Supplier Payment | `POST /payments/made` | AP, Bank |
| Rental Invoice | `POST /rentals/:id/invoice` | AR, Rental Revenue, Tax Output |
| Payroll Run | `POST /payroll/run` | Salary Expense, Employer SSNIT Expense, Payables (Salaries/PAYE/SSNIT/Deductions) |
| Salary Payment | `POST /payroll/:run_id/pay` | Salaries Payable, Bank |
| Asset Purchase | `POST /assets` (with `cost` field) | Fixed Asset, AP/Bank |
| Monthly Depreciation | `POST /assets/run-depreciation` (system job) | Depreciation Expense, Accumulated Depreciation |

**Revenue recognition — Percentage of Completion.** Revenue is NOT recognized when cash is received or even when an invoice is raised. It is recognized only via a Project Completion Assessment: `revenue_to_recognize = (contract_value × percent_complete) - revenue_recognized_to_date`, posted `Dr Contract Assets/WIP → Cr Revenue`. Cash received before this point sits in Client Advances (a liability). Invoicing a certified milestone draws down Contract Assets/WIP first, then any excess billed goes to Client Advances — it never posts straight to Revenue.

**Example — Submit & Approve a Completion Assessment**
```
POST /projects/PRJ-0007/completion-assessments
{ "period": "2026-12", "percent_complete": 15.0 }
→ status: "pending_approval"

PATCH /projects/PRJ-0007/completion-assessments/CA-0004/approve
→ triggers journal: Dr Contract Assets/WIP 75,000 / Cr Construction Contract Revenue 75,000
  (assuming contract_value 500,000 and this is the first assessment)
```

**Example — Post an Invoice**
```
POST /invoices
{
  "customer_id": "CUST-0012",
  "project_id": "PRJ-0007",
  "line_items": [
    { "description": "Milestone 2 - Foundation", "amount": 120000.00 }
  ],
  "apply_vat": true,
  "apply_nhil": true,
  "apply_getfund": true
}
```
**Response includes the auto-generated journal reference:**
```json
{
  "invoice_id": "INV-2026-0088",
  "journal_id": "JRN-2026-04211",
  "amount_due": 137400.00
}
```
Frontend never constructs journals manually — it only ever sees the `journal_id` returned for audit-trail display.

Note: this invoice's journal will **not** credit Revenue directly. It draws down `1150 Contract Assets/WIP` up to the amount already recognized via completion assessments, and credits `2140 Client Advances` for any amount billed ahead of recognized revenue.

---

## 3. Query / Reporting Endpoints (read-only, used by dashboards)

| Report | Endpoint |
|---|---|
| Trial Balance | `GET /reports/trial-balance?as_of=2026-07-31` |
| Income Statement | `GET /reports/income-statement?from=...&to=...` |
| Statement of Financial Position | `GET /reports/sofp?as_of=...` |
| Cash Flow Statement | `GET /reports/cash-flow?from=...&to=...` |
| Project Profitability | `GET /reports/projects/:id/profitability` |
| Budget vs Actual | `GET /reports/projects/:id/budget-vs-actual` |
| Customer/Supplier Ageing | `GET /reports/ageing?type=customer` |
| Tax Schedules | `GET /reports/tax?type=vat&period=2026-07` |
| Executive Dashboard bundle | `GET /dashboard/executive` (single call returning cash position, revenue, profit, active/completed projects, tax status, alerts) |
| Accountant Task Centre | `GET /dashboard/accountant-tasks` (deadlines, unposted transactions, pending reconciliations) |

---

## 4. Role → Endpoint Access Matrix

| Role | Access |
|---|---|
| CEO/MD | All `GET /reports/*`, `GET /dashboard/*` only |
| Accountant | Full access to Sections 1–3 (read/write) |
| Project Manager | `GET/PATCH /projects/:id`, `POST /projects/:id/site-reports`, read-only budget views |
| Employee | `GET /employees/:id/self`, `GET /payroll/:id/payslips`, `POST /leave-requests` |
| Admin | `/users`, `/roles`, `/audit-log` — no financial endpoints |

---

## 5. Error Codes (shared vocabulary — Backend emits, Frontend handles)

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Missing/invalid field |
| `INSUFFICIENT_BUDGET` | Expense would exceed project budget (warn, don't necessarily block) |
| `PERIOD_LOCKED` | Attempt to post into a closed accounting period |
| `DUPLICATE_INVOICE` | Same invoice number/reference already exists |
| `UNAUTHORIZED_ROLE` | Role doesn't have access to this endpoint |

---

## 6. Decisions — status

- [x] Chart of Accounts codes mapped to each "Auto-Posts To" row — see Chart of Accounts v1.0
- [x] `INSUFFICIENT_BUDGET` **warns, does not block** — transaction proceeds, surfaces on Accountant Task Centre
- [x] SSNIT employer/employee % is **system-configurable**, not hardcoded — managed via `GET/PATCH /settings/tax-rates` (covers VAT, NHIL, GETFund, SSNIT employee %, SSNIT employer %)
- [x] Revenue recognized via Percentage of Completion — see Project Completion Assessment endpoints above

All open policy decisions are closed. No blockers remain before Backend build starts.
