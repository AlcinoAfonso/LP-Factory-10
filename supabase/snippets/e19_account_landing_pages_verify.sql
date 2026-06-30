with checks as (
  select
    'table_exists'::text as check_name,
    case when to_regclass('public.account_landing_pages') is not null then 'ok' else 'missing' end as status,
    jsonb_build_object('regclass', to_regclass('public.account_landing_pages')::text) as details
  union all
  select
    'rls_enabled'::text,
    case when c.relrowsecurity then 'ok' else 'missing' end,
    jsonb_build_object('relrowsecurity', c.relrowsecurity)
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'account_landing_pages'
  union all
  select
    'constraints'::text,
    case
      when count(*) filter (
        where conname in (
          'account_landing_pages_pkey',
          'account_landing_pages_account_id_fkey',
          'account_landing_pages_created_by_fkey',
          'account_landing_pages_status_chk',
          'account_landing_pages_slug_chk',
          'account_landing_pages_name_chk',
          'account_landing_pages_account_slug_uidx'
        )
      ) = 7 then 'ok'
      else 'missing'
    end,
    jsonb_agg(conname order by conname)
  from pg_constraint
  where conrelid = to_regclass('public.account_landing_pages')
  union all
  select
    'indexes'::text,
    case
      when count(*) filter (
        where indexname in (
          'account_landing_pages_pkey',
          'account_landing_pages_account_slug_uidx',
          'account_landing_pages_account_id_idx',
          'account_landing_pages_created_by_idx',
          'account_landing_pages_status_idx'
        )
      ) = 5 then 'ok'
      else 'missing'
    end,
    jsonb_agg(indexname order by indexname)
  from pg_indexes
  where schemaname = 'public'
    and tablename = 'account_landing_pages'
  union all
  select
    'policies'::text,
    case
      when count(*) filter (
        where policyname in (
          'account_landing_pages_select_member_or_platform',
          'account_landing_pages_insert_owner_admin_or_platform'
        )
      ) = 2 then 'ok'
      else 'missing'
    end,
    jsonb_agg(
      jsonb_build_object(
        'policyname', policyname,
        'cmd', cmd,
        'roles', roles
      )
      order by policyname
    )
  from pg_policies
  where schemaname = 'public'
    and tablename = 'account_landing_pages'
  union all
  select
    'grants'::text,
    case
      when count(*) filter (
        where grantee = 'authenticated'
          and privilege_type in ('SELECT', 'INSERT')
      ) = 2
      and count(*) filter (
        where grantee = 'service_role'
          and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
      ) = 4
      and count(*) filter (
        where lower(grantee) in ('anon', 'public')
      ) = 0 then 'ok'
      else 'missing'
    end,
    jsonb_agg(
      jsonb_build_object(
        'grantee', grantee,
        'privilege_type', privilege_type
      )
      order by grantee, privilege_type
    )
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'account_landing_pages'
  union all
  select
    'updated_at_trigger'::text,
    case
      when count(*) filter (
        where trigger_name = 'account_landing_pages_set_updated_at'
          and event_manipulation = 'UPDATE'
          and action_statement ilike '%tg_set_updated_at%'
      ) = 1 then 'ok'
      else 'missing'
    end,
    jsonb_agg(
      jsonb_build_object(
        'trigger_name', trigger_name,
        'event_manipulation', event_manipulation,
        'action_statement', action_statement
      )
    )
  from information_schema.triggers
  where event_object_schema = 'public'
    and event_object_table = 'account_landing_pages'
  union all
  select
    'columns'::text,
    case
      when count(*) filter (
        where column_name in (
          'id',
          'account_id',
          'name',
          'slug',
          'status',
          'created_by',
          'created_at',
          'updated_at'
        )
      ) = 8 then 'ok'
      else 'missing'
    end,
    jsonb_agg(
      jsonb_build_object(
        'column_name', column_name,
        'data_type', data_type,
        'is_nullable', is_nullable,
        'column_default', column_default
      )
      order by ordinal_position
    )
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'account_landing_pages'
)
select check_name, status, details
from checks
order by check_name
