# CAREMS — MASTER PLAN & INSTRUCTIONS (v2.1 — IFRS Corrections)
**Owner:** Instructor. This is the complete, closed plan. Every task below is written as an instruction to hand to the relevant expert verbatim — the Instructor coordinates, reviews, and sequences; it does not write code.

## Corrections applied in v2.1 (from v2.0)

This version closes two decisions that were technically resolved in the live database but never written back into this plan, and opens the first tranche of new IFRS compliance work (IAS 1 presentation, with IAS 2, IAS 37, IFRS 9, and IAS 12 scoped for v2.2 pending two open questions — see Section 9).

1. **Decision #6 (PAYE band sourcing) — resolved, not just documented.** The live `paye_tax_bands` table was seeded with values that are correct under a documented interpretation of Act 1111, but this plan still described the decision as an open fallback ("Instructor sources figures directly"). Corrected below with the actual resolution and its legal basis.
2. **New Decision #8 (IFRS 16, lessor accounting) added.** Never previously addressed. The company is lessor-only (equipment rented out, nothing leased in) with short-term operating-lease-type rental contracts. This has a direct consequence for the still-unbuilt rental invoicing endpoint (flagged as a known gap in `CAREMS_Frontend_Engineering_Standard.md`) — revenue must accrue over the rental period, not spike at invoice date.
3. **New Ticket API-9 added** — an audit of the existing reporting endpoints against IAS 1 classification rules. No schema change; a review ticket to run before any further reporting work is trusted.
4. **New reference document added** — `CAREMS_Financial_Statement_Presentation_Standard.md`, detailing the actual GHS-denominated statement formats (SOFP, P&L, Changes in Equity, Cash Flows) this business should produce under IAS 1, mapped to the live Chart of Accounts.

No changes were required to `Chart_of_Accounts.md` in this version — Fixes 1–3 are documentation and audit only. Chart of Accounts changes begin in v2.2 (IAS 2, IAS 37, IFRS 9, IAS 12), pending sign-off on defects-liability period and GRA's construction tax-timing basis.

---

## 1. What we are building

A finance-driven Enterprise Management System (CAREMS) for a construction/architecture/equipment-rental company, covering: Finance & Accounting, Project Costing, Equipment Rental, Fixed Assets, HR/Payroll, CRM, Tax & Compliance, Document Management, Audit Trail, and role-based dashboards.

**Core principle carried through every task:** operational forms (invoices, payroll, rentals, expenses) auto-generate journal entries. No module operates as a silo — everything ends up in the General Ledger.

**Phase One only.** Inventory, procurement, maintenance scheduling, GPS tracking, mobile app, client portal, and BI/forecasting are explicitly Phase Two — do not let scope creep into Phase One tasks. (Note: v2.2's IAS 2 materials-inventory work is a *financial reporting* requirement, not the Phase Two "Inventory & Stores Management" operational module — the two are not the same scope and should not be conflated when they're eventually both in flight.)

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
| **Financial Statement Presentation Standard (`CAREMS_Financial_Statement_Presentation_Standard.md`)** | **Backend (reporting endpoints), Instructor (IAS 1 sign-off)** — new in v2.1 |
| Reference schema (`CAREMS_Schema_v1.sql`) | **Reference only, and now stale** — see `CAREMS_Live_Schema_Reconstructed.sql` for what is actually live. Build from ticket text and the live schema, not from this file. |

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
Phase 1 — Database            (Tickets DB-1 → DB-4, complete and live)
        ↓
Phase 2 — Backend              (Tickets API-1 → API-8, complete and live; API-9 new in v2.1)
        ↓ (parallel)
Phase 3 — Frontend              (Tickets FE-1 → FE-6)
        ↓
