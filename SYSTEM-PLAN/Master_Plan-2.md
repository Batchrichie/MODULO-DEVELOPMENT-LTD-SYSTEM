# CAREMS — MASTER PLAN & INSTRUCTIONS (FINAL, v2.0)
**Owner:** Instructor. This is the complete, closed plan. Every task below is written as an instruction to hand to the relevant expert verbatim — the Instructor coordinates, reviews, and sequences; it does not write code. When you start building, this document should not need revisiting.

---

## 1. What we are building

A finance-driven Enterprise Management System (CAREMS) for a construction/architecture/equipment-rental company, covering: Finance & Accounting, Project Costing, Equipment Rental, Fixed Assets, HR/Payroll, CRM, Tax & Compliance, Document Management, Audit Trail, and role-based dashboards.

**Core principle carried through every task:** operational forms (invoices, payroll, rentals, expenses) auto-generate journal entries. No module operates as a silo — everything ends up in the General Ledger.

**Phase One only.** Inventory, procurement, maintenance scheduling, GPS tracking, mobile app, client portal, and BI/forecasting are explicitly Phase Two — do not let scope creep into Phase One tasks.

---

## 2. Reference documents (all complete)

| Doc | Used by |
|---|---|
| Corrected SRS / Concept Report | All roles — feature scope |
| Chart of Accounts (`Chart_of_Accounts.md`) | Database, Backend |
| ERD (`CAREMS_ERD.mermaid`) | Database |
| API Contract (`API_Contract.md`) | Backend, Frontend |
| Process Flows (`Flow_1/2/3_*.mermaid`) | Backend, Frontend, Integration testing |
| Wireframes (`CAREMS_Wireframes.html`) | Frontend |
| Reference schema (`CAREMS_Schema_v1.sql`) | **Reference only** — a worked example of what Ticket DB-1 should produce. Note: this file predates the `paye_tax_bands` table and the `journals.reversal_of_journal_id` fix below — it does not reflect the current DB-1/DB-2 ticket text. Build from the ticket text, not from this file. |

---

## 3. Roles & responsibilities

| Role | Owns | Does not do |
|---|---|---|
| **Instructor** | This plan, task sequencing, conflict resolution, reviewing reported work against acceptance criteria | Never writes code |
| **Database Expert** (Supabase AI) | Schema, tables, relationships, constraints, seed data | Business logic, calculations |
| **Backend/API Expert** (Claude) | Posting rules engine, tax calculations, budget logic, all endpoints in the API Contract | Database schema design, UI |
| **Frontend Expert** (Copilot) | Dashboards, forms, role-based views, consumes API only | Direct DB access, business rules |

---

## 4. Build sequence

```
Phase 1 — Database            (Tickets DB-1 → DB-4)
        ↓
Phase 2 — Backend              (Tickets API-1 → API-8, starts once schema is confirmed)
        ↓ (parallel)
Phase 3 — Frontend              (Tickets FE-1 → FE-6, starts immediately using the API Contract as spec)
        ↓
Phase 4 — Integration          (Tickets INT-1 → INT-4)
```

---

## 5. TASK TICKETS — full instructions, ready to hand out

### PHASE 1 — Database Expert (Supabase AI)

**DB-1 — Schema Build**
> Using `CAREMS_ERD.mermaid` and `Chart_of_Accounts.md` as the specification, create these tables in Supabase: `chart_of_accounts`, `customers`, `suppliers`, `employees`, `users`, `bank_accounts`, `equipment`, `fixed_assets`, `tax_rate_settings`, `paye_tax_bands`, `projects`, `journals`, `journal_lines`, `project_completion_assessments`, `invoices`, `invoice_lines`, `customer_payments`, `expenses`, `supplier_payments`, `rental_contracts`, `payroll_runs`, `payslips`, `audit_log`. Use UUID primary keys (`gen_random_uuid()`), foreign keys exactly as shown in the ERD, and a check constraint on `journal_lines` ensuring a line is either a debit or a credit, never both non-zero. `journal_lines.project_id` must be nullable (overhead transactions have no project). `journals.status` must support `'posted'` and `'reversed'` only (no `'draft'` — every journal in Phase One is auto-generated and posts immediately, per the no-manual-journal-entry principle). Corrections are never edits or deletes of a posted journal — they are a new journal that reverses it. Add `journals.reversal_of_journal_id` (uuid, nullable, self-referencing FK) to link a reversal back to the original, preserving the audit trail. Optional, your judgment: `chart_of_accounts` may include an `is_postable` flag (true for leaf accounts, false for pure rollup/reporting-group headers) if you find it useful for enforcing that transactions never post to a summary account — this isn't required by the ERD, just a reasonable addition if it simplifies validation.

