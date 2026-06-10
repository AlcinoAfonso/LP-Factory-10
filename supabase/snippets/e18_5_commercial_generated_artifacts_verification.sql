select
  table_name,
  pg_class.relrowsecurity as row_security
from information_schema.tables
join pg_class
  on pg_class.relname = information_schema.tables.table_name
join pg_namespace
  on pg_namespace.oid = pg_class.relnamespace
 and pg_namespace.nspname = information_schema.tables.table_schema
where table_schema = 'public'
  and table_name = 'commercial_generated_artifacts'
limit 50
---
select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'commercial_generated_artifacts'
  and grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role', 'ai_readonly')
order by grantee, privilege_type
limit 50
---
select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'commercial_generated_artifacts'
order by indexname
limit 50
---
select
  routine_name,
  routine_type,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'create_commercial_generated_artifact_draft',
    'activate_commercial_generated_artifact'
  )
order by routine_name
limit 50
