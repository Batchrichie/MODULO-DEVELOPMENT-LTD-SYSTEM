# CAREMS — Financial Statement Presentation Standard (v1.0)
**Standard applied:** IAS 1, *Presentation of Financial Statements*, as adopted under IFRS — Ghana's national GAAP, administered by ICAG.
**Purpose:** This document specifies the exact statement formats `report_sofp`, `report_income_statement`, `report_cash_flow`, and a new Statement of Changes in Equity report must produce, mapped to the live Chart of Accounts (`Chart_of_Accounts.md`). It is the reference for Ticket API-9 (Master Plan v2.1) and for any future report-builder work.

**Entity type assumed:** a single Ghanaian company with three revenue streams — construction contracting, architectural/consultancy professional services, and short-term equipment rental (lessor, operating leases per Master Plan v2.1 Decision #8) — reporting in GHS, IFRS-compliant, ICAG-administered.

---

## 1. Statement of Financial Position (`report_sofp`)

IAS 1 requires a **classified** presentation — current items separated from non-current — unless a liquidity-based presentation is more relevant, which is not the case here. Two columns: current period and comparative prior period.

### ASSETS

**Non-current assets**
| Line | Source accounts |
|---|---|
| Property, plant and equipment (net) | `1200`–`1250` less `1290`–`1295` accumulated depreciation |
| Withholding Tax Credit Receivable (non-current portion, if any carried beyond 12 months) | `1145` |

**Current assets**
| Line | Source accounts |
|---|---|
| Cash and cash equivalents | `1100`, `1110`–`1114`, `1120` (and `1121`/`1122` if MoMo split is live) |
| Trade and other receivables | `1130` Accounts Receivable, `1140` Retention Receivable, `1190` Other Receivables |
| Contract assets | `1150` Contract Assets/WIP — **shown separately from trade receivables**, per IFRS 15's distinct contract-asset presentation requirement, not folded into "Receivables" |
| Advances and prepayments | `1160` Advances to Suppliers, `1170` Staff Advances, `1180` Prepaid Expenses |
| Withholding Tax Credit Receivable (current portion) | `1145` |

**Total Assets**

### LIABILITIES

**Non-current liabilities**
| Line | Source accounts |
|---|---|
| Bank loans (portion due beyond 12 months) | `2300` — **must be split**; see Ticket API-9 finding this document exists to force |
| Director's Loan / Other Loans (if not repayable on demand) | `2310`, `2320` |

**Current liabilities**
| Line | Source accounts |
|---|---|
| Trade and other payables | `2100` AP–Suppliers, `2110` AP–Subcontractors, `2120` Accrued Expenses |
| Contract liabilities | `2140` Client Advances / Unearned Revenue — **shown separately**, mirroring the contract-asset treatment above; this is the IFRS 15 counterpart line |
| Payroll payables | `2130` Salaries Payable, `2135` Other Payroll Deductions Payable |
| Retention payable | `2150` |
| Tax payables | `2200` VAT Output, `2205` NHIL, `2206` GETFund, `2210` VAT Input (net against Output for presentation), `2220` VAT Payable, `2230` PAYE Payable, `2240` SSNIT Payable, `2250` Withholding Tax Payable, `2260` Corporate Tax Payable |
| Bank loans (current portion, due within 12 months) | `2300` (split portion) |

**Total Liabilities**

### EQUITY
| Line | Source accounts |
|---|---|
| Owner's Capital | `3000` |
| Additional Capital | `3010` |
| Retained Earnings | `3020` (roll-forward includes `3040` Current Year Earnings at year-end close) |
| Drawings | `3030` (presented as a deduction) |

**Total Equity**
**Total Liabilities and Equity** (must equal Total Assets — this is the balance check every report must pass before rendering)

---

## 2. Statement of Profit or Loss (`report_income_statement`)

**Format decision: function of expense (cost-of-sales method), not nature of expense.** This is the standard choice for construction contractors under IAS 1 because it produces a meaningful **Gross Profit** line — critical for a business managing project-level margins across three distinct revenue streams. The nature-of-expense format (grouping by salaries, materials, depreciation, etc. without a cost-of-sales subtotal) would bury project profitability, which contradicts the SRS's own stated objective of "real-time profitability analysis" (Section 2).

| Line | Source accounts |
|---|---|
| **Revenue** | `4100`–`4230` (professional fees + construction revenue), disaggregated — see Section 5 below |
| **Rental Revenue** | `4300`, `4310` — shown as a separate revenue line, not blended into construction revenue, since it is a distinct business stream under IFRS 16 lessor accounting |
| Total Revenue | sum of above |
| **Cost of Sales / Direct Project Costs** | `5000`–`5250` |
| **Gross Profit** | Total Revenue − Cost of Sales |
| Other Income | `4400`, `4410`, `4420` |
| Administrative Expenses | `6000`–`6440` |
| **Operating Profit** | Gross Profit + Other Income − Administrative Expenses |
| Finance Costs | `7000`–`7030` |
| **Profit Before Tax** | Operating Profit − Finance Costs |
| Tax Expense | `8000`–`8020` |
| **Profit for the Year** | Profit Before Tax − Tax Expense |

**Note on rental cost allocation:** depreciation on `1250 Rental Equipment` (posted via `1295` accumulated depreciation) should be attributed to rental cost of sales if the business wants a true rental-segment gross margin, rather than left inside blanket Administrative Expenses `6440`. This is a report-builder decision, not a Chart of Accounts change — flag to Backend during API-9.

---

## 3. Statement of Changes in Equity

A columnar statement, not currently built as a distinct endpoint — this is a gap the IAS 1 audit (API-9) should confirm and, if missing, a new `report_changes_in_equity` endpoint should be scoped.

| | Owner's Capital (3000) | Additional Capital (3010) | Retained Earnings (3020) | Drawings (3030) | Total |
|---|---|---|---|---|---|
| Balance, start of year | | | | | |
| Profit for the year | | | +Current Year Earnings (3040) | | |
| Drawings during the year | | | | (X) | |
| Additional capital introduced | | +X | | | |
| **Balance, end of year** | | | | | |

---

## 4. Statement of Cash Flows (`report_cash_flow`)

**Method decision: indirect method.** Given how much `1150 Contract Assets/WIP` and `2140 Client Advances` swing period to period under Percentage of Completion, reconciling from Profit Before Tax to operating cash flow is both the IAS 7-preferred approach for this profile and the only practical way to show *why* reported profit and cash position diverge — a common source of confusion in construction financials.

| Section | Content |
|---|---|
| **Operating activities** | Start with Profit Before Tax. Add back: depreciation (`1290`–`1295` movement), non-cash items. Adjust for working capital movements: change in `1150` WIP, change in `1130`/`1140` receivables, change in `2100`/`2110` payables, change in `2140` Client Advances, change in tax payables (`2200`–`2260`). |
| **Investing activities** | Purchases of fixed/rental assets (`1200`–`1250` additions), proceeds from asset disposal (`4410` Gain on Disposal, net of book value) |
| **Financing activities** | Loan drawdowns/repayments (`2300`–`2320`), capital introduced (`3000`/`3010`), drawings (`3030`) |
| **Net increase/decrease in cash** | Sum of the three sections |
| **Cash, beginning of period** → **Cash, end of period** | Must tie to SOFP `1100`–`1122` total |

---

## 5. Revenue disaggregation note (IFRS 15 requirement)

IFRS 15 requires disaggregating revenue into categories that show how economic factors affect revenue timing and nature. For this business, the natural split is by segment, not just by GL account:

| Segment | Accounts | Recognition pattern |
|---|---|---|
| Construction contracting | `4200`, `4210`, `4220`, `4230` | Percentage of Completion — over time, per completion assessments |
| Architectural & professional services | `4100`, `4110`, `4120`, `4130`, `4140` | Confirm with Instructor whether these are also POC or point-in-time (e.g., a permit-processing fee is more likely point-in-time than a multi-month design engagement) — **not currently specified anywhere in the SRS or Master Plan; flag as a gap** |
| Equipment rental | `4300`, `4310` | Straight-line over lease term, per Master Plan v2.1 Decision #8 |

This table itself is a required disclosure note, not just an internal design reference — it should appear in the notes to the financial statements, not only inform the report builder's logic.

---

## 6. Notes to the Financial Statements — required disclosures once v2.2 items are built

These are listed now so Backend and Instructor know what's coming, even though the underlying accounts (provisions, ECL allowance, deferred tax) are not yet built:

- **Significant judgments in applying IFRS 15** — the method used to measure percentage of completion (e.g., cost-to-cost, surveys of work performed), per IFRS 15.124
- **Provisions (IAS 37)** — once built: opening balance, provisions made, provisions used, provisions reversed, closing balance for `2160`/`2170`
- **Expected credit losses (IFRS 9)** — once built: the provision matrix basis used, and the movement in `1135` allowance for the period
- **Deferred tax (IAS 12)** — once built: reconciliation of temporary differences to the deferred tax asset/liability recognized

These four notes are placeholders until Master Plan v2.1's Section 9 open questions (defects-liability period, GRA tax-timing basis) are resolved and v2.2 tickets are issued.

---

## 7. What this document does NOT resolve

- Whether `4100`–`4140` professional fees are POC or point-in-time (Section 5 gap, needs Instructor input)
- The actual current/non-current split logic for `2300` Bank Loans (needs loan agreement terms, not assumed)
- Segment reporting under IFRS 8 (not addressed here — only IAS 1 statement-level disaggregation is covered; a full segment note is a separate, larger question the Instructor should decide is in or out of scope)
