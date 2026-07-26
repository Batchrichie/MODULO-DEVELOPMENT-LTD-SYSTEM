# CAREMS — API Contract (v1.1 — IFRS Corrections)
**Purpose:** This is the master interface between the Backend/API Expert and the Frontend Expert. It is owned and issued by the Instructor. Neither expert should invent endpoints outside this contract without the Instructor updating this document first.

## Corrections applied in v1.1 (from v1.0)

1. Section 2's Rental Invoice row annotated with the IFRS 16 lessor accrual requirement (Master Plan v2.1, Decision #8) — relevant because this endpoint has no backing implementation yet (per `CAREMS_Frontend_Engineering_Standard.md`), so the requirement needs to be visible here before anyone builds it.
2. Section 3's reporting endpoints flagged pending the IAS 1 audit (Master Plan v2.1, Ticket API-9) — not yet resolved, so nothing here changes shape until that audit reports back.
3. Section 6 decisions updated to reflect the PAYE band resolution (Master Plan v2.1, Decision #6).

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

*(Note: the live database has since added multi-currency columns — `currency_code`, `exchange_rate`, `functional_amount` — on invoices, expenses, and payments, per `CAREMS_Live_Schema_Reconstructed.sql`. This contract still describes the original GHS-only shape and has not been reconciled to that drift. Out of scope for v1.1; flagged for a future version.)*

---

## 1. Master Data Endpoints

*(Unchanged from v1.0 — see original table. Note the live schema replaced `bank_accounts` with `payment_method_type` flags on `chart_of_accounts`; this contract has not been reconciled to that change and still describes the original `bank-accounts` endpoint shape. Out of scope for v1.1.)*

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
| **Rental Invoice** | `POST /rentals/:id/invoice` — **no backing implementation yet; known gap.** **IFRS 16 requirement (v1.1):** the company is lessor-only under short-term operating leases (Master Plan v2.1, Decision #8). When this endpoint is built, rental revenue **must accrue straight-line over the rental period**, not post in full at invoice date, even if invoicing itself happens on a milestone or periodic schedule. The rental asset stays capitalized under `1250` and continues depreciating per IAS 16 regardless of invoicing timing. | AR, Rental Revenue (accrued over term), Tax Output — sets `rental_contract_id` on the created invoice so it's traceable back to the contract, distinct from project milestone invoices |
| Payroll Run | `POST /payroll/run` | Salary Expense, Employer SSNIT Expense, Payables (Salaries/PAYE/SSNIT/Deductions) |
| Salary Payment | `POST /payroll/:run_id/pay` | Salaries Payable, Bank |
| Asset Purchase | `POST /assets` (with `cost` field) | Fixed Asset, AP/Bank |
| Monthly Depreciation | `POST /assets/run-depreciation` (system job) | Depreciation Expense, Accumulated Depreciation |

*(Revenue recognition and invoicing examples unchanged from v1.0 — Percentage of Completion via Project Completion Assessments; invoicing draws down Contract Assets/WIP before Client Advances; never posts straight to Revenue.)*

---

## 3. Query / Reporting Endpoints (read-only, used by dashboards)

**Pending IAS 1 audit (Master Plan v2.1, Ticket API-9).** The endpoints below are unchanged in shape for v1.1, but their *output classification* (current vs. non-current splits, income statement format) has not yet been confirmed compliant with IAS 1. Do not treat the current response shapes as final until that audit reports back.

| Report | Endpoint |
|---|---|
| Trial Balance | `GET /reports/trial-balance?as_of=2026-07-31` |
| Income Statement | `GET /reports/income-statement?from=...&to=...` — pending confirmation of function-of-expense format per `CAREMS_Financial_Statement_Presentation_Standard.md` |
| Statement of Financial Position | `GET /reports/sofp?as_of=...` — pending confirmation that `2300 Bank Loans` splits current/non-current portions |
| Cash Flow Statement | `GET /reports/cash-flow?from=...&to=...` — pending confirmation of indirect method |
| Project Profitability | `GET /reports/projects/:id/profitability` |
| Budget vs Actual | `GET /reports/projects/:id/budget-vs-actual` |
| Customer/Supplier Ageing | `GET /reports/ageing?type=customer` |
| Tax Schedules | `GET /reports/tax?type=vat&period=2026-07` |
| Executive Dashboard bundle | `GET /dashboard/executive` |
| Accountant Task Centre | `GET /dashboard/accountant-tasks` |

---

## 4. Role → Endpoint Access Matrix

*(Unchanged from v1.0.)*

---

## 5. Error Codes

*(Unchanged from v1.0.)*

---

## 6. Decisions — status

- [x] Chart of Accounts codes mapped to each "Auto-Posts To" row — see Chart of Accounts v1.0
- [x] `INSUFFICIENT_BUDGET` **warns, does not block** — transaction proceeds, surfaces on Accountant Task Centre
- [x] SSNIT employer/employee % is **system-configurable** — managed via `GET/PATCH /settings/tax-rates`
- [x] Revenue recognized via Percentage of Completion — see Project Completion Assessment endpoints above
- [x] **PAYE bands (v1.1) — resolved, not just deferred.** Act 1111's cumulative band-width interpretation adopted (GHS 50,416.67/month top-band threshold), per TaxLawGH's published methodology, resolving a disclosed drafting ambiguity in the Act itself. See Master Plan v2.1, Decision #6 for full detail. No endpoint shape change — this affects the seeded `paye_tax_bands` data, not this contract.
- [x] **IFRS 16 lessor accrual (v1.1)** — see Section 2 Rental Invoice row above and Master Plan v2.1, Decision #8.
- [ ] **IAS 1 reporting classification** — open, pending Ticket API-9 findings (Section 3 above).

All policy decisions relevant to v1.1 are closed except the IAS 1 audit, which is a review-in-progress ticket, not an open policy question.
