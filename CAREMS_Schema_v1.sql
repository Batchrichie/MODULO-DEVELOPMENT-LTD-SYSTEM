-- =========================================================
-- CAREMS — PHASE 1 DATABASE SCHEMA
-- Built from: CAREMS_ERD.mermaid + Chart_of_Accounts.md
-- Target: Supabase / PostgreSQL
-- =========================================================

create extension if not exists pgcrypto;

-- ============ MASTER DATA ============

create table chart_of_accounts (
  account_id       uuid primary key default gen_random_uuid(),
  code             varchar(10) unique not null,
  name             varchar(150) not null,
  type             varchar(20) not null check (type in ('Asset','Contra-Asset','Liability','Equity','Income','Expense')),
  reporting_group  varchar(100) not null,
  is_postable      boolean not null default true,
  created_at       timestamptz default now()
);

create table customers (
  customer_id     uuid primary key default gen_random_uuid(),
  name            varchar(200) not null,
  contact_info    jsonb,
  created_at      timestamptz default now()
);

create table suppliers (
  supplier_id     uuid primary key default gen_random_uuid(),
  name            varchar(200) not null,
  contact_info    jsonb,
  created_at      timestamptz default now()
);

create table employees (
  employee_id     uuid primary key default gen_random_uuid(),
  name            varchar(200) not null,
  role            varchar(100),
  basic_salary    numeric(14,2) default 0,
  created_at      timestamptz default now()
);

create table users (
  user_id         uuid primary key default gen_random_uuid(),
  employee_id     uuid references employees(employee_id),
  email           varchar(200) unique not null,
  role            varchar(30) not null check (role in ('CEO','Accountant','ProjectManager','Employee','Admin')),
  created_at      timestamptz default now()
);

create table bank_accounts (
  account_id      uuid primary key default gen_random_uuid(),
  bank_name       varchar(100) not null,
  account_number  varchar(50) not null,
  coa_account     uuid references chart_of_accounts(account_id),
  created_at      timestamptz default now()
);

create table equipment (
  equipment_id    uuid primary key default gen_random_uuid(),
  name            varchar(200) not null,
  category        varchar(100),
  status          varchar(30) default 'Available',
  created_at      timestamptz default now()
);

create table fixed_assets (
  asset_id              uuid primary key default gen_random_uuid(),
  name                  varchar(200) not null,
  category              varchar(100),
  cost                  numeric(14,2) not null,
  useful_life_years     int,
  depreciation_method   varchar(50) default 'Straight-Line',
  acquisition_date      date,
  coa_asset_account     uuid references chart_of_accounts(account_id),
  coa_accum_dep_account uuid references chart_of_accounts(account_id),
  status                varchar(30) default 'Active',
  created_at            timestamptz default now()
);

create table tax_rate_settings (
  setting_id      uuid primary key default gen_random_uuid(),
  tax_type        varchar(30) not null check (tax_type in ('VAT','NHIL','GETFUND','SSNIT_EMPLOYEE','SSNIT_EMPLOYER','PAYE_BAND')),
  rate            numeric(6,3) not null,
  effective_from  date not null default current_date
);

create table projects (
  project_id            uuid primary key default gen_random_uuid(),
  name                  varchar(200) not null,
  customer_id           uuid references customers(customer_id),
  contract_value        numeric(14,2) not null,
  project_manager_id    uuid references employees(employee_id),
  expected_completion   date,
  status                varchar(30) default 'Active',
  budget_labour         numeric(14,2) default 0,
  budget_materials      numeric(14,2) default 0,
  budget_fuel           numeric(14,2) default 0,
  budget_transport      numeric(14,2) default 0,
  budget_subcontractors numeric(14,2) default 0,
  budget_misc           numeric(14,2) default 0,
  created_at            timestamptz default now()
);

-- ============ GENERAL LEDGER ============

create table journals (
  journal_id        uuid primary key default gen_random_uuid(),
  txn_date          date not null default current_date,
  source_type       varchar(40) not null,  -- e.g. 'invoice','expense','payroll','completion_assessment'
  source_id         uuid,
  accounting_period varchar(7) not null,   -- 'YYYY-MM'
  status            varchar(20) default 'posted',
  created_at        timestamptz default now()
);

create table journal_lines (
  line_id      uuid primary key default gen_random_uuid(),
  journal_id   uuid not null references journals(journal_id) on delete cascade,
  account_id   uuid not null references chart_of_accounts(account_id),
  project_id   uuid references projects(project_id),   -- cost-centre tagging, nullable for overhead
  debit        numeric(14,2) not null default 0,
  credit       numeric(14,2) not null default 0,
  check (debit = 0 or credit = 0),
  check (debit >= 0 and credit >= 0)
);

