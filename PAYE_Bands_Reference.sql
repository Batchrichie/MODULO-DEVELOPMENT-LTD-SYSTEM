-- =========================================================
-- REFERENCE ONLY — NOT FOR DIRECT USE
-- PAYE graduated tax bands: table structure + EXAMPLE seed values
-- Companion to CAREMS_Schema_v1.sql (also reference-only)
--
-- ⚠ WARNING: the rate/threshold VALUES below are illustrative,
-- not verified current figures. A web check while drafting this
-- turned up conflicting numbers across sources (annual tax-free
-- threshold cited as anywhere from GHS 4,380 to GHS 5,880,
-- apparently due to a revision around April 2026). The Database
-- Expert must pull the exact current schedule from gra.gov.gh
-- before seeding this table for real. Do not deploy these numbers.
-- =========================================================

create table paye_tax_bands (
  band_id        uuid primary key default gen_random_uuid(),
  lower_bound    numeric(14,2) not null,        -- annual chargeable income, GHS
  upper_bound    numeric(14,2),                 -- null = open-ended top band
  rate           numeric(5,2) not null,          -- percent, e.g. 17.5
  effective_from date not null default current_date
);

create index idx_paye_bands_effective on paye_tax_bands(effective_from);

-- EXAMPLE seed only — replace with verified GRA figures before use.
-- Structure shown: 7 graduated annual bands, 0% to 35%.
insert into paye_tax_bands (lower_bound, upper_bound, rate, effective_from) values
(0,          5880,       0.0,  '2026-01-01'),
(5880.01,    7200,       5.0,  '2026-01-01'),
(7200.01,    8760,       10.0, '2026-01-01'),
(8760.01,    46760,      17.5, '2026-01-01'),
(46760.01,   238760,     25.0, '2026-01-01'),
(238760.01,  605000,     30.0, '2026-01-01'),
(605000.01,  null,       35.0, '2026-01-01');

-- =========================================================
-- Calculation note for the Backend/API Expert (API-5):
-- Ghana PAYE is withheld monthly but computed on a cumulative
-- annual basis: each month, sum year-to-date chargeable income,
-- apply these annual bands progressively, subtract tax already
-- withheld year-to-date, and withhold the difference this month.
-- A simplified flat monthly-band approach (annual bounds / 12,
-- applied fresh each month with no YTD carry-forward) is easier
-- to build but not strictly correct for employees with irregular
-- pay (bonuses, mid-year raises). Confirm with the Instructor
-- which method Phase One will implement before building API-5 —
-- this wasn't decided in the Master Plan and matters for accuracy.
-- =========================================================
