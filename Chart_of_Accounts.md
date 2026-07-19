# CAREMS — CHART OF ACCOUNTS (v1.0, Corrected)
Phase One Chart of Accounts for the Construction, Architecture, Consultancy & Equipment Rental business. Complies with IFRS (Ghana's national GAAP) and GRA tax requirements.

**Projects (Manet, Tse Addo, Tamale, Katamanso, Airport, etc.) are set up as Projects/Cost Centres — never as GL accounts.** Every transaction tags a project reference; the GL stays clean.

## Corrections applied to the original draft
1. Removed "GFRS" reference — IFRS is Ghana's national GAAP (see prior correction).
2. Category headers no longer double as account codes (was a primary-key collision in every section) — replaced with a **Reporting Group** column on each leaf account instead.
3. Added **NHIL Payable (2205)** and **GETFund Levy Payable (2206)** — required by the corrected SRS Section 9, previously only VAT existed.
4. Added **Employer SSNIT Contribution** accounts (5005, 6105) — required by the corrected SRS Section 8 payroll posting, which treats employer SSNIT as a real expense.
5. Added **Withholding Tax Credit Receivable (1145)** — tracks tax credits from clients withholding tax on the company's professional fees.
6. Added **Other Payroll Deductions Payable (2135)** — referenced in the corrected payroll posting but previously had no account.
7. Reclassified **Incentives & Bonuses**: moved from "Finance Costs" (7040) to Admin Expenses as **6111 Staff Incentives & Bonuses** — it's a staff cost, not a cost of borrowing.

---

## 1000 – ASSETS

### Current Assets
| Code | Account Name | Type | Reporting Group |
|---|---|---|---|
| 1100 | Cash on Hand | Asset | Current Assets |
| 1110 | Bank Accounts Control | Asset | Current Assets |
| 1111 | Ecobank | Asset | Current Assets |
| 1112 | Fidelity Bank | Asset | Current Assets |
| 1113 | GCB Bank | Asset | Current Assets |
| 1114 | Stanbic Bank | Asset | Current Assets |
| 1120 | Mobile Money | Asset | Current Assets |
| 1130 | Accounts Receivable – Clients | Asset | Current Assets |
| 1140 | Retention Receivable | Asset | Current Assets |
| **1145** | **Withholding Tax Credit Receivable** | Asset | Current Assets |
| 1150 | Contract Assets / Work in Progress (WIP) | Asset | Current Assets |
| 1160 | Advances to Suppliers | Asset | Current Assets |
| 1170 | Staff Advances | Asset | Current Assets |
| 1180 | Prepaid Expenses | Asset | Current Assets |
| 1190 | Other Receivables | Asset | Current Assets |

### Fixed Assets
| Code | Account Name | Type | Reporting Group |
|---|---|---|---|
| 1200 | Furniture & Fixtures | Asset | Fixed Assets |
| 1210 | Computers & IT Equipment | Asset | Fixed Assets |
| 1220 | Construction Equipment | Asset | Fixed Assets |
| 1230 | Motor Vehicles | Asset | Fixed Assets |
| 1240 | Office Equipment | Asset | Fixed Assets |
| 1250 | Rental Equipment | Asset | Fixed Assets |

### Accumulated Depreciation (contra-asset)
| Code | Account Name | Type | Reporting Group |
|---|---|---|---|
| 1290 | Accumulated Depreciation – Furniture | Contra-Asset | Fixed Assets |
| 1291 | Accumulated Depreciation – Computers | Contra-Asset | Fixed Assets |
| 1292 | Accumulated Depreciation – Equipment | Contra-Asset | Fixed Assets |
| 1293 | Accumulated Depreciation – Vehicles | Contra-Asset | Fixed Assets |
| 1294 | Accumulated Depreciation – Office Equipment | Contra-Asset | Fixed Assets |
| 1295 | Accumulated Depreciation – Rental Equipment | Contra-Asset | Fixed Assets |

---

## 2000 – LIABILITIES

### Current Liabilities
| Code | Account Name | Type | Reporting Group |
|---|---|---|---|
| 2100 | Accounts Payable – Suppliers | Liability | Current Liabilities |
| 2110 | Accounts Payable – Subcontractors | Liability | Current Liabilities |
| 2120 | Accrued Expenses | Liability | Current Liabilities |
| 2130 | Staff Salaries Payable | Liability | Current Liabilities |
| **2135** | **Other Payroll Deductions Payable** | Liability | Current Liabilities |
| 2140 | Client Advances / Unearned Revenue | Liability | Current Liabilities |
| 2150 | Retention Payable | Liability | Current Liabilities |

### Tax Liabilities
| Code | Account Name | Type | Reporting Group |
|---|---|---|---|
| 2200 | VAT Output Tax | Liability | Tax Liabilities |
| **2205** | **NHIL Payable** | Liability | Tax Liabilities |
| **2206** | **GETFund Levy Payable** | Liability | Tax Liabilities |
| 2210 | VAT Input Tax | Liability | Tax Liabilities |
| 2220 | VAT Payable | Liability | Tax Liabilities |
| 2230 | PAYE Payable | Liability | Tax Liabilities |
| 2240 | SSNIT Payable | Liability | Tax Liabilities |
| 2250 | Withholding Tax Payable | Liability | Tax Liabilities |
| 2260 | Corporate Tax Payable | Liability | Tax Liabilities |

### Borrowings
| Code | Account Name | Type | Reporting Group |
|---|---|---|---|
| 2300 | Bank Loans | Liability | Borrowings |
| 2310 | Director's Loan | Liability | Borrowings |
| 2320 | Other Loans | Liability | Borrowings |

---

## 3000 – EQUITY
| Code | Account Name | Type | Reporting Group |
|---|---|---|---|
| 3000 | Owner's Capital | Equity | Equity |
| 3010 | Additional Capital | Equity | Equity |
| 3020 | Retained Earnings | Equity | Equity |
| 3030 | Drawings | Equity | Equity |
| 3040 | Current Year Earnings | Equity | Equity |

---

## 4000 – REVENUE

### Professional Services
| Code | Account Name | Type | Reporting Group |
|---|---|---|---|
| 4100 | Architectural Design Fees | Income | Revenue |
| 4110 | Consultancy Fees | Income | Revenue |
| 4120 | Planning & Permit Processing Fees | Income | Revenue |
| 4130 | Supervision & Site Inspection Fees | Income | Revenue |
| 4140 | 3D Visualization & Modeling Fees | Income | Revenue |

### Construction Revenue
| Code | Account Name | Type | Reporting Group |
|---|---|---|---|
| 4200 | Construction Contract Revenue | Income | Revenue |
| 4210 | Renovation & Remodeling Revenue | Income | Revenue |
| 4220 | Project Management Fees | Income | Revenue |
| 4230 | Variation & Extra Works Revenue | Income | Revenue |

### Rental Revenue
| Code | Account Name | Type | Reporting Group |
|---|---|---|---|
| 4300 | Equipment Rental Revenue | Income | Revenue |
| 4310 | Vehicle Rental Revenue | Income | Revenue |

### Other Income
| Code | Account Name | Type | Reporting Group |
|---|---|---|---|
| 4400 | Other Income | Income | Revenue |
| 4410 | Gain on Asset Disposal | Income | Revenue |
| 4420 | Discounts Received | Income | Revenue |

---

## 5000 – DIRECT PROJECT COSTS
| Code | Account Name | Type | Reporting Group |
|---|---|---|---|
| 5000 | Project Staff Salaries | Expense | Direct Project Costs |
| **5005** | **Employer SSNIT Contribution – Project Staff** | Expense | Direct Project Costs |
| 5010 | Site Travel & Transport | Expense | Direct Project Costs |
| 5020 | Printing, Plotting & Drawings | Expense | Direct Project Costs |
| 5030 | Software Subscriptions | Expense | Direct Project Costs |
| 5100 | Building Materials | Expense | Direct Project Costs |
| 5110 | Electrical Materials | Expense | Direct Project Costs |
| 5120 | Plumbing Materials | Expense | Direct Project Costs |
| 5130 | Subcontractor Costs | Expense | Direct Project Costs |
| 5140 | Skilled Labour | Expense | Direct Project Costs |
| 5150 | Equipment Hire | Expense | Direct Project Costs |
| 5160 | Accommodation | Expense | Direct Project Costs |
| 5170 | Site Utilities | Expense | Direct Project Costs |
| 5180 | Site Security | Expense | Direct Project Costs |
| 5190 | Project Insurance | Expense | Direct Project Costs |
| 5200 | Project Fuel | Expense | Direct Project Costs |
| 5210 | Airfare & Travel | Expense | Direct Project Costs |
| 5220 | Construction Tools & Consumables | Expense | Direct Project Costs |
| 5230 | Painting & Damp Proofing | Expense | Direct Project Costs |
| 5240 | Temporary Works | Expense | Direct Project Costs |
| 5250 | Waste Disposal | Expense | Direct Project Costs |

---

## 6000 – ADMINISTRATIVE & OPERATING EXPENSES
| Code | Account Name | Type | Reporting Group |
|---|---|---|---|
| 6000 | Office Rent | Expense | Admin & Operating |
| 6010 | Office Utilities | Expense | Admin & Operating |
| 6020 | Internet & Communication | Expense | Admin & Operating |
| 6030 | Office Stationery & Supplies | Expense | Admin & Operating |
| 6040 | Cleaning & Sanitation | Expense | Admin & Operating |
| 6100 | Administrative Salaries | Expense | Admin & Operating |
| **6105** | **Employer SSNIT Contribution – Admin Staff** | Expense | Admin & Operating |
| 6110 | Staff Welfare | Expense | Admin & Operating |
| **6111** | **Staff Incentives & Bonuses** | Expense | Admin & Operating |
| 6120 | Training & Professional Development | Expense | Admin & Operating |
| 6130 | Recruitment Expenses | Expense | Admin & Operating |
| 6200 | Professional Memberships | Expense | Admin & Operating |
| 6210 | Legal & Audit Fees | Expense | Admin & Operating |
| 6220 | Business Registration & Permits | Expense | Admin & Operating |
| 6300 | Advertising & Marketing | Expense | Admin & Operating |
| 6310 | Client Entertainment | Expense | Admin & Operating |
| 6400 | Fuel & Vehicle Running | Expense | Admin & Operating |
| 6410 | Vehicle Maintenance | Expense | Admin & Operating |
| 6420 | Transport Allowances | Expense | Admin & Operating |
| 6430 | Software & Cloud Services | Expense | Admin & Operating |
| **6440** | **Depreciation Expense** | Expense | Admin & Operating |

---

## 7000 – FINANCE COSTS
| Code | Account Name | Type | Reporting Group |
|---|---|---|---|
| 7000 | Bank Charges | Expense | Finance Costs |
| 7010 | Mobile Money Charges | Expense | Finance Costs |
| 7020 | Interest on Loans | Expense | Finance Costs |
| 7030 | Exchange Losses | Expense | Finance Costs |

*(7040 "Incentives & Bonuses" removed from this section — reclassified as 6111 above.)*

---

## 8000 – TAX EXPENSES
| Code | Account Name | Type | Reporting Group |
|---|---|---|---|
| 8000 | Corporate Income Tax Expense | Expense | Tax Expenses |
| 8010 | Tax Penalties & Interest | Expense | Tax Expenses |
| 8020 | Non-Deductible Expenses | Expense | Tax Expenses |

---

## Mapping back to the API Contract

This resolves the open item in Master Plan Section 6 / API Contract Section 6:

| Transaction | Posts to (accounts) |
|---|---|
| Customer Invoice | Dr 1130 (AR) → Cr 4xxx (Revenue), Cr 2200 (VAT Output), Cr 2205 (NHIL), Cr 2206 (GETFund) |
| Customer Payment | Dr 1110/1120 (Bank/MoMo) → Cr 1130 (AR) |
| Supplier Invoice | Dr 5xxx/6xxx/1xxx (Expense/Asset) + Dr 2210 (VAT Input) → Cr 2100 (AP) |
| Supplier Payment | Dr 2100 (AP) → Cr 1110/1120 (Bank/MoMo) |
| Payroll Run | Dr 5000/6100 (Salary Expense) + Dr 5005/6105 (Employer SSNIT) → Cr 2130 (Salaries Payable), Cr 2230 (PAYE), Cr 2240 (SSNIT), Cr 2135 (Other Deductions) |
| Salary Payment | Dr 2130 (Salaries Payable) → Cr 1110/1120 (Bank/MoMo) |
| Asset Purchase | Dr 1200-series (Fixed Asset) → Cr 2100 (AP) / 1110 (Bank) |
| Monthly Depreciation | Dr Depreciation Expense (new: recommend 6440) → Cr 1290-series (Accum. Depreciation) |

**One more gap surfaced:** there's no explicit **Depreciation Expense** account in the Admin Expenses section — only the contra-asset (Accumulated Depreciation) exists on the balance-sheet side. Recommend adding **6440 Depreciation Expense** to Section 6000 to complete the postings above.