-- ============ SALES CYCLE (Percentage of Completion) ============

create table project_completion_assessments (
  assessment_id    uuid primary key default gen_random_uuid(),
  project_id       uuid not null references projects(project_id),
  period           varchar(7) not null,
  percent_complete numeric(5,2) not null check (percent_complete between 0 and 100),
  assessed_by      uuid references employees(employee_id),
  approved_by      uuid references employees(employee_id),
  status           varchar(20) default 'pending_approval', -- pending_approval | approved | rejected
  journal_id       uuid references journals(journal_id),
  created_at       timestamptz default now()
);

create table invoices (
  invoice_id   uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references customers(customer_id),
  project_id   uuid references projects(project_id),
  amount       numeric(14,2) not null,
  vat          numeric(14,2) default 0,
  nhil         numeric(14,2) default 0,
  getfund      numeric(14,2) default 0,
  journal_id   uuid references journals(journal_id),
  status       varchar(20) default 'issued',
  created_at   timestamptz default now()
);

create table invoice_lines (
  line_id      uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references invoices(invoice_id) on delete cascade,
  description  text not null,
  amount       numeric(14,2) not null
);

create table customer_payments (
  payment_id       uuid primary key default gen_random_uuid(),
  customer_id      uuid not null references customers(customer_id),
  invoice_id       uuid references invoices(invoice_id),   -- nullable: advance payment before invoicing
  bank_account_id  uuid not null references bank_accounts(account_id),
  amount           numeric(14,2) not null,
  journal_id       uuid references journals(journal_id),
  payment_date     date not null default current_date
);

-- ============ EXPENSE / PROJECT COSTING CYCLE ============

create table expenses (
  expense_id   uuid primary key default gen_random_uuid(),
  supplier_id  uuid not null references suppliers(supplier_id),
  project_id   uuid references projects(project_id),
  coa_account  uuid not null references chart_of_accounts(account_id),
  amount       numeric(14,2) not null,
  vat_input    numeric(14,2) default 0,
  journal_id   uuid references journals(journal_id),
  status       varchar(20) default 'recorded',
  budget_flag  boolean default false,  -- true if INSUFFICIENT_BUDGET warning fired
  created_at   timestamptz default now()
);

create table supplier_payments (
  payment_id       uuid primary key default gen_random_uuid(),
  supplier_id      uuid not null references suppliers(supplier_id),
  expense_id       uuid references expenses(expense_id),
  bank_account_id  uuid not null references bank_accounts(account_id),
  amount           numeric(14,2) not null,
  journal_id       uuid references journals(journal_id),
  payment_date     date not null default current_date
);

-- ============ EQUIPMENT RENTAL ============

create table rental_contracts (
  contract_id  uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references equipment(equipment_id),
  customer_id  uuid not null references customers(customer_id),
  project_id   uuid references projects(project_id),
  start_date   date not null,
  end_date     date,
  rate         numeric(14,2) not null,
  created_at   timestamptz default now()
);

-- ============ PAYROLL ============

create table payroll_runs (
  run_id      uuid primary key default gen_random_uuid(),
  period      varchar(7) not null,
  status      varchar(20) default 'draft',  -- draft | approved | paid
  journal_id  uuid references journals(journal_id),
  created_at  timestamptz default now()
);

create table payslips (
  payslip_id       uuid primary key default gen_random_uuid(),
  run_id           uuid not null references payroll_runs(run_id) on delete cascade,
  employee_id      uuid not null references employees(employee_id),
  gross_salary     numeric(14,2) not null,
  paye             numeric(14,2) default 0,
  ssnit_employee   numeric(14,2) default 0,
  ssnit_employer   numeric(14,2) default 0,
  other_deductions numeric(14,2) default 0,
  net_salary       numeric(14,2) not null
);

-- ============ AUDIT ============

create table audit_log (
  log_id      uuid primary key default gen_random_uuid(),
  user_id     uuid references users(user_id),
  table_name  varchar(60) not null,
  record_id   uuid,
  action      varchar(20) not null,  -- INSERT | UPDATE | DELETE
  old_value   jsonb,
  new_value   jsonb,
  timestamp   timestamptz default now()
);

-- =========================================================
-- SEED: CHART OF ACCOUNTS (from Chart_of_Accounts.md v1.0)
-- =========================================================