**DB-2 — Seed Data**
> Also create a `paye_tax_bands` table (not part of `tax_rate_settings` — PAYE is graduated, not a flat rate): columns `band_id` (uuid pk), `lower_bound` (numeric, monthly chargeable income), `upper_bound` (numeric, nullable for the top open-ended band), `rate` (numeric), `effective_from` (date). Ghana PAYE currently uses 7 graduated monthly bands from 0% to 35%, applied cumulatively year-to-date. **Do not hardcode band thresholds from this document** — sources disagree on the exact current figures (a revision appears to have taken effect around April 2026) — pull the current official schedule from gra.gov.gh at build time and seed from that. Seed `chart_of_accounts` with every account in `Chart_of_Accounts.md` (114 accounts: code, name, type, reporting_group). Seed `tax_rate_settings` with: VAT 15%, NHIL 2.5%, GETFund 2.5%, SSNIT Employee 5.5%, SSNIT Employer 13%.

**DB-3 — Indexes**
> Add indexes on: `journal_lines(journal_id, account_id, project_id)`, `invoices(project_id, customer_id)`, `expenses(project_id, supplier_id)`, `payslips(run_id)`, `audit_log(table_name, record_id)`.

**DB-4 — Report Back**
> Report: list of tables created, row count in `chart_of_accounts` after seeding, and any errors encountered while running the above.

---

### PHASE 2 — Backend/API Expert (Claude)

**API-1 — Master Data Endpoints**
> Build CRUD endpoints for Chart of Accounts, Customers, Suppliers, Employees, Projects, Equipment, Fixed Assets, Bank Accounts, and Tax Rate Settings exactly per `API_Contract.md` Section 1. Apply the response envelope, pagination, and date/money conventions from Section 0 to every endpoint, not just these.

**API-2 — Revenue Recognition (Percentage of Completion)**
> Build the Project Completion Assessment flow (submit + approve). On approval: `incremental_revenue = (contract_value × percent_complete) − revenue_recognized_to_date`, post `Dr Contract Assets/WIP (1150) / Cr Revenue`. This must never touch Accounts Receivable or Cash — only Contract Assets and Revenue.

**API-3 — Sales Cycle Endpoints**
> Build Invoice and Customer Payment endpoints per `API_Contract.md` Section 2. Invoicing draws down Contract Assets/WIP first (up to revenue already recognized), then Client Advances for any billed excess, plus VAT/NHIL/GETFund output. Customer Payment must accept an optional `invoice_id`; if absent, post the amount as an advance to Client Advances (2140), never to Revenue.

**API-4 — Expense & Costing Endpoints**
> Build Expense and Supplier Payment endpoints. On expense entry, check the project's remaining budget; if exceeded, set `budget_flag = true` and return an `INSUFFICIENT_BUDGET` warning — the transaction still posts. Do not block it.

**API-5 — Payroll Endpoints**
> Build Payroll Run and Payslip endpoints. Calculate PAYE by looking up `paye_tax_bands` and applying each band's rate cumulatively to the portion of chargeable monthly income that falls within it (standard graduated-tax calculation — do not apply the top band's rate to the whole salary). Calculate SSNIT employee % and employer % and Other Deductions using `tax_rate_settings` (never hardcoded). Post: `Dr Salary Expense, Dr Employer SSNIT Expense / Cr Staff Salaries Payable, Cr PAYE Payable, Cr SSNIT Payable, Cr Other Payroll Deductions Payable`.

