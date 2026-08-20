with contract as (
  select
    pg_get_constraintdef(constraint_row.oid) as status_check,
    (
      select pg_get_expr(attribute.adbin, attribute.adrelid)
      from pg_attrdef attribute
      join pg_attribute column_row
        on column_row.attrelid = attribute.adrelid
        and column_row.attnum = attribute.adnum
      where attribute.adrelid = 'public.account_landing_pages'::regclass
        and column_row.attname = 'status'
    ) as status_default,
    pg_get_functiondef(
      'public.append_account_landing_page_materialization_v1(uuid,uuid,uuid,jsonb,jsonb,uuid)'::regprocedure
    ) as append_definition
  from pg_constraint constraint_row
  where constraint_row.conrelid = 'public.account_landing_pages'::regclass
    and constraint_row.conname = 'account_landing_pages_status_chk'
),
checks as (
  select
    'status_contract'::text as check_name,
    case when
      status_check ilike '%draft%'
      and status_check ilike '%active%'
      and status_check ilike '%archived%'
      and status_default = '''draft''::text'
    then 'ok' else 'mismatch' end as status,
    jsonb_build_object(
      'constraint', status_check,
      'default', status_default
    ) as details
  from contract

  union all

  select
    'persisted_statuses',
    case when count(*) filter (
      where status not in ('draft', 'active', 'archived')
    ) = 0 then 'ok' else 'invalid_row' end,
    jsonb_build_object(
      'rows', count(*),
      'draft', count(*) filter (where status = 'draft'),
      'active', count(*) filter (where status = 'active'),
      'archived', count(*) filter (where status = 'archived'),
      'invalid', count(*) filter (
        where status not in ('draft', 'active', 'archived')
      )
    )
  from public.account_landing_pages

  union all

  select
    'append_compatibility',
    case when
      append_definition ~* 'status[[:space:]]+in[[:space:]]*\(''draft'',[[:space:]]*''active''\)'
      and has_function_privilege(
        'service_role',
        'public.append_account_landing_page_materialization_v1(uuid,uuid,uuid,jsonb,jsonb,uuid)',
        'EXECUTE'
      )
      and not has_function_privilege(
        'anon',
        'public.append_account_landing_page_materialization_v1(uuid,uuid,uuid,jsonb,jsonb,uuid)',
        'EXECUTE'
      )
      and not has_function_privilege(
        'authenticated',
        'public.append_account_landing_page_materialization_v1(uuid,uuid,uuid,jsonb,jsonb,uuid)',
        'EXECUTE'
      )
    then 'ok' else 'mismatch' end,
    jsonb_build_object(
      'accepts_draft_and_active',
        append_definition ~* 'status[[:space:]]+in[[:space:]]*\(''draft'',[[:space:]]*''active''\)',
      'service_role_execute', has_function_privilege(
        'service_role',
        'public.append_account_landing_page_materialization_v1(uuid,uuid,uuid,jsonb,jsonb,uuid)',
        'EXECUTE'
      ),
      'authenticated_execute', has_function_privilege(
        'authenticated',
        'public.append_account_landing_page_materialization_v1(uuid,uuid,uuid,jsonb,jsonb,uuid)',
        'EXECUTE'
      )
    )
  from contract
)
select check_name, status, details
from checks
order by check_name;
