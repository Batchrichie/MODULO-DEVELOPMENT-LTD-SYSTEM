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
9. ✅ IAS 1 presentation audit scoped as API-9 (v2.1) — see Section 5 above. **Findings (audited 2026-07-31 directly against live `report_sofp`, `report_income_statement`, `report_cash_flow` in Supabase):**
    - **(a) FAIL — `2300 Bank Loans` current/non-current split.** `report_sofp` has no current/non-current classification anywhere in its liabilities section (all `type='Liability'` accounts returned as one flat list). Not fixable in SQL alone — `chart_of_accounts` has no sub-account or maturity field to split `2300`/`2310`/`2320` (`Borrowings` group). **New open item:** needs the company's actual loan agreement repayment terms from the client before a schema change can even be scoped — logged as Decision #13 below.
    - **(b) PASS** — `1150` and `1140` both carry `reporting_group = 'Current Assets'` and are correctly included by `report_sofp`'s current-assets filter.
    - **(c) PASS** — `report_income_statement` implements function-of-expense format (tagged `IAS1_function_of_expense_v2`), with complete, non-overlapping coverage of all 51 Expense accounts across the four functional groups. **Presentation note resolved 2026-07-31:** account `6441` Loss on Disposal was inside "Admin & Operating," diluting that line with a non-operating item — this contradicted the Presentation Standard's own Section 2 table, which had already scoped Administrative Expenses as `6000`–`6440` (implicitly excluding `6441`). Fixed by migration `income_statement_separate_disposal_loss`: `6441` is now broken out into its own `other_expenses`/`other_expenses_lines` line, symmetric with how `4410` Gain on Disposal already sits in `other_income`. No figures changed — `operating_profit` and everything downstream are numerically identical, this is presentation-only.
    - **(d) PASS** — `report_cash_flow` correctly reconciles from profit before tax (mathematically identical to the income statement's own figure) using the indirect method, includes WIP movement, and self-validates its own cash reconciliation. Disclosed limitation (in the function's own code comment, not a defect): disposal proceeds are approximated as the accounting gain only, since no disposal sub-ledger exists; a `warnings` array surfaces this automatically when relevant.
    - **Conclusion: reporting endpoint output shapes may now be treated as final for (b)/(c)/(d). (a) remains open — see Decision #13.**

