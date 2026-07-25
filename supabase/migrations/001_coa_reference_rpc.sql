-- RPC: api.coa_reference_data()
-- Returns all reference/lookup rows needed to render the "New account" form
-- without hardcoding: reporting groups (with code ranges), allowed account
-- types, and allowed payment-method values (matching the DB CHECK constraint).
--
-- Envelope:  api.ok()  =>  { success: true,  data: { reporting_groups, account_types, payment_methods }, error: null }
--            api.err() =>  { success: false, data: null,                       error: { code, message } }

create or replace function api.coa_reference_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_reporting_groups jsonb;
  v_account_types    jsonb;
  v_payment_methods  jsonb;
begin
  -- 1) Reporting groups + their numeric code ranges.
  --    coa_code_ranges PK is reporting_group so sort alphabetically by it.
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'reporting_group', r.reporting_group,
      'range_start',     r.range_start,
      'range_end',       r.range_end,
      'increment',       r.increment
    )
    order by r.reporting_group
  ), '[]'::jsonb)
  into v_reporting_groups
  from public.coa_code_ranges r;

  -- 2) Allowed account types — matches the chart_of_accounts.type CHECK.
  v_account_types := jsonb_build_array(
    'Asset',
    'Contra-Asset',
    'Liability',
    'Equity',
    'Income',
    'Expense'
  );

  -- 3) Allowed payment methods — matches the chart_of_accounts.payment_method_type CHECK.
  --    Note: We intentionally expose ONLY the canonical DB-stored values.
  --    UI-level display labels (e.g. "Mobile Money" for the DB value "MoMo")
  --    are owned by the frontend — this endpoint is the single source of
  --    truth for what is actually persistable.
  v_payment_methods := jsonb_build_array(
    'Cash',
    'Bank',
    'MoMo'
  );

  return api.ok(jsonb_build_object(
    'reporting_groups', v_reporting_groups,
    'account_types',    v_account_types,
    'payment_methods',  v_payment_methods
  ));
exception
  when others then
    return api.err('COA_REF_FETCH_FAILED', sqlerrm);
end;
$$;

grant execute on function api.coa_reference_data() to anon, authenticated;
