-- =========================================================
-- REFERENCE ONLY — NOT FOR DIRECT USE
-- PAYE graduated tax bands: table structure + EXAMPLE seed values
-- Companion to CAREMS_Schema_v1.sql (also reference-only)
--
-- METHOD DECIDED (resolves prior conflict with Master Plan API-5):
-- Phase One uses FLAT MONTHLY bands — no year-to-date carry-forward.
-- Each month's chargeable income is taxed fresh against these MONTHLY
-- thresholds. This is simpler and consistent with every other Phase
-- One design choice, but is a known simplification: it under/over-
-- withholds slightly for employees with bonuses or mid-year raises,
-- since it doesn't smooth income across the year. True YTD-cumulative
-- withholding is deferred to Phase Two if this limitation matters
-- in practice.
--
-- ⚠ WARNING: the rate/threshold VALUES below are illustrative,
-- not verified current figures. A web check while drafting this
-- turned up conflicting numbers across sources (apparently due to
-- a revision around April 2026), and are shown here as ANNUAL
-- figures divided by 12 for illustration only. The Database Expert
-- must pull the exact current MONTHLY (or annual, then divide by 12)
-- schedule from gra.gov.gh before seeding this table for real.
-- Do not deploy these numbers.
-- =========================================================

create table paye_tax_bands (
  band_id        uuid primary key default gen_random_uuid(),
  lower_bound    numeric(14,2) not null,        -- MONTHLY chargeable income, GHS
  upper_bound    numeric(14,2),                 -- null = open-ended top band
  rate           numeric(5,2) not null,          -- percent, e.g. 17.5
  effective_from date not null default current_date
);

create index idx_paye_bands_effective on paye_tax_bands(effective_from);

-- EXAMPLE seed only — replace with verified GRA figures before use.
-- Structure shown: 7 graduated MONTHLY bands, 0% to 35% (illustrative annual/12).
insert into paye_tax_bands (lower_bound, upper_bound, rate, effective_from) values
(0,        490.00,    0.0,  '2026-01-01'),
(490.01,   600.00,    5.0,  '2026-01-01'),
(600.01,   730.00,    10.0, '2026-01-01'),
(730.01,   3896.67,   17.5, '2026-01-01'),
(3896.68,  19896.67,  25.0, '2026-01-01'),
(19896.68, 50416.67,  30.0, '2026-01-01'),
(50416.68, null,      35.0, '2026-01-01');

-- =========================================================
-- RESOLVED: Phase One uses flat-monthly bands (see header note
-- above). API-5 should implement standard progressive-bracket
-- math against a single month's chargeable income only — no
-- year-to-date tracking, no carry-forward between months.
-- =========================================================