Phase 4 — Integration          (Tickets INT-1 → INT-4)
```

---

## 5. TASK TICKETS

*(Tickets DB-1–DB-4, API-1–API-8, and FE-1–FE-6 are unchanged from v2.0 and are complete/live — see `CAREMS_Live_Schema_Reconstructed.sql`. Only the new v2.1 ticket is shown below. Full original ticket text remains in the v2.0 history.)*

### PHASE 2 — Backend/API Expert (Claude) — v2.1 addition

**API-9 — IAS 1 Reporting Compliance Audit**
> Review `report_sofp`, `report_income_statement`, and `report_cash_flow` against IAS 1's classification and presentation requirements. Specifically confirm: (a) `2300 Bank Loans` is split into its current portion (due within 12 months) and non-current remainder rather than shown as a single liability line; (b) `1150 Contract Assets/WIP` and `1140 Retention Receivable` are classified as current assets; (c) the income statement follows a consistent format (see `CAREMS_Financial_Statement_Presentation_Standard.md` for the function-of-expense format this business should use); (d) the cash flow statement reconciles from profit before tax using the indirect method, given how much WIP movement swings period to period. This is a **review ticket — do not restructure the schema or endpoints yet.** Report findings back to the Instructor as a gap list; schema changes (if any) get their own follow-up ticket.

---

## 6. Decisions — status

1. ✅ Chart of Accounts codes mapped to every "Auto-Posts To" line — see `Chart_of_Accounts.md`
2. ✅ `INSUFFICIENT_BUDGET` warns, does not block — surfaces on the Accountant Task Centre
3. ✅ SSNIT employer/employee % is configurable from day one via `tax_rate_settings` / `GET/PATCH /settings/tax-rates`
4. ✅ Revenue recognized via Percentage of Completion — Project Completion Assessments are a distinct step, separate from invoicing and cash receipt
5. ✅ PAYE method — flat-monthly bands, no YTD carry-forward, for Phase One
6. ✅ **PAYE band figures — resolved (v2.1, was previously an open fallback).** Act 1111 (Income Tax Act, 2015, as amended) contains a drafting inconsistency: its seven band widths cumulate to GHS 605,000/year (GHS 50,416.67/month) before the top 35% bracket, but the Act's separately printed final threshold and GRA's summary table state "exceeding GHS 600,000" (GHS 50,000/month). CAREMS adopts the **cumulative band-width interpretation**, consistent with TaxLawGH's published methodology (Ghana Tax Rates guide, PAYE drafting alert, reviewed 21 July 2026), because it avoids an overlap between the 30% and 35% bands that the GHS 600,000 reading would create. The live `paye_tax_bands` table is confirmed correct under this interpretation; `effective_from = 2024-01-01` reflects Act 1111's legal effective date, not the seed date. **This remains a disclosed legislative ambiguity, not a settled point of law** — if GRA issues a formal clarification, the table must be updated and the change logged here.
7. ✅ Rental invoices carry `rental_contract_id` so they're traceable and distinguishable from project milestone invoices once posted
8. ✅ **IFRS 16 lessor treatment — new in v2.1.** The company is lessor-only: it rents equipment out to clients and leases nothing in (no leased-in site offices, vehicles, or equipment). All rental contracts are short-term, operating-lease-type arrangements — no contract transfers ownership or approaches the asset's useful life. Under IFRS 16 lessor accounting for operating leases: rental equipment stays capitalized on the company's own books under `1250 Rental Equipment`, continues to depreciate per IAS 16 as normal, and rental income (`4300`/`4310`) must be recognized on a straight-line basis over the rental term rather than fully at invoice date. **Consequence for future work:** the still-unbuilt rental invoicing endpoint (`POST /rentals/:id/invoice` — flagged with no backing RPC function in `CAREMS_Frontend_Engineering_Standard.md`) must implement period-accrual revenue recognition when it is eventually built, not a simple invoice-equals-revenue posting.
9. ✅ IAS 1 presentation audit scoped as API-9 (v2.1) — see Section 5 above. Findings to be logged as a new decision once complete.

10. ✅ **Company Profile editing and aggregate Executive Dashboard charts — formally deferred to Phase Two.** Company Profile (name/address/phone editing) and the two aggregate chart panels on the Executive Dashboard (Project Profitability trend across all projects, Equipment Rental Revenue trend) have no backend endpoint as of this session, and none is scheduled before Phase One sign-off. This was already flagged as a known gap in `CAREMS_Frontend_Engineering_Standard.md` ("no backing function exists"), but had not been recorded here as an intentional scope decision rather than an oversight. **Recorded now as closed:** Frontend continues to render both as clearly labeled "pending backend" / "mock data — pending backend" states, per the existing Frontend Engineering Standard convention (Section 5). This is not a defect in FE-1 (Executive Dashboard) — it is out of Phase One scope by decision, and Phase One Definition of Done (Section 7) does not require either item to be functional for sign-off.
11. ✅ **Multi-currency invoicing and customer payment settlement — confirmed as in-scope.** Client-confirmed: the company transacts primarily in GHS, but **occasionally raises invoices in foreign currency**, and **holds a real USD bank account** the company uses to settle those invoices — client further confirmed **customer payments sometimes settle in USD**, not only invoicing. This is narrower than the live schema's drift suggested — `currency_code`/`exchange_rate`/`functional_amount` exist on invoices, expenses, *and* payments, but client confirmation covers **invoicing and customer payments only**. Whether expenses or supplier payments genuinely need foreign-currency capture (e.g. foreign-currency supplier invoices, paying suppliers in USD) is **not yet confirmed** — do not treat those two tables' currency columns as scoped by this decision. Reporting endpoints use `functional_amount` (GHS) for all statement output regardless. IAS 21 revaluation/translation differences are deferred to Phase Two; for Phase One, exchange rates are static at transaction date and no revaluation journal entries are posted. See `API_Contract.md` Section 0 and `CAREMS_ERD.mermaid` for the entity/endpoint-level contract.
12. ⏳ **Professional services revenue recognition method — pending Instructor/client input.**
    Accounts `4100`–`4140` (architectural fees, permit processing, professional services) currently have no documented recognition pattern in the SRS or Master Plan. Under IFRS 15, the method depends on the nature of each engagement:
    - **Over time (POC):** fixed-price design contracts where the client receives benefit as work progresses
    - **Point-in-time:** per-permit fees, ad-hoc consultations, or deliverables with no ongoing obligation
    The auto-posting engine in `POST /invoices` and `POST /projects/:id/completion-assessments` cannot assign the correct GL posting rule until this is confirmed. **Action:** Instructor to confirm with client whether professional-fee engagements are typically fixed-price/multi-month (POC) or billed per deliverable (point-in-time), or a mix. Once confirmed, update the API Contract Section 2 auto-posting matrix and the Financial Statement Presentation Standard Section 5 revenue disaggregation table.

No open policy questions remain for v2.1 beyond Decision #12 above. **Open questions blocking v2.2** (IAS 2, IAS 37, IFRS 9, IAS 12 — provisions, inventory, ECL, deferred tax): (a) the standard defects-liability period used in the company's construction contracts, and (b) whether GRA currently accepts percentage-of-completion for tax-timing purposes or requires a different basis. See `CAREMS_Financial_Statement_Presentation_Standard.md` Section 6 for how these will affect disclosure once resolved.

---

## 7. Definition of Done — Phase One

Unchanged from v2.0: the system is complete when INT-1, INT-2, and INT-3 run end-to-end without any manual journal entry, and the Executive Dashboard reflects all three correctly against the Trial Balance in real time.

**Explicit exclusion (v2.1, Decision #10):** Company Profile editing and the two aggregate Executive Dashboard chart panels (Project Profitability trend, Rental Revenue trend) are not required to be functional for Phase One sign-off. Their "pending backend" / "mock data" placeholder states satisfy Definition of Done as-is.

---

## 8. Instructor's operating rule

The Instructor issues each ticket verbatim to the relevant expert, one phase at a time, reviews output against that ticket's instruction, and only advances once confirmed working. If an expert's output conflicts with this plan, the Instructor updates this document before proceeding — this rule was not consistently followed prior to v2.1 (see the live-schema drift noted in `CAREMS_Live_Schema_Reconstructed.sql`, e.g. multi-currency columns, `revenue_account_id`, the `bank_accounts` → `payment_method_type` redesign — none of which were written back into v2.0). That reconciliation is deferred by explicit decision, not overlooked; v2.1 prioritized IFRS correctness over drift cleanup, and drift reconciliation remains an open item for a future version.

**Scope-gate rule for live schema drift (added v2.1).** Any database change that adds capability not mentioned in the SRS, Master Plan, or API Contract — including new columns, tables, or relationships — is treated as *unscoped* until the Instructor confirms business need. It is not treated as documentation debt to be reconciled retroactively. If confirmed, the Instructor updates this plan and the API Contract before the change is accepted as part of the build. If not confirmed, the drift is reverted or quarantined (e.g., prefixed `draft_`) until a future version scopes it. This rule prevents unprompted complexity from being baked into the contract by default. **First application:** Decision #11 (multi-currency) — the client confirmed foreign-currency *invoicing* and *customer payment settlement* specifically (a real USD bank account exists); the corresponding drift on `expenses` and `supplier_payments` remains unscoped pending separate confirmation, per Decision #11's own text.

---

## 9. Open questions for v2.2 sign-off

1. **Defects/warranty liability period** — the typical retention/defects-liability period specified in this company's construction contracts (commonly 6–12 months post-completion in Ghanaian practice, but must be confirmed against actual contract terms, not assumed). Determines whether the IAS 37 provision account is classified current or non-current.
2. **GRA construction tax-timing basis** — whether the company currently files corporate tax on a completed-contract, cash, or POC basis. Directly determines the temporary-difference calculation required for IAS 12 deferred tax, and cannot be designed around a guess.
