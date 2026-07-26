create or replace function api.list_rental_contracts()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_guard jsonb;
  v_rows jsonb;
begin
  v_guard := api.require_role(ARRAY['Accountant']);
  IF v_guard IS NOT NULL THEN RETURN v_guard; END IF;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'contract_id', rc.contract_id,
        'equipment_id', rc.equipment_id,
        'customer_id', rc.customer_id,
        'project_id', rc.project_id,
        'start_date', rc.start_date,
        'end_date', rc.end_date,
        'rate', rc.rate,
        'created_at', rc.created_at
      )
      order by rc.created_at desc, rc.contract_id
    ), '[]'::jsonb
  )
  into v_rows
  from public.rental_contracts rc;

  return api.ok(v_rows);
exception
  when others then
    return api.err('RENTAL_CONTRACTS_FETCH_FAILED', sqlerrm);
end;
$$;

grant execute on function api.list_rental_contracts() to authenticated;
