-- =========================================================
-- CAREMS — LIVE DATABASE RECONSTRUCTION
-- Project: MODULO-DEVELOPMENT-LTD-SYSTEM (erinyjxrfectuepshstg)
-- Postgres 17.6.1 / Supabase, region eu-west-1
-- Generated: 2026-07-22, pulled directly from:
--   Supabase:list_tables (verbose), Supabase:list_migrations,
--   pg_constraint, pg_indexes, pg_proc, pg_policies — NOT from
--   the reference .sql files in the project, which are stale
--   (see flags at the bottom of this file).
-- This file reflects what is ACTUALLY LIVE right now. Running it
-- top-to-bottom against an empty database reproduces the current
-- schema shape (not the 63 migrations' exact incremental history —
-- see migration list in the flags section for that).
-- =========================================================

-- ============ EXTENSIONS (installed, confirmed via list_extensions) ============
create extension if not exists "uuid-ossp"   with schema extensions; -- installed_version 1.1
create extension if not exists pgcrypto      with schema extensions; -- installed_version 1.3 (gen_random_uuid source)
create extension if not exists pg_stat_statements with schema extensions; -- installed_version 1.11
create extension if not exists supabase_vault with schema vault;     -- installed_version 0.3.1
-- plpgsql is default-installed in pg_catalog, not user-added.
-- NOTE: pg_cron, pg_net, http, pgjwt etc. are AVAILABLE but NOT installed.
-- No custom "coa_code_ranges"-consuming cron job or BOG-rate fetch job exists.