insert into chart_of_accounts (code, name, type, reporting_group) values
-- Current Assets
('1100','Cash on Hand','Asset','Current Assets'),
('1110','Bank Accounts Control','Asset','Current Assets'),
('1111','Ecobank','Asset','Current Assets'),
('1112','Fidelity Bank','Asset','Current Assets'),
('1113','GCB Bank','Asset','Current Assets'),
('1114','Stanbic Bank','Asset','Current Assets'),
('1120','Mobile Money','Asset','Current Assets'),
('1130','Accounts Receivable - Clients','Asset','Current Assets'),
('1140','Retention Receivable','Asset','Current Assets'),
('1145','Withholding Tax Credit Receivable','Asset','Current Assets'),
('1150','Contract Assets / Work in Progress (WIP)','Asset','Current Assets'),
('1160','Advances to Suppliers','Asset','Current Assets'),
('1170','Staff Advances','Asset','Current Assets'),
('1180','Prepaid Expenses','Asset','Current Assets'),
('1190','Other Receivables','Asset','Current Assets'),
-- Fixed Assets
('1200','Furniture & Fixtures','Asset','Fixed Assets'),
('1210','Computers & IT Equipment','Asset','Fixed Assets'),
('1220','Construction Equipment','Asset','Fixed Assets'),
('1230','Motor Vehicles','Asset','Fixed Assets'),
('1240','Office Equipment','Asset','Fixed Assets'),
('1250','Rental Equipment','Asset','Fixed Assets'),
-- Accumulated Depreciation
('1290','Accumulated Depreciation - Furniture','Contra-Asset','Fixed Assets'),
('1291','Accumulated Depreciation - Computers','Contra-Asset','Fixed Assets'),
('1292','Accumulated Depreciation - Equipment','Contra-Asset','Fixed Assets'),
('1293','Accumulated Depreciation - Vehicles','Contra-Asset','Fixed Assets'),
('1294','Accumulated Depreciation - Office Equipment','Contra-Asset','Fixed Assets'),
('1295','Accumulated Depreciation - Rental Equipment','Contra-Asset','Fixed Assets'),
-- Current Liabilities
('2100','Accounts Payable - Suppliers','Liability','Current Liabilities'),
('2110','Accounts Payable - Subcontractors','Liability','Current Liabilities'),
('2120','Accrued Expenses','Liability','Current Liabilities'),
('2130','Staff Salaries Payable','Liability','Current Liabilities'),
('2135','Other Payroll Deductions Payable','Liability','Current Liabilities'),
('2140','Client Advances / Unearned Revenue','Liability','Current Liabilities'),
('2150','Retention Payable','Liability','Current Liabilities'),
-- Tax Liabilities
('2200','VAT Output Tax','Liability','Tax Liabilities'),
('2205','NHIL Payable','Liability','Tax Liabilities'),
('2206','GETFund Levy Payable','Liability','Tax Liabilities'),
('2210','VAT Input Tax','Liability','Tax Liabilities'),
('2220','VAT Payable','Liability','Tax Liabilities'),
('2230','PAYE Payable','Liability','Tax Liabilities'),
('2240','SSNIT Payable','Liability','Tax Liabilities'),
('2250','Withholding Tax Payable','Liability','Tax Liabilities'),
('2260','Corporate Tax Payable','Liability','Tax Liabilities'),
-- Borrowings
('2300','Bank Loans','Liability','Borrowings'),
('2310',E'Director\'s Loan','Liability','Borrowings'),
('2320','Other Loans','Liability','Borrowings'),
-- Equity
('3000',E'Owner\'s Capital','Equity','Equity'),
('3010','Additional Capital','Equity','Equity'),
('3020','Retained Earnings','Equity','Equity'),
('3030','Drawings','Equity','Equity'),
('3040','Current Year Earnings','Equity','Equity'),
-- Revenue
('4100','Architectural Design Fees','Income','Revenue'),
('4110','Consultancy Fees','Income','Revenue'),
('4120','Planning & Permit Processing Fees','Income','Revenue'),
('4130','Supervision & Site Inspection Fees','Income','Revenue'),
('4140','3D Visualization & Modeling Fees','Income','Revenue'),
('4200','Construction Contract Revenue','Income','Revenue'),
('4210','Renovation & Remodeling Revenue','Income','Revenue'),
('4220','Project Management Fees','Income','Revenue'),
('4230','Variation & Extra Works Revenue','Income','Revenue'),
('4300','Equipment Rental Revenue','Income','Revenue'),
('4310','Vehicle Rental Revenue','Income','Revenue'),
('4400','Other Income','Income','Revenue'),
('4410','Gain on Asset Disposal','Income','Revenue'),
('4420','Discounts Received','Income','Revenue'),
-- Direct Project Costs
('5000','Project Staff Salaries','Expense','Direct Project Costs'),
('5005','Employer SSNIT Contribution - Project Staff','Expense','Direct Project Costs'),
('5010','Site Travel & Transport','Expense','Direct Project Costs'),
('5020','Printing, Plotting & Drawings','Expense','Direct Project Costs'),
('5030','Software Subscriptions','Expense','Direct Project Costs'),
('5100','Building Materials','Expense','Direct Project Costs'),
('5110','Electrical Materials','Expense','Direct Project Costs'),
('5120','Plumbing Materials','Expense','Direct Project Costs'),
('5130','Subcontractor Costs','Expense','Direct Project Costs'),
('5140','Skilled Labour','Expense','Direct Project Costs'),
('5150','Equipment Hire','Expense','Direct Project Costs'),
('5160','Accommodation','Expense','Direct Project Costs'),
('5170','Site Utilities','Expense','Direct Project Costs'),
('5180','Site Security','Expense','Direct Project Costs'),
('5190','Project Insurance','Expense','Direct Project Costs'),
('5200','Project Fuel','Expense','Direct Project Costs'),
('5210','Airfare & Travel','Expense','Direct Project Costs'),
('5220','Construction Tools & Consumables','Expense','Direct Project Costs'),
('5230','Painting & Damp Proofing','Expense','Direct Project Costs'),
('5240','Temporary Works','Expense','Direct Project Costs'),
('5250','Waste Disposal','Expense','Direct Project Costs'),
-- Admin & Operating Expenses
('6000','Office Rent','Expense','Admin & Operating'),
('6010','Office Utilities','Expense','Admin & Operating'),
('6020','Internet & Communication','Expense','Admin & Operating'),
('6030','Office Stationery & Supplies','Expense','Admin & Operating'),
('6040','Cleaning & Sanitation','Expense','Admin & Operating'),
('6100','Administrative Salaries','Expense','Admin & Operating'),
('6105','Employer SSNIT Contribution - Admin Staff','Expense','Admin & Operating'),
('6110','Staff Welfare','Expense','Admin & Operating'),
('6111','Staff Incentives & Bonuses','Expense','Admin & Operating'),
('6120','Training & Professional Development','Expense','Admin & Operating'),
('6130','Recruitment Expenses','Expense','Admin & Operating'),
('6200','Professional Memberships','Expense','Admin & Operating'),
('6210','Legal & Audit Fees','Expense','Admin & Operating'),
('6220','Business Registration & Permits','Expense','Admin & Operating'),
('6300','Advertising & Marketing','Expense','Admin & Operating'),
('6310','Client Entertainment','Expense','Admin & Operating'),
('6400','Fuel & Vehicle Running','Expense','Admin & Operating'),
('6410','Vehicle Maintenance','Expense','Admin & Operating'),
('6420','Transport Allowances','Expense','Admin & Operating'),
('6430','Software & Cloud Services','Expense','Admin & Operating'),
('6440','Depreciation Expense','Expense','Admin & Operating'),
-- Finance Costs
('7000','Bank Charges','Expense','Finance Costs'),
('7010','Mobile Money Charges','Expense','Finance Costs'),
('7020','Interest on Loans','Expense','Finance Costs'),
('7030','Exchange Losses','Expense','Finance Costs'),
-- Tax Expenses
('8000','Corporate Income Tax Expense','Expense','Tax Expenses'),
('8010','Tax Penalties & Interest','Expense','Tax Expenses'),
('8020','Non-Deductible Expenses','Expense','Tax Expenses');

-- =========================================================
-- SEED: DEFAULT TAX RATES (configurable per Section 14.3 / API Contract Sec 6)
-- =========================================================

insert into tax_rate_settings (tax_type, rate) values
('VAT', 15.0),
('NHIL', 2.5),
('GETFUND', 2.5),
('SSNIT_EMPLOYEE', 5.5),
('SSNIT_EMPLOYER', 13.0);

-- =========================================================
-- INDEXES for common lookups
-- =========================================================

create index idx_journal_lines_journal on journal_lines(journal_id);
create index idx_journal_lines_account on journal_lines(account_id);
create index idx_journal_lines_project on journal_lines(project_id);
create index idx_invoices_project on invoices(project_id);
create index idx_invoices_customer on invoices(customer_id);
create index idx_expenses_project on expenses(project_id);
create index idx_expenses_supplier on expenses(supplier_id);
create index idx_payslips_run on payslips(run_id);
create index idx_audit_log_table_record on audit_log(table_name, record_id);