10. ✅ **Company Profile editing and aggregate Executive Dashboard charts — formally deferred to Phase Two.** Company Profile (name/address/phone editing) and the two aggregate chart panels on the Executive Dashboard (Project Profitability trend across all projects, Equipment Rental Revenue trend) have no backend endpoint as of this session, and none is scheduled before Phase One sign-off. This was already flagged as a known gap in `CAREMS_Frontend_Engineering_Standard.md` ("no backing function exists"), but had not been recorded here as an intentional scope decision rather than an oversight. **Recorded now as closed:** Frontend continues to render both as clearly labeled "pending backend" / "mock data — pending backend" states, per the existing Frontend Engineering Standard convention (Section 5). This is not a defect in FE-1 (Executive Dashboard) — it is out of Phase One scope by decision, and Phase One Definition of Done (Section 7) does not require either item to be functional for sign-off.
11. ✅ **Multi-currency invoicing and customer payment settlement — confirmed as in-scope.** Client-confirmed: the company transacts primarily in GHS, but **occasionally raises invoices in foreign currency**, and **holds a real USD bank account** the company uses to settle those invoices — client further confirmed **customer payments sometimes settle in USD**, not only invoicing. This is narrower than the live schema's drift suggested — `currency_code`/`exchange_rate`/`functional_amount` exist on invoices, expenses, *and* payments, but client confirmation covers **invoicing and customer payments only**. Reporting endpoints use `functional_amount` (GHS) for all statement output regardless. IAS 21 revaluation/translation differences are deferred to Phase Two; for Phase One, exchange rates are static at transaction date and no revaluation journal entries are posted. See `API_Contract.md` Section 0 and `CAREMS_ERD.mermaid` for the entity/endpoint-level contract.
    **Supplier-side drift resolved 2026-07-31 — confirmed OUT of scope.** Client confirmed all supplier payments are made in GHS only. Investigation found `expense_create` and `payment_made_create` already had a **fully working** multi-currency implementation (FX conversion on expenses, realized gain/loss posting on settlement via accounts `4430`/`7030`) — not incidental drift, genuinely engineered, but with zero live usage (0 supplier payments, 2 GHS-only expenses at the time of check). Per the Section 8 scope-gate rule, quarantined at the API level rather than via column rename: `expense_create` no longer accepts `currency_code`/`exchange_rate`/`rate_source` from the caller (always forces GHS/1.0), and `payment_made_create` no longer honors a `settlement_exchange_rate` override (always carries forward the expense's now-always-1.0 rate). Columns (`expenses.currency_code`/`exchange_rate`, `supplier_payments.settlement_exchange_rate`/`rate_source`) were left in place rather than renamed, since `functional_amount` is genuinely read elsewhere (`dashboard_accountant_tasks`, `dashboard_executive`) independent of currency, and renaming risked breaking those for no benefit. If supplier FX is ever needed later, the working logic is still there in git history to reinstate.
12. ⏳ **Professional services revenue recognition method — pending Instructor/client input.**
    Accounts `4100`–`4140` (architectural fees, permit processing, professional services) currently have no documented recognition pattern in the SRS or Master Plan. Under IFRS 15, the method depends on the nature of each engagement:
    - **Over time (POC):** fixed-price design contracts where the client receives benefit as work progresses
    - **Point-in-time:** per-permit fees, ad-hoc consultations, or deliverables with no ongoing obligation

    **Checked live code (2026-08-01) — this is a bigger architectural question than originally scoped, not just a posting-rule flag.** Revenue is recognized in exactly one place in the whole system: `completion_assessment_approve`, which credits `percent_complete × contract_value` incrementally to a single `revenue_account_id` set on the project. `invoice_create` never credits revenue at all — it only draws down against already-recognized WIP (or defers billing-ahead-of-recognition to client advances). **There is currently no point-in-time recognition path anywhere in the system, for any account.** A genuinely instant, single-deliverable fee (e.g. a permit-processing charge, done and billed the same day) would today have to go through the same completion-assessment mechanism as a multi-month construction contract — filing an assessment claiming 100% complete before it could even be invoiced. That's a workable manual workaround, not a real point-in-time flow.

    Also structural: `projects.revenue_account_id` is one account per project — a project cannot split recognized revenue across multiple GL accounts. If a professional-services engagement genuinely spans multiple fee types (e.g. part design fee `4100`, part permit fee `4120`), the current architecture doesn't support that within a single project record.

    **Checked live data: zero activity.** Only one (test) project exists, mapped to `4200` Construction Contract Revenue, zero approved assessments. Nothing is currently being mis-recognized — this doesn't block anything today, but needs resolving before the first real professional-services engagement is invoiced.

    **Action — three questions for the client, not just "POC or point-in-time":**
    1. For each of `4100`–`4140`: is it typically a fixed-price, multi-month engagement (genuine POC candidate), or a single deliverable/one-off fee with no ongoing obligation (point-in-time candidate)? A mix across the five accounts is expected and fine.
    2. For anything that comes back point-in-time: is filing a same-day "100% complete" assessment an acceptable operational workaround, or does the client need a real, simpler direct invoice-to-revenue path built (bypassing WIP/completion-assessment entirely for these cases)? This determines whether this is a documentation-only decision or a genuine new-build ticket.
    3. Does the company ever bill a single professional-services engagement across more than one of these five accounts (e.g. a design fee that also includes permit processing)? If yes, the one-project-one-revenue-account constraint needs addressing as part of the same piece of work, not discovered later.

    The auto-posting engine in `POST /invoices` and `POST /projects/:id/completion-assessments` cannot assign the correct GL posting rule until this is confirmed. Once answered, update the API Contract Section 2 auto-posting matrix and the Financial Statement Presentation Standard Section 5 revenue disaggregation table — and if question 2 comes back needing a real build, that becomes its own ticket (recommend API-15), not a documentation update.
13. ⏳ **`2300 Bank Loans` current/non-current split — pending Instructor/client input.** Raised by the API-9 audit (Section 5 above): `report_sofp` currently presents all liabilities as one flat, unclassified list, and `chart_of_accounts` has no sub-account or maturity field capable of splitting `2300`/`2310`/`2320` (`Borrowings`) into a current portion (due within 12 months) versus non-current. This cannot be resolved by a schema or query change alone — it requires the actual repayment schedule from the company's loan agreement(s).
    **Checked live data (2026-07-31): zero posted journal activity exists on `2300`, `2310`, or `2320`.** No loan has ever actually been drawn down in the system, and there is no dedicated loans/schedule table anywhere in the schema. This lowers urgency — the split isn't currently distorting any real report output — but the decision still needs resolving before the first loan is posted.
    **Action:** Instructor to put three questions to the client, per loan account (if/when drawn down): (1) repayment schedule / maturity date(s); (2) amount due within 12 months of a given reporting date, if any; (3) for `2310` Director's Loan specifically — is it repayable on demand? (if so, per the Presentation Standard it is automatically current in full regardless of any stated term).
    **Ready-to-fire once answered — two build options, do not implement blind:**
    - **(a) Simplest (recommended for Phase One, given no loan activity yet):** add a `due_within_12_months` numeric field to a lightweight loan-terms record; `report_sofp` splits `2300`'s balance using that figure at query time.
    - **(b) More robust (defer unless client indicates multiple/complex loans):** a proper `loans` sub-ledger table (principal, rate, schedule, per-loan currency) — bigger lift, but also sets up the interest/amortization tracking Finance Costs (`7000`–`7030`) will eventually need.

No open policy questions remain for v2.1 beyond Decision #12 above. **Open questions blocking v2.2** (IAS 2, IAS 37, IFRS 9, IAS 12 — provisions, inventory, ECL, deferred tax): (a) the standard defects-liability period used in the company's construction contracts, and (b) whether GRA currently accepts percentage-of-completion for tax-timing purposes or requires a different basis. See `CAREMS_Financial_Statement_Presentation_Standard.md` Section 6 for how these will affect disclosure once resolved.

---

## 7. Definition of Done — Phase One

Unchanged from v2.0: the system is complete when INT-1, INT-2, and INT-3 run end-to-end without any manual journal entry, and the Executive Dashboard reflects all three correctly against the Trial Balance in real time.

**Explicit exclusion (v2.1, Decision #10):** Company Profile editing and the two aggregate Executive Dashboard chart panels (Project Profitability trend, Rental Revenue trend) are not required to be functional for Phase One sign-off. Their "pending backend" / "mock data" placeholder states satisfy Definition of Done as-is.

---

## 8. Instructor's operating rule

The Instructor issues each ticket verbatim to the relevant expert, one phase at a time, reviews output against that ticket's instruction, and only advances once confirmed working. If an expert's output conflicts with this plan, the Instructor updates this document before proceeding — this rule was not consistently followed prior to v2.1 (see the live-schema drift noted in `CAREMS_Live_Schema_Reconstructed.sql`, e.g. multi-currency columns, `revenue_account_id`, the `bank_accounts` → `payment_method_type` redesign — none of which were written back into v2.0). That reconciliation is deferred by explicit decision, not overlooked; v2.1 prioritized IFRS correctness over drift cleanup, and drift reconciliation remains an open item for a future version.

**Scope-gate rule for live schema drift (added v2.1).** Any database change that adds capability not mentioned in the SRS, Master Plan, or API Contract — including new columns, tables, or relationships — is treated as *unscoped* until the Instructor confirms business need. It is not treated as documentation debt to be reconciled retroactively. If confirmed, the Instructor updates this plan and the API Contract before the change is accepted as part of the build. If not confirmed, the drift is reverted or quarantined (e.g., prefixed `draft_`) until a future version scopes it. This rule prevents unprompted complexity from being baked into the contract by default. **First application:** Decision #11 (multi-currency) — the client confirmed foreign-currency *invoicing* and *customer payment settlement* specifically (a real USD bank account exists). The corresponding drift on `expenses` and `supplier_payments` was resolved 2026-07-31: client confirmed suppliers are GHS-only, so that capability was quarantined at the API level rather than left unscoped — see Decision #11.

---

## 9. Open questions for v2.2 sign-off

1. **Defects/warranty liability period** — the typical retention/defects-liability period specified in this company's construction contracts (commonly 6–12 months post-completion in Ghanaian practice, but must be confirmed against actual contract terms, not assumed). Determines whether the IAS 37 provision account is classified current or non-current.
2. **GRA construction tax-timing basis** — whether the company currently files corporate tax on a completed-contract, cash, or POC basis. Directly determines the temporary-difference calculation required for IAS 12 deferred tax, and cannot be designed around a guess.

---

## 10. Open Gap Register (added 2026-08-01)

Compiled from a working session's audit, then **independently re-verified live against `erinyjxrfectuepshstg`** before being folded in here — every checkable technical claim (function counts, grants, RLS policy counts, function bodies, column nullability) was confirmed directly against the database, not taken on trust. Two corrections were made to the original findings in that process; both are noted inline below. Tickets are numbered to continue the existing DB-/API-/FE- sequences from Section 5 (next available: DB-5, API-10, FE-7) — this also resolves a ticket-ID collision the session flagged: **API-9 stays the IAS 1 Reporting Compliance Audit**, per this document, which is canonical. Any other document using "API-9" for Site Reports should be reconciled to this numbering or deprecated.

**Note on sourcing:** the session's findings referenced an "Instructor Handoff" document and a "Roadmap" (§3, §4, §7) that do not exist anywhere in this repository. Everything below was re-verified independently of those citations; nothing here depends on a document this Master Plan can't locate.

### 10.1 Security — grant-level hardening (DB-5) — ✅ done 2026-08-01
**Verified live:** 52 functions in `api` schema. Original finding said 36 had `proacl = NULL` (default PUBLIC execute) and the other 16 were correctly gated — **that was wrong, caught by the Backend/API developer during DB-5 and independently re-verified.** Of the 16 with a non-null `proacl`, only 9 (the internal helpers) were actually clean. The other 7 had `authenticated` granted without ever revoking the implicit PUBLIC grant first. **Real count: 43 of 52 endpoint functions had PUBLIC execute, not 36.**

Also found live: `anon`/`authenticated` held full `INSERT/UPDATE/DELETE/TRUNCATE` grants on all 26 public tables (25, not the originally-counted 25 — `site_reports` was added after the original count). RLS enabled on all 26 with zero policies except `users`, so not exploitable, but fragile.

**Fix applied, independently re-verified against live `proacl`, table grants, and the Supabase security advisors directly (not just the report):**
- All 52 functions: PUBLIC revoked, `authenticated` granted to all 43 endpoint functions, `anon` additionally granted only to `coa_reference_data`, nothing granted to the 9 internal helpers. Zero bare-PUBLIC ACL entries remain anywhere — confirmed by direct query, not summary.
- All 26 tables: zero grants remain for `anon`/`authenticated`/`PUBLIC`. Default privileges also revoked, so this can't silently reappear on new tables.
- `assign_next_code`: `require_role(['Accountant','Admin','CEO'])` added — confirmed live, rejects unauthenticated callers, passes through correctly for a real Accountant.
- Regression-checked: `get_records`, `assign_next_code`, and the API-11 functions all still work post-revoke (SECURITY DEFINER functions run as owner, never depended on caller grants).
- Advisors after: 25 pre-existing RLS-no-policy (INFO, unrelated), 1 pre-existing leaked-password-protection (WARN, unrelated), 1 intentional anon-executable (`coa_reference_data`), 43 expected authenticated-executable (one per endpoint function, by design — every RPC is meant to be called by any authenticated user then authorized internally). Zero new findings.

### 10.2 `api.require_role()` fails open by design, not in current practice
**Verified:** returns `api.err(...)`, never `RAISE EXCEPTION`. Every current endpoint function correctly checks the guard result — no live bypass exists — but a future function that omits the check line would silently grant access rather than error. Switching to `RAISE EXCEPTION` has frontend error-handling implications; deferred as its own future ticket, not scoped yet.

### 10.3 Site Reports — backend complete and live, frontend disconnected
**Corrected from the original finding:** the frontend pages are not missing — `SiteReportsPage.tsx` (Project Manager) and `SiteReportsReviewPage.tsx` (both under `projectManager/` **and** `accountant/` — a duplicate worth resolving) already exist as real files, not stubs. But verified: **none of the three reference the actual RPCs** (`site_report_submit`, `list_my_site_reports`, `list_pending_site_reports`, `site_report_approve`, `site_report_reject`) — all five of which are confirmed live, working, and correctly role-gated. So the practical conclusion is unchanged from the original finding: this is a wiring gap, not a backend gap. **Action: FE-7 — Wire the existing Site Reports pages to the live RPCs; resolve the accountant/projectManager `SiteReportsReviewPage.tsx` duplication in the process.** Also update `CAREMS_Frontend_Engineering_Standard.md`, the ERD, and `API_Contract.md`, none of which currently mention this table or these 5 functions.

### 10.4 Rental invoicing posts revenue immediately — contradicts Decision #8
**Verified by reading the function directly:** `rental_invoice_create` posts `Dr AR (1130) / Cr Revenue (4300)` for the full invoiced amount at invoice date. Decision #8 requires straight-line accrual over the rental term via a deferred/unearned revenue account instead. **Checked live data: zero rental invoices have ever been posted** — same as the `2300 Bank Loans` situation in Decision #13, this is a real conflict but not currently corrupting any live figures, which lowers urgency without removing the need to fix it before the feature is used in anger. **Action: API-13 — Rental Revenue Accrual Rework**, following the same accrual pattern `completion_assessment_approve` already uses for WIP recognition. Higher-risk ticket — touches live financial postings, test carefully against Decision #8 before merging.

### 10.5 Function/endpoint count corrected: 52, not 40
Verified live: 52 total in `api` schema — 43 endpoint functions + 9 internal helpers. Stale "40" figures in `CAREMS_Frontend_Engineering_Standard.md`'s function table should be corrected, and the table should be extended to include the 5 site-report functions plus `rental_invoice_create`, `get_my_payslips`, `get_my_profile`, `list_rental_contracts`, `coa_reference_data`, and `assign_next_code`, none of which currently appear in it.

### 10.6 `expenses.supplier_id` is `NOT NULL` — no path for one-time/cash expenses
**Verified at the schema level.** No way today to record an expense without a pre-existing supplier row. **Agreed direction: Option B (schema-level fix).** **Action: API-11 — make `supplier_id` nullable, add `vendor_name text`, update `expense_create()` to require either `supplier_id` or `vendor_name`.** Needs a migration, an RPC update, and a frontend form change (conditional "one-time vendor name" field), tested against a positive case, a negative case, and existing-row regression.

### 10.7 No Miscellaneous/Sundry Expense GL account — resolved, no ticket
Being added directly via the Chart of Accounts page (system auto-assigns the next `6xxx` code). No further action.

### 10.8 No Petty Cash / Staff Advance workflow — ✅ done 2026-08-01
`1170 Staff Advances` existed in the chart of accounts but nothing posted to or settled it; the "Petty Cash" nav entry had no page behind it.

**Built (API-10):** new table `petty_cash_disbursements` (`disbursement_id`, `employee_id` nullable, `disbursement_type` — `direct`/`advance`/`advance_clearing`, `coa_account`, `settlement_account_id`, `linked_advance_id` self-referencing, `amount`, `journal_id`, `created_at`), plus a shape-enforcing `CHECK` constraint at the DB level (each `disbursement_type` has its required/forbidden columns enforced by Postgres, not just the RPC — same defense-in-depth convention as API-11's `expenses_supplier_or_vendor_name_chk`). New RPC `petty_cash_disbursement_create`, Accountant-only, three branches: `direct` (`Dr <expense account> / Cr <payment-method account>`), `advance` (`Dr 1170 / Cr <payment-method account>`, requires `employee_id`), `advance_clearing` (`Dr <expense account> / Cr 1170`, validates the linked advance belongs to the same employee and that the clearing amount doesn't exceed the outstanding balance — computed dynamically as original advance minus prior clearings, not a static figure).

**One deliberate, correct deviation from the original ticket wording:** `payment_made_create`'s overpayment handling is permissive (posts anyway, reports `overpayment_amount`) — this RPC hard-rejects instead. Right call: a customer overpaying a real invoice is a legitimate event worth recording; over-clearing an advance is a data-entry error, not a real transaction, and silently posting a negative advance balance would be worse than rejecting it.

Independently re-verified: table shape, CHECK constraint, function grants (`authenticated` only, correctly following the DB-5 convention on day one of a new function), RLS enabled with zero policies, all five required test cases' logic present in source, zero residue after cleanup.

**Frontend still needed** — queued as **FE-12** (not drafted yet), the actual Petty Cash page against this now-live RPC.
**Explicitly rejected alternative, recorded so it isn't re-proposed:** a manual Journal Entry creation page. This would break the deliberate rule that Journal Entries are read-only everywhere, which is what currently guarantees every journal is balanced, tax-correct, budget-checked, and traceable to a real source document.

### 10.9 No Customer or Supplier master-data management UI — ✅ done 2026-08-01
**Verified — searched the full frontend.** No page anywhere creates or edits a customer or supplier; `CustomerPaymentsPage`/`SupplierPaymentsPage` only select from an existing list. Confirmed this is frontend-only: `customers`/`suppliers` are already valid resources for the generic `get_records`/`create_record`/`update_record` dispatch functions (same mechanism Employees and Chart of Accounts already use), so no new RPC work is needed.

**Built (FE-8):** `CustomerRecordsPage.tsx` and `SupplierRecordsPage.tsx`, on the `EmployeeRecordsPage.tsx` pattern (search, modal create/edit, view-only detail modal). Wired to `get_records`/`create_record`/`update_record` with `p_resource` = `customers`/`suppliers`. Registered as a new **"Contacts"** nav section (Accountant workspace, placed after Invoicing & Expenses) — went with the shared-section option from the original recommendation rather than two standalone top-level items.

**Gaps found while building, not previously documented:**
- `customers.contact_info`/`suppliers.contact_info` is a freeform `jsonb` column server-side — nothing in `API_Contract.md` documents these two resources at all (not even the field names), and there's no enforced sub-key shape. The `email`/`phone`/`address` split used in both new forms is this build's own convention, not a schema contract — worth formalizing in `API_Contract.md` now that it exists, so a future page doesn't invent a different shape.
- Neither table has a `status` column, and neither `create_record`/`update_record` has a delete path for these resources — unlike Employees (which has "Terminate"), there is currently **no way to deactivate a customer or supplier** once created. Not blocking for Phase One, but worth a decision if the business ever needs to retire a bad record rather than just stop using it.

### 10.10 Previously known gaps, restated here for completeness (not new)

| Gap | Status | Source |
|---|---|---|
| Company profile endpoint (name/phone/locations) | Deferred to Phase Two — Decision #10 | Section 6 |
| Aggregate all-projects profitability + rental-revenue-trend charts | Deferred to Phase Two — Decision #10 | Section 6 |
| Tax remittance/payment endpoint | No backing RPC — tax reports read-only, undocumented gap | `CAREMS_Frontend_Engineering_Standard.md` |
| Admin Panel (User Management, Roles & Permissions, Audit Log, Security Monitoring) | No RPC surface for Admin role at all — placeholders by design | — |
| Employee Self-Service — Leave, Assigned Projects, Announcements | Only Payslips built; rest are nav placeholders | — |
| Defects-liability period & GRA tax-timing basis | Open, blocks v2.2 | Section 9 |

### 10.11 FE-11 — Accountant Dashboard rebuild (added 2026-08-01) — ✅ done
Rebuilt `AccountantDashboardPage.tsx` using `CAREMS_Accountant_Dashboard.html` as a layout reference only (fake numbers in that file were never used). Live panels: KPI row, Account Type breakdown, Revenue Breakdown, Expense Analysis, AR Ageing, Tax Liabilities Summary, Project Budget vs Actual, recent Journal Activity, a simplified 3-bar Balance Sheet summary (Total Assets / Total Liabilities / Equity — the mockup's full current/non-current breakdown was correctly not attempted, since that's blocked on Decision #13), and the existing task list. Confirmed working against live data by direct testing.

**API-14 — `expenses` added to `get_records`.** Was blocking the Project Budget vs Actual panel — there was previously no way to list expenses at all (only `expense_create` existed; `project_expenses_to_date` is an internal helper, not callable from the frontend). Added as a straight Accountant-only resource, same pattern as `accounts`/`customers`/`suppliers`.

**Process notes, worth remembering:**
- A first attempt at the `get_records` fix used the wrong parameter order and created a second overload instead of replacing the function — caught and fixed by checking `pg_get_function_identity_arguments` immediately after writing (should have checked before). Same overload risk this project already flagged once on `assign_next_code`.
- API-11 (Section 10.6) was found already complete when this work started, but not by whoever was expected — a second party applied their own migration to `expense_create`/`payment_made_create`/`report_ageing` on the same live database, concurrently and without coordination. Their version was sound and is what's live now. No data was lost, but this is a real risk going forward with two independent parties writing to the same live Supabase project — check current live function state before writing, every time, not just when something seems off.

### 10.12 Suggested sequencing
Adjusted from the original session's proposal — security moved up, since its cost of deferral compounds with everything built on top of it, not because it's urgent to fix today (RLS currently covers it):
1. **Now, no dependencies:** 10.7 (in progress already), 10.5 (doc-only correction).
2. **Security, cheap now / more expensive later:** 10.1 (DB-5 — done), 10.2 next (deferred, needs its own scoping).
3. **Backend-light, independent, can run in parallel:** 10.6 (API-11 — done), 10.9 (FE-8 — done).
4. **Depends on 10.7:** 10.8 (API-10 + Petty Cash page).
5. **Wiring against an already-working backend:** 10.3 (FE-7).
6. **Real accounting rework, higher risk — test carefully:** 10.4 (API-13).

---