-- ============ SCHEMA: api (business-logic / RPC layer — see flag #1) ============
create schema if not exists api;

-- ============ MASTER DATA ============

create table public.chart_of_accounts (
  account_id          uuid primary key default gen_random_uuid(),
  code                varchar(10) not null unique,
  name                varchar(150) not null,
  type                varchar(20) not null
                       check (type in ('Asset','Contra-Asset','Liability','Equity','Income','Expense')),
  reporting_group     varchar(100) not null,
  is_postable         boolean not null default true,
  created_at          timestamptz default now(),
  -- Addendum 2 §B columns (confirmed live):
  payment_method_type text,
  account_number      text,
  provider_name       text,
  constraint chart_of_accounts_payment_method_type_check
    check (payment_method_type in ('Cash','Bank','MoMo') or payment_method_type is null)
);

create table public.customers (
  customer_id   uuid primary key default gen_random_uuid(),
  name          varchar(200) not null,
  contact_info  jsonb,
  created_at    timestamptz default now()
);

create table public.suppliers (
  supplier_id   uuid primary key default gen_random_uuid(),
  name          varchar(200) not null,
  contact_info  jsonb,
  created_at    timestamptz default now()
);

create table public.employees (
  employee_id       uuid primary key default gen_random_uuid(),
  name              varchar(200) not null,
  role              varchar(100),
  basic_salary      numeric(14,2) default 0,
  created_at        timestamptz default now(),
  -- added in db10_payroll_schema_additions / api5 amendment:
  employment_status text not null default 'Active'
                     check (employment_status in ('Active','Terminated')),
  staff_category    text check (staff_category in ('Project','Admin') or staff_category is null)
);

create table public.users (
  user_id       uuid primary key default gen_random_uuid(),
  employee_id   uuid references public.employees(employee_id),
  email         varchar(200) not null unique,
  role          varchar(30) not null
                check (role in ('CEO','Accountant','ProjectManager','Employee','Admin')),
  created_at    timestamptz default now(),
  -- added in add_auth_user_id_to_users:
  auth_user_id  uuid unique references auth.users(id)
  -- comment on column: "Links a CAREMS user record to its Supabase Auth identity.
  -- Nullable: not every employee needs a login immediately. public.users.role
  -- remains the single authoritative source of role/authorization -- auth.uid()
  -- resolves identity only, never role."
);

-- NOTE: bank_accounts table does NOT exist — correctly removed per Addendum 2 §B.

create table public.equipment (
  equipment_id  uuid primary key default gen_random_uuid(),
  name          varchar(200) not null,
  category      varchar(100),
  status        varchar(30) default 'Available',
  created_at    timestamptz default now()
);

create table public.fixed_assets (
  asset_id              uuid primary key default gen_random_uuid(),
  name                  varchar(200) not null,
  category              varchar(100),
  cost                  numeric(14,2) not null,
  useful_life_years     int,
  depreciation_method   varchar(50) default 'Straight-Line',
  acquisition_date      date,
  coa_asset_account     uuid references public.chart_of_accounts(account_id),
  coa_accum_dep_account uuid references public.chart_of_accounts(account_id),
  status                varchar(30) default 'Active',
  created_at            timestamptz default now()
);
-- Flag: "Loss on Disposal" account was added later (add_loss_on_disposal_account
-- migration) directly into chart_of_accounts seed data, not a fixed_assets column.

create table public.tax_rate_settings (
  setting_id      uuid primary key default gen_random_uuid(),
  tax_type        varchar(30) not null
                  check (tax_type in ('VAT','NHIL','GETFUND','SSNIT_EMPLOYEE','SSNIT_EMPLOYER')),
  rate            numeric(6,3) not null,
  effective_from  date not null default current_date
);
-- Flag: 'PAYE_BAND' is NOT a valid tax_type on the live check constraint
-- (CAREMS_Schema_v1.sql reference file included it; live DB does not — correct,
-- since PAYE bands live in paye_tax_bands, per Master Plan/Addendum).

create table public.projects (
  project_id            uuid primary key default gen_random_uuid(),
  name                  varchar(200) not null,
  customer_id           uuid references public.customers(customer_id),
  contract_value        numeric(14,2) not null,
  project_manager_id    uuid references public.employees(employee_id),
  expected_completion    date,
  status                varchar(30) default 'Active',
  budget_labour         numeric(14,2) default 0,
  budget_materials      numeric(14,2) default 0,
  budget_fuel           numeric(14,2) default 0,
  budget_transport      numeric(14,2) default 0,
  budget_subcontractors numeric(14,2) default 0,
  budget_misc           numeric(14,2) default 0,
  created_at            timestamptz default now(),
  -- added in add_project_revenue_account (API-2 gap-fix, flagged to Instructor):
  revenue_account_id    uuid references public.chart_of_accounts(account_id)
  -- comment: "Which Chart of Accounts revenue account this project's completion-
  -- assessment revenue posts to. Nullable; API-2 defaults to 4200 Construction
  -- Contract Revenue if not set at project creation. Added in API-2 to resolve
  -- a gap in the original schema/contract — flagged to Instructor for sign-off."
);

-- ============ GENERAL LEDGER ============

create table public.journals (
  journal_id        uuid primary key default gen_random_uuid(),
  txn_date          date not null default current_date,
  source_type       varchar(40) not null,
  source_id         uuid,
  accounting_period varchar(7) not null,
  status            varchar(20) default 'posted'
                    check (status in ('posted','reversed')),
  reversal_of_journal_id uuid references public.journals(journal_id),
  created_at        timestamptz default now()
);

create table public.journal_lines (
  line_id      uuid primary key default gen_random_uuid(),
  journal_id   uuid not null references public.journals(journal_id) on delete cascade,
  account_id   uuid not null references public.chart_of_accounts(account_id),
  project_id   uuid references public.projects(project_id),
  debit        numeric(14,2) not null default 0,
  credit       numeric(14,2) not null default 0,
  check (debit = 0 or credit = 0),
  check (debit >= 0 and credit >= 0)
);

-- ============ SALES CYCLE ============

create table public.project_completion_assessments (
  assessment_id    uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects(project_id),
  period           varchar(7) not null,
  percent_complete numeric(5,2) not null check (percent_complete between 0 and 100),
  assessed_by      uuid references public.employees(employee_id),
  approved_by      uuid references public.employees(employee_id),
  status           varchar(20) default 'pending_approval'
                   check (status in ('pending_approval','approved','rejected')),
  journal_id       uuid references public.journals(journal_id),
  created_at       timestamptz default now()
);

create table public.invoice_number_sequences (
  year      int primary key,
  last_seq  int not null default 0
);
-- Added in add_invoice_number; backs api.next_invoice_number(), format
-- INV-{year}-{4-digit seq}, server-generated only (never from request payload).

create table public.invoices (
  invoice_id         uuid primary key default gen_random_uuid(),
  customer_id        uuid not null references public.customers(customer_id),
  project_id         uuid references public.projects(project_id),
  rental_contract_id uuid references public.rental_contracts(contract_id), -- see ordering note below
  amount             numeric(14,2) not null,
  vat                numeric(14,2) default 0,
  nhil               numeric(14,2) default 0,
  getfund            numeric(14,2) default 0,
  journal_id         uuid references public.journals(journal_id),
  status             varchar(20) default 'issued',
  created_at         timestamptz default now(),
  invoice_number     text not null unique,
  -- Addendum 2 §D multi-currency columns (confirmed live):
  currency_code      text not null default 'GHS',
  exchange_rate      numeric(14,6) not null default 1.000000,
  rate_source        text,
  functional_amount  numeric(14,2),
  functional_vat     numeric(14,2),
  functional_nhil    numeric(14,2),
  functional_getfund numeric(14,2)
);
-- NOTE ON ORDERING: rental_contracts must physically be created before invoices
-- since invoices.rental_contract_id FKs to it — reordered below vs. the
-- declaration order above, which follows the ERD narrative order instead.

create table public.invoice_lines (
  line_id      uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references public.invoices(invoice_id) on delete cascade,
  description  text not null,
  amount       numeric(14,2) not null
);

create table public.customer_payments (
  payment_id              uuid primary key default gen_random_uuid(),
  customer_id             uuid not null references public.customers(customer_id),
  invoice_id              uuid references public.invoices(invoice_id),
  settlement_account_id   uuid not null references public.chart_of_accounts(account_id), -- renamed per Addendum §B
  amount                  numeric(14,2) not null,
  journal_id              uuid references public.journals(journal_id),
  payment_date            date not null default current_date,
  settlement_exchange_rate numeric(14,6),
  rate_source             text
);

-- ============ EXPENSE / COSTING CYCLE ============

create table public.expenses (
  expense_id            uuid primary key default gen_random_uuid(),
  supplier_id           uuid not null references public.suppliers(supplier_id),
  project_id            uuid references public.projects(project_id),
  coa_account           uuid not null references public.chart_of_accounts(account_id),
  amount                numeric(14,2) not null,
  vat_input             numeric(14,2) default 0,
  journal_id            uuid references public.journals(journal_id),
  status                varchar(20) default 'recorded',
  budget_flag           boolean default false,
  created_at            timestamptz default now(),
  currency_code         text not null default 'GHS',
  exchange_rate         numeric(14,6) not null default 1.000000,
  rate_source           text,
  functional_amount     numeric(14,2),
  functional_vat_input  numeric(14,2)
);

create table public.supplier_payments (
  payment_id               uuid primary key default gen_random_uuid(),
  supplier_id              uuid not null references public.suppliers(supplier_id),
  expense_id               uuid references public.expenses(expense_id),
  settlement_account_id    uuid not null references public.chart_of_accounts(account_id), -- renamed per Addendum §B
  amount                   numeric(14,2) not null,
  journal_id               uuid references public.journals(journal_id),
  payment_date             date not null default current_date,
  settlement_exchange_rate numeric(14,6),
  rate_source              text
);

-- ============ EQUIPMENT RENTAL ============
-- (declared here, but must be created before `invoices` above in execution order)

create table public.rental_contracts (
  contract_id  uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(equipment_id),
  customer_id  uuid not null references public.customers(customer_id),
  project_id   uuid references public.projects(project_id),
  start_date   date not null,
  end_date     date,
  rate         numeric(14,2) not null,
  created_at   timestamptz default now()
);

-- ============ PAYROLL ============

create table public.payroll_runs (
  run_id      uuid primary key default gen_random_uuid(),
  period      varchar(7) not null,
  status      varchar(20) default 'draft'
              check (status in ('draft','approved','paid','rejected')), -- 'rejected' added, not in original schema
  journal_id  uuid references public.journals(journal_id),
  created_at  timestamptz default now()
);

create table public.payslips (
  payslip_id       uuid primary key default gen_random_uuid(),
  run_id           uuid not null references public.payroll_runs(run_id) on delete cascade,
  employee_id      uuid not null references public.employees(employee_id),
  gross_salary     numeric(14,2) not null,
  paye             numeric(14,2) default 0,
  ssnit_employee   numeric(14,2) default 0,
  ssnit_employer   numeric(14,2) default 0,
  other_deductions numeric(14,2) default 0,
  net_salary       numeric(14,2) not null
);

-- ============ AUDIT ============

create table public.audit_log (
  log_id      uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(user_id),
  table_name  varchar(60) not null,
  record_id   uuid,
  action      varchar(20) not null check (action in ('INSERT','UPDATE','DELETE')),
  old_value   jsonb,
  new_value   jsonb,
  "timestamp" timestamptz default now()
);

-- ============ PAYE BANDS ============

create table public.paye_tax_bands (
  band_id        uuid primary key default gen_random_uuid(),
  lower_bound    numeric(14,2) not null,
  upper_bound    numeric(14,2),
  rate           numeric(5,2) not null,
  effective_from date not null default current_date
);

-- ============ ADDENDUM 2 TABLES (confirmed live) ============

create table public.coa_code_ranges (
  reporting_group text primary key,
  range_start     int not null,
  range_end       int not null,
  increment       int not null default 10,
  check (range_start <= range_end)
);

create table public.daily_exchange_rates (
  rate_id       uuid primary key default gen_random_uuid(),
  currency_code text not null,
  rate_date     date not null,
  rate_to_ghs   numeric(14,6) not null,
  source        text not null check (source in ('BOG','MANUAL')),
  entered_by    uuid references public.employees(employee_id),
  unique (currency_code, rate_date)
);
-- Comment on table (live): "Schema only, per DB-5 — no BOG rate-fetching
-- integration built or assumed. UNIQUE(currency_code, rate_date) added as a
-- reasonable safeguard against duplicate same-day rate entries, not explicitly
-- requested in the ticket." Table has 0 rows — correctly left unseeded.

-- =========================================================
-- INDEXES — as actually live (pg_indexes), NOT as DB-3 specified
-- =========================================================
-- DB-3 asked for ONE composite index: journal_lines(journal_id, account_id, project_id).
-- What's live is THREE separate single-column indexes instead — see Flag #2.
create index idx_journal_lines_journal_id  on public.journal_lines(journal_id);
create index idx_journal_lines_account_id  on public.journal_lines(account_id);
create index idx_journal_lines_project_id  on public.journal_lines(project_id);

create index idx_invoices_project_id   on public.invoices(project_id);
create index idx_invoices_customer_id  on public.invoices(customer_id);

create index idx_expenses_project_id   on public.expenses(project_id);
create index idx_expenses_supplier_id  on public.expenses(supplier_id);

create index idx_payslips_run_id       on public.payslips(run_id);

create index idx_audit_log_table_record on public.audit_log(table_name, record_id);

create index idx_paye_bands_effective   on public.paye_tax_bands(effective_from);

-- (all primary keys and UNIQUE constraints above auto-create their own indexes:
--  chart_of_accounts.code, invoices.invoice_number, users.email, users.auth_user_id,
--  daily_exchange_rates(currency_code, rate_date))

-- =========================================================
-- SEED DATA — actual live values (not the reference files' illustrative ones)
-- =========================================================

-- chart_of_accounts: 118 rows live (Chart_of_Accounts.md documents 114 named
-- accounts + 4430 Exchange Gain [Addendum D] + 1121/1122 MoMo splits replacing
-- the single 1120 + Loss on Disposal account = accounts for the extra rows).
-- Full 118-row INSERT omitted here for brevity — confirmed present and intact,
-- including 1145, 2135, 2205, 2206, 5005, 6105, 6111, 6440, 4430 corrections.
-- Payment-method-flagged rows (confirmed exact):
insert into public.chart_of_accounts (code, name, type, reporting_group, payment_method_type, provider_name) values
('1100','Cash on Hand','Asset','Current Assets','Cash',null),
('1111','Ecobank','Asset','Current Assets','Bank','Ecobank'),
('1112','Fidelity Bank','Asset','Current Assets','Bank','Fidelity Bank'),
('1113','GCB Bank','Asset','Current Assets','Bank','GCB Bank'),
('1114','Stanbic Bank','Asset','Current Assets','Bank','Stanbic Bank'),
('1120','MTN Mobile Money','Asset','Current Assets','MoMo','MTN Mobile Money'),
('1121','Vodafone Cash','Asset','Current Assets','MoMo','Vodafone Cash'),
('1122','AirtelTigo Money','Asset','Current Assets','MoMo','AirtelTigo Money')
on conflict (code) do nothing;

-- tax_rate_settings — confirmed live values, effective_from 2026-07-19:
insert into public.tax_rate_settings (tax_type, rate, effective_from) values
('VAT', 15.0, '2026-07-19'),
('NHIL', 2.5, '2026-07-19'),
('GETFUND', 2.5, '2026-07-19'),
('SSNIT_EMPLOYEE', 5.5, '2026-07-19'),
('SSNIT_EMPLOYER', 13.0, '2026-07-19');

-- coa_code_ranges — confirmed live, matches Addendum 2 §A exactly:
insert into public.coa_code_ranges (reporting_group, range_start, range_end, increment) values
('Current Assets', 1100, 1199, 10),
('Fixed Assets', 1200, 1289, 10),
('Accumulated Depreciation', 1290, 1299, 10),
('Current Liabilities', 2100, 2199, 10),
('Tax Liabilities', 2200, 2299, 10),
('Borrowings', 2300, 2399, 10),
('Equity', 3000, 3099, 10),
('Revenue', 4100, 4499, 10),
('Direct Project Costs', 5000, 5299, 10),
('Admin & Operating', 6000, 6499, 10),
('Finance Costs', 7000, 7099, 10),
('Tax Expenses', 8000, 8099, 10);

-- paye_tax_bands — confirmed live values. *** SEE FLAG #3 — THESE ARE WRONG ***
insert into public.paye_tax_bands (lower_bound, upper_bound, rate, effective_from) values
(0.00,       490.00,    0.00,  '2024-01-01'),
(490.01,     600.00,    5.00,  '2024-01-01'),
(600.01,     730.00,    10.00, '2024-01-01'),
(730.01,     3896.67,   17.50, '2024-01-01'),
(3896.68,    19896.67,  25.00, '2024-01-01'),
(19896.68,   50416.67,  30.00, '2024-01-01'),
(50416.68,   null,      35.00, '2024-01-01');

-- =========================================================
-- Row-Level Security — CONFIRMED LIVE STATUS: DISABLED on every table.
-- pg_policies count for schema `public` = 0.
-- =========================================================
-- No RLS statements included/run here — see Flag #4. DO NOT blindly enable
-- RLS without policies; that will lock out the api.* functions entirely.