**API-6 — Reporting Endpoints**
> Build every read-only endpoint in `API_Contract.md` Section 3: Trial Balance, Income Statement, Statement of Financial Position, Cash Flow, Project Profitability, Budget vs Actual, Customer/Supplier Ageing, Tax Schedules, Executive Dashboard bundle, Accountant Task Centre.

**API-7 — Access Control**
> Enforce the Role → Endpoint Access Matrix (`API_Contract.md` Section 4) on every endpoint. Violations return `UNAUTHORIZED_ROLE`.

**API-8 — Report Back**
> Report: endpoints built, any deviation from the API Contract and why, and one sample request/response per transactional endpoint (Invoice, Expense, Payroll Run, Completion Assessment).

---

### PHASE 3 — Frontend Expert (Copilot)

**FE-1 — Executive Dashboard**
> Build the CEO/MD screen per the "CEO / MD" tab in `CAREMS_Wireframes.html`, calling `/dashboard/executive`. View-only — no write actions anywhere on this screen.

**FE-2 — Accountant Workspace**
> Build per the "Accountant" tab: Chart of Accounts, Journal Entries (read-only — system-generated only), Invoicing, Expenses, Payroll, Rentals, Tax, Fixed Assets, Reporting. Wire every write action to its endpoint in `API_Contract.md` Section 2.

**FE-3 — Project Manager Workspace**
> Build per the "Project Manager" tab: My Projects, Completion Assessment submission, Site Reports, Budget vs Actual (read-only).

**FE-4 — Employee Self-Service**
> Build per the "Employee" tab: Profile, Payslips, Leave, Assigned Projects, Announcements.

**FE-5 — Admin Panel**
> Build per the "System Administrator" tab: User Management, Roles & Permissions, Audit Log, Security Monitoring.

**FE-6 — Report Back**
> Report: screens completed, which endpoints each screen calls, and any gaps found in the API Contract while building.

---

### PHASE 4 — Integration (Instructor coordinates all three experts)

**INT-1 — Sales Cycle Test**
> Run `Flow_1_Sales_Cycle.mermaid` end-to-end: create a project → receive an advance → submit and approve a completion assessment → raise an invoice → receive payment. Confirm the Trial Balance stays balanced at every step, and confirm revenue only appears after the completion assessment is approved — never at the advance or invoice step.

**INT-2 — Payroll Test**
> Run `Flow_2_Payroll.mermaid` end-to-end: run payroll for one period → approve → post → pay. Confirm employer SSNIT appears as an expense (not only a payable) and PAYE/SSNIT payables feed the Tax Reports.

**INT-3 — Expense/Costing Test**
> Run `Flow_3_Expense_Costing.mermaid` end-to-end: record a supplier expense that exceeds a project's budget. Confirm the warning fires, the transaction still posts, and it surfaces on the Accountant Task Centre.

**INT-4 — Sign-off**
> Once all three tests pass, Phase One is complete per Section 7 below.

---

## 6. Decisions — all closed

1. ✅ Chart of Accounts codes mapped to every "Auto-Posts To" line — see `Chart_of_Accounts.md`
2. ✅ `INSUFFICIENT_BUDGET` warns, does not block — surfaces on the Accountant Task Centre
3. ✅ SSNIT employer/employee % is configurable from day one via `tax_rate_settings` / `GET/PATCH /settings/tax-rates`
4. ✅ Revenue recognized via Percentage of Completion — Project Completion Assessments are a distinct step, separate from invoicing and cash receipt

No open policy questions remain.

---

## 7. Definition of Done — Phase One

The system is complete when all three end-to-end workflows (INT-1, INT-2, INT-3) run without any manual journal entry:
1. Quotation → Project → Advance → Completion Assessment → Invoice → Payment → Financial Statements
2. Payroll Run → Posting → Salary Payment
3. Supplier Expense → Project Costing → General Ledger

...and the Executive Dashboard reflects all three correctly, in real time, with no discrepancies against the Trial Balance.

---

## 8. Instructor's operating rule

The Instructor issues each ticket above verbatim to the relevant expert, one phase at a time. It reviews what comes back against that ticket's instruction — not against its own guess at the code — and only advances to the next ticket once the current one is confirmed working. If an expert's output conflicts with this plan, the Instructor updates this document before proceeding, so it never drifts out of sync with what was actually built.
