with expected(signature) as (
  values
    ('save_landing_page_generation_profile_draft(uuid,uuid,timestamp with time zone,text,jsonb,text,uuid,text)'),
    ('activate_landing_page_generation_profile(uuid,timestamp with time zone)'),
    ('archive_landing_page_generation_profile(uuid,timestamp with time zone)'),
    ('get_landing_page_generation_profile_lifecycle_status()')
), actual as (
  select
    p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as signature,
    p.prosecdef,
    p.proconfig
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'save_landing_page_generation_profile_draft',
      'activate_landing_page_generation_profile',
      'archive_landing_page_generation_profile',
      'get_landing_page_generation_profile_lifecycle_status'
    )
)
select
  expected.signature,
  actual.signature is not null as exists,
  coalesce(actual.prosecdef, false) as security_definer,
  coalesce(actual.proconfig @> array['search_path=public, pg_temp'], false) as fixed_search_path
from expected
left join actual using (signature)
order by expected.signature;

select
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where specific_schema = 'public'
  and routine_name in (
    'save_landing_page_generation_profile_draft',
    'activate_landing_page_generation_profile',
    'archive_landing_page_generation_profile',
    'get_landing_page_generation_profile_lifecycle_status'
  )
order by routine_name, grantee, privilege_type;

select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'landing_page_generation_profiles',
    'landing_page_generation_profile_items'
  )
order by table_name, grantee, privilege_type;

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  count(p.policyname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
left join pg_policies p on p.schemaname = n.nspname and p.tablename = c.relname
where c.relname in (
  'landing_page_generation_profiles',
  'landing_page_generation_profile_items'
)
group by c.relname, c.relrowsecurity
order by c.relname;

select
  to_regprocedure('public.audit_context_event(text,text,uuid,jsonb,uuid)') is not null as audit_function_available,
  to_regclass('public.landing_page_generation_profiles') is not null as profiles_available,
  to_regclass('public.landing_page_generation_profile_items') is not null as items_available;
