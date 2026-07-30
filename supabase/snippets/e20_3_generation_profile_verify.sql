begin;
set transaction read only;
set local search_path = public, pg_catalog;

with target_tables(table_name) as (
  values
    ('landing_page_generation_profiles'::text),
    ('landing_page_generation_profile_items'::text)
), expected_columns(table_name, column_name) as (
  values
    ('landing_page_generation_profiles', 'id'),
    ('landing_page_generation_profiles', 'owner_taxon_id'),
    ('landing_page_generation_profiles', 'version'),
    ('landing_page_generation_profiles', 'status'),
    ('landing_page_generation_profiles', 'generation_guidance'),
    ('landing_page_generation_profiles', 'created_at'),
    ('landing_page_generation_profiles', 'updated_at'),
    ('landing_page_generation_profile_items', 'id'),
    ('landing_page_generation_profile_items', 'profile_id'),
    ('landing_page_generation_profile_items', 'module_key'),
    ('landing_page_generation_profile_items', 'module_version'),
    ('landing_page_generation_profile_items', 'variant_key'),
    ('landing_page_generation_profile_items', 'variant_version'),
    ('landing_page_generation_profile_items', 'priority'),
    ('landing_page_generation_profile_items', 'recommended_order'),
    ('landing_page_generation_profile_items', 'item_guidance'),
    ('landing_page_generation_profile_items', 'created_at'),
    ('landing_page_generation_profile_items', 'updated_at')
), actual_columns as (
  select table_name, column_name
  from information_schema.columns
  where table_schema = 'public'
    and table_name in (select table_name from target_tables)
), column_mismatches as (
  select
    coalesce(expected.table_name, actual.table_name) as table_name,
    coalesce(expected.column_name, actual.column_name) as column_name,
    case when expected.column_name is null then 'unexpected' else 'missing' end as mismatch
  from expected_columns expected
  full join actual_columns actual using (table_name, column_name)
  where expected.column_name is null or actual.column_name is null
), expected_constraints(table_name, constraint_name, expected_definition) as (
  values
    ('landing_page_generation_profiles', 'landing_page_generation_profiles_pkey', 'primary key (id)'),
    ('landing_page_generation_profiles', 'landing_page_generation_profiles_owner_taxon_id_fkey', 'foreign key (owner_taxon_id) references business_taxons(id) on update cascade on delete restrict'),
    ('landing_page_generation_profiles', 'landing_page_generation_profiles_version_chk', 'check ((version > 0))'),
    ('landing_page_generation_profiles', 'landing_page_generation_profiles_status_chk', 'check ((status = any (array[''draft''::text, ''active''::text, ''archived''::text])))'),
    ('landing_page_generation_profiles', 'landing_page_generation_profiles_guidance_chk', 'check (((generation_guidance is null) or (length(btrim(generation_guidance)) > 0)))'),
    ('landing_page_generation_profiles', 'landing_page_generation_profiles_owner_version_uidx', 'unique (owner_taxon_id, version)'),
    ('landing_page_generation_profile_items', 'landing_page_generation_profile_items_pkey', 'primary key (id)'),
    ('landing_page_generation_profile_items', 'landing_page_generation_profile_items_profile_id_fkey', 'foreign key (profile_id) references landing_page_generation_profiles(id) on update cascade on delete cascade'),
    ('landing_page_generation_profile_items', 'landing_page_generation_profile_items_module_key_chk', 'check ((length(btrim(module_key)) > 0))'),
    ('landing_page_generation_profile_items', 'landing_page_generation_profile_items_module_version_chk', 'check ((module_version > 0))'),
    ('landing_page_generation_profile_items', 'landing_page_generation_profile_items_variant_pair_chk', 'check (((variant_key is null) = (variant_version is null)))'),
    ('landing_page_generation_profile_items', 'landing_page_generation_profile_items_variant_key_chk', 'check (((variant_key is null) or (length(btrim(variant_key)) > 0)))'),
    ('landing_page_generation_profile_items', 'landing_page_generation_profile_items_variant_version_chk', 'check (((variant_version is null) or (variant_version > 0)))'),
    ('landing_page_generation_profile_items', 'landing_page_generation_profile_items_priority_chk', 'check ((priority = any (array[''p1''::text, ''p2''::text, ''p3''::text])))'),
    ('landing_page_generation_profile_items', 'landing_page_generation_profile_items_order_chk', 'check ((recommended_order > 0))'),
    ('landing_page_generation_profile_items', 'landing_page_generation_profile_items_guidance_chk', 'check (((item_guidance is null) or (length(btrim(item_guidance)) > 0)))'),
    ('landing_page_generation_profile_items', 'landing_page_generation_profile_items_profile_order_uidx', 'unique (profile_id, recommended_order)'),
    ('landing_page_generation_profile_items', 'landing_page_generation_profile_items_profile_module_uidx', 'unique (profile_id, module_key)')
), actual_constraints as (
  select
    target.table_name,
    constraint_row.conname as constraint_name,
    pg_get_constraintdef(constraint_row.oid) as definition
  from target_tables target
  join pg_constraint constraint_row
    on constraint_row.conrelid = to_regclass('public.' || target.table_name)
), constraint_mismatches as (
  select
    coalesce(expected.table_name, actual.table_name) as table_name,
    coalesce(expected.constraint_name, actual.constraint_name) as constraint_name,
    actual.definition,
    case
      when expected.constraint_name is null then 'unexpected'
      when actual.constraint_name is null then 'missing'
      else 'definition'
    end as mismatch
  from expected_constraints expected
  full join actual_constraints actual using (table_name, constraint_name)
  where expected.constraint_name is null
    or actual.constraint_name is null
    or lower(regexp_replace(actual.definition, '\s+', ' ', 'g')) <> expected.expected_definition
), target_roles(role_name) as (
  values ('service_role'::text), ('anon'), ('authenticated'), ('ai_readonly')
), privilege_names(privilege_name) as (
  values ('SELECT'::text), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER'), ('MAINTAIN')
), effective_privileges as (
  select
    target.table_name,
    target_role.role_name,
    privilege.privilege_name,
    to_regrole(target_role.role_name) is not null as role_exists,
    case
      when to_regrole(target_role.role_name) is null then false
      else has_table_privilege(
        target_role.role_name,
        'public.' || target.table_name,
        privilege.privilege_name
      )
    end as has_privilege
  from target_tables target
  cross join target_roles target_role
  cross join privilege_names privilege
), public_privileges as (
  select target.table_name, acl.privilege_type
  from target_tables target
  join pg_class table_row on table_row.oid = to_regclass('public.' || target.table_name)
  cross join lateral aclexplode(coalesce(table_row.relacl, acldefault('r', table_row.relowner))) acl
  where acl.grantee = 0
), privilege_mismatches as (
  select table_name, role_name, privilege_name, has_privilege
  from effective_privileges
  where role_exists
    and has_privilege <> (role_name = 'service_role' and privilege_name = 'SELECT')
  union all
  select table_name, 'PUBLIC', privilege_type, true
  from public_privileges
), checks as (
  select
    'tables_exist'::text as check_name,
    case when count(c.oid) = 2 then 'ok' else 'unexpected' end as status,
    jsonb_agg(jsonb_build_object('table', t.table_name, 'exists', c.oid is not null) order by t.table_name) as details
  from target_tables t
  left join pg_class c on c.oid = to_regclass('public.' || t.table_name)
  union all
  select
    'expected_columns',
    case when count(*) = 0 then 'ok' else 'unexpected' end,
    coalesce(jsonb_agg(to_jsonb(column_mismatches) order by table_name, column_name), '[]'::jsonb)
  from column_mismatches
  union all
  select
    'generation_guidance_nullable',
    case when is_nullable = 'YES' then 'ok' else 'unexpected' end,
    jsonb_build_object('is_nullable', is_nullable)
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'landing_page_generation_profiles'
    and column_name = 'generation_guidance'
  union all
  select
    'named_constraint_definitions',
    case when count(*) = 0 then 'ok' else 'unexpected' end,
    coalesce(jsonb_agg(to_jsonb(constraint_mismatches) order by table_name, constraint_name), '[]'::jsonb)
  from constraint_mismatches
  union all
  select
    'single_active_profile_index',
    case when count(*) = 1 then 'ok' else 'unexpected' end,
    coalesce(jsonb_agg(indexdef order by indexname), '[]'::jsonb)
  from pg_indexes
  where schemaname = 'public'
    and indexname = 'landing_page_generation_profiles_one_active_owner_idx'
    and indexdef ~* '^CREATE UNIQUE INDEX.*landing_page_generation_profiles.*owner_taxon_id.*WHERE.*status.*active'
  union all
  select
    'rls_without_policies',
    case
      when count(*) filter (where c.relrowsecurity) = 2
        and (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename in (select table_name from target_tables)) = 0
      then 'ok' else 'unexpected'
    end,
    jsonb_build_object(
      'rls_tables', count(*) filter (where c.relrowsecurity),
      'policies', (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename in (select table_name from target_tables))
    )
  from target_tables t
  join pg_class c on c.oid = to_regclass('public.' || t.table_name)
  union all
  select
    'least_privilege_grants',
    case when count(*) = 0 then 'ok' else 'unexpected' end,
    coalesce(jsonb_agg(to_jsonb(privilege_mismatches) order by table_name, role_name, privilege_name), '[]'::jsonb)
  from privilege_mismatches
  union all
  select
    'historical_rows_preserved',
    case
      when not exists (
        select 1 from public.landing_page_generation_profiles
        where generation_guidance is not null and length(btrim(generation_guidance)) = 0
      ) and not exists (
        select 1
        from public.landing_page_generation_profile_items item
        left join public.landing_page_generation_profiles profile on profile.id = item.profile_id
        where profile.id is null
      )
      then 'ok' else 'unexpected'
    end,
    jsonb_build_object(
      'profiles', (select count(*) from public.landing_page_generation_profiles),
      'items', (select count(*) from public.landing_page_generation_profile_items)
    )
)
select check_name, status, details
from checks
order by check_name;

rollback;
