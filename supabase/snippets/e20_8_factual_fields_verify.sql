-- E20.8: verificação estritamente read-only da autoridade factual corrente.
with table_columns as (
  select a.attnum, a.attname, format_type(a.atttypid, a.atttypmod) as data_type,
    a.attnotnull, pg_get_expr(d.adbin, d.adrelid) as default_expression
  from pg_attribute a
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where a.attrelid = 'public.taxon_factual_fields'::regclass and a.attnum > 0 and not a.attisdropped
), checks as (
  select
    to_regclass('public.taxon_factual_fields') is not null as table_exists,
    to_regclass('public.landing_page_input_catalog_drafts') is null as draft_removed,
    not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'business_taxons' and column_name = 'reviewed_input_catalog_version'
    ) as review_marker_removed,
    (select count(*) = 25 from public.taxon_factual_fields) as seed_count,
    (select count(*) filter (where taxon_id is null) = 16 from public.taxon_factual_fields) as universal_count,
    (select count(*) filter (where taxon_id = 'f9ba36cd-fcd9-478b-9823-c2f003cf037a'::uuid) = 4 from public.taxon_factual_fields) as segment_count,
    (select count(*) filter (where taxon_id = 'c7952d16-678c-4615-9483-a003e57d94aa'::uuid) = 5 from public.taxon_factual_fields) as niche_count,
    not exists (select 1 from public.taxon_factual_fields where taxon_id is not null and taxon_id not in ('f9ba36cd-fcd9-478b-9823-c2f003cf037a'::uuid, 'c7952d16-678c-4615-9483-a003e57d94aa'::uuid)) as no_ultra_residency,
    not exists (
      select 1 from public.taxon_factual_fields
      where definition ?| array['allowedPlans','version','evidence','originLayer','retiredInVersion']
    ) as no_legacy_properties,
    (select relrowsecurity from pg_class where oid = 'public.taxon_factual_fields'::regclass) as rls_enabled,
    not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'taxon_factual_fields') as no_public_policies,
    has_table_privilege('service_role', 'public.taxon_factual_fields', 'select,insert,update') as service_role_allowed,
    not has_table_privilege('service_role', 'public.taxon_factual_fields', 'delete') and not has_table_privilege('service_role', 'public.taxon_factual_fields', 'truncate') as service_role_destructive_denied,
    not has_table_privilege('authenticated', 'public.taxon_factual_fields', 'select,insert,update,delete') as authenticated_denied,
    not has_table_privilege('anon', 'public.taxon_factual_fields', 'select,insert,update,delete') as anon_denied,
    not has_table_privilege('ai_readonly', 'public.taxon_factual_fields', 'select,insert,update,delete') as ai_readonly_denied,
    not exists (
      select 1 from pg_class c, lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) a
      where c.oid = 'public.taxon_factual_fields'::regclass and a.grantee = 0
        and a.privilege_type in ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE')
    ) as public_denied,
    (select array_agg(attname::text order by attnum) = array['id','field_key','taxon_id','definition','is_active','created_by','updated_by','created_at','updated_at']
      and bool_and(case attname
        when 'id' then data_type = 'uuid' and attnotnull and default_expression = 'gen_random_uuid()'
        when 'field_key' then data_type = 'text' and attnotnull and default_expression is null
        when 'taxon_id' then data_type = 'uuid' and not attnotnull and default_expression is null
        when 'definition' then data_type = 'jsonb' and attnotnull and default_expression is null
        when 'is_active' then data_type = 'boolean' and attnotnull and default_expression = 'true'
        when 'created_by' then data_type = 'uuid' and not attnotnull and default_expression is null
        when 'updated_by' then data_type = 'uuid' and not attnotnull and default_expression is null
        when 'created_at' then data_type = 'timestamp with time zone' and attnotnull and default_expression = 'now()'
        when 'updated_at' then data_type = 'timestamp with time zone' and attnotnull and default_expression = 'now()'
        else false end)
      from table_columns) as columns_exact,
    exists (select 1 from pg_constraint where conrelid = 'public.taxon_factual_fields'::regclass and conname = 'taxon_factual_fields_pkey' and contype = 'p' and pg_get_constraintdef(oid) = 'PRIMARY KEY (id)') as primary_key_present,
    exists (select 1 from pg_constraint where conrelid = 'public.taxon_factual_fields'::regclass and conname = 'taxon_factual_fields_field_key_key' and contype = 'u' and pg_get_constraintdef(oid) = 'UNIQUE (field_key)') as field_key_unique,
    exists (select 1 from pg_constraint where conrelid = 'public.taxon_factual_fields'::regclass and conname = 'taxon_factual_fields_field_key_chk' and contype = 'c' and pg_get_constraintdef(oid) like '%field_key ~ ''^[a-z][a-z0-9_]*$''%') as field_key_format_constraint,
    (select count(*) = 7 from pg_constraint where conrelid = 'public.taxon_factual_fields'::regclass and contype = 'c')
      and (select count(*) = 5 from pg_constraint
        where conrelid = 'public.taxon_factual_fields'::regclass and contype = 'c'
          and conname in (
            'taxon_factual_fields_definition_object_chk',
            'taxon_factual_fields_definition_keys_chk',
            'taxon_factual_fields_definition_values_chk',
            'taxon_factual_fields_definition_validation_chk',
            'taxon_factual_fields_definition_conditions_chk'
          )
          and obj_description(oid, 'pg_constraint') = 'E20.8_CANONICAL_PREDICATE_MD5:' || md5(conbin::text)
      ) as auxiliary_definition_constraints,
    (select count(*) = 3 from pg_constraint where conrelid = 'public.taxon_factual_fields'::regclass and contype = 'f')
      and exists (select 1 from pg_constraint c join pg_attribute source on source.attrelid = c.conrelid and source.attnum = c.conkey[1] join pg_attribute target on target.attrelid = c.confrelid and target.attnum = c.confkey[1] where c.conrelid = 'public.taxon_factual_fields'::regclass and c.contype = 'f' and array_length(c.conkey, 1) = 1 and source.attname = 'taxon_id' and c.confrelid = 'public.business_taxons'::regclass and target.attname = 'id' and c.confupdtype = 'c' and c.confdeltype = 'r')
      and exists (select 1 from pg_constraint c join pg_attribute source on source.attrelid = c.conrelid and source.attnum = c.conkey[1] join pg_attribute target on target.attrelid = c.confrelid and target.attnum = c.confkey[1] where c.conrelid = 'public.taxon_factual_fields'::regclass and c.contype = 'f' and array_length(c.conkey, 1) = 1 and source.attname = 'created_by' and c.confrelid = 'auth.users'::regclass and target.attname = 'id' and c.confupdtype = 'c' and c.confdeltype = 'n')
      and exists (select 1 from pg_constraint c join pg_attribute source on source.attrelid = c.conrelid and source.attnum = c.conkey[1] join pg_attribute target on target.attrelid = c.confrelid and target.attnum = c.confkey[1] where c.conrelid = 'public.taxon_factual_fields'::regclass and c.contype = 'f' and array_length(c.conkey, 1) = 1 and source.attname = 'updated_by' and c.confrelid = 'auth.users'::regclass and target.attname = 'id' and c.confupdtype = 'c' and c.confdeltype = 'n') as foreign_keys_exact,
    exists (select 1 from pg_index i join pg_class idx on idx.oid = i.indexrelid where i.indrelid = 'public.taxon_factual_fields'::regclass and idx.relname = 'taxon_factual_fields_taxon_id_idx' and not i.indisunique and i.indnkeyatts = 2 and pg_get_indexdef(i.indexrelid, 1, true) = 'taxon_id' and pg_get_indexdef(i.indexrelid, 2, true) = 'field_key' and i.indpred is null)
      and exists (select 1 from pg_index i join pg_class idx on idx.oid = i.indexrelid where i.indrelid = 'public.taxon_factual_fields'::regclass and idx.relname = 'taxon_factual_fields_created_by_idx' and not i.indisunique and i.indnkeyatts = 1 and pg_get_indexdef(i.indexrelid, 1, true) = 'created_by' and regexp_replace(pg_get_expr(i.indpred, i.indrelid), '[()]', '', 'g') = 'created_by IS NOT NULL')
      and exists (select 1 from pg_index i join pg_class idx on idx.oid = i.indexrelid where i.indrelid = 'public.taxon_factual_fields'::regclass and idx.relname = 'taxon_factual_fields_updated_by_idx' and not i.indisunique and i.indnkeyatts = 1 and pg_get_indexdef(i.indexrelid, 1, true) = 'updated_by' and regexp_replace(pg_get_expr(i.indpred, i.indrelid), '[()]', '', 'g') = 'updated_by IS NOT NULL') as indexes_exact,
    exists (select 1 from pg_constraint where conrelid = 'public.taxon_factual_fields'::regclass and conname = 'taxon_factual_fields_definition_strict_chk' and pg_get_constraintdef(oid) like '%e20_8_factual_field_definition_is_valid%') as strict_definition_constraint,
    to_regprocedure('public.e20_8_factual_field_definition_is_valid(jsonb)') is not null as strict_definition_function,
    has_function_privilege('service_role', 'public.e20_8_factual_field_definition_is_valid(jsonb)', 'execute')
      and not has_function_privilege('authenticated', 'public.e20_8_factual_field_definition_is_valid(jsonb)', 'execute')
      and not has_function_privilege('anon', 'public.e20_8_factual_field_definition_is_valid(jsonb)', 'execute')
      and not has_function_privilege('ai_readonly', 'public.e20_8_factual_field_definition_is_valid(jsonb)', 'execute') as strict_function_grants,
    not exists (select 1 from public.openai_workload_operational_configurations where workload = 'landing_page_dynamic_market_research') as retired_unit_removed,
    (select count(*) >= 2 from public.openai_workload_configuration_revisions where workload = 'landing_page_dynamic_market_research') as retired_revisions_preserved,
    (select count(*) >= 2 from public.openai_workload_configuration_activations where workload = 'landing_page_dynamic_market_research') as retired_activations_preserved,
    exists (
      select 1 from pg_trigger
      where tgrelid = 'public.taxon_factual_fields'::regclass
        and tgname = 'taxon_factual_fields_set_updated_at' and not tgisinternal
        and tgfoid = 'public.tg_set_updated_at()'::regprocedure
        and pg_get_triggerdef(oid) like 'CREATE TRIGGER taxon_factual_fields_set_updated_at BEFORE UPDATE ON public.taxon_factual_fields FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at()'
    ) as updated_at_trigger
), verdict as (
  select *, table_exists and draft_removed and review_marker_removed and seed_count and universal_count and segment_count and niche_count and no_ultra_residency
    and no_legacy_properties and rls_enabled and no_public_policies and service_role_allowed
    and service_role_destructive_denied and authenticated_denied and anon_denied and ai_readonly_denied and public_denied
    and columns_exact and primary_key_present and field_key_unique and field_key_format_constraint and auxiliary_definition_constraints and foreign_keys_exact and indexes_exact
    and strict_definition_constraint and strict_definition_function and strict_function_grants and retired_unit_removed
    and retired_revisions_preserved and retired_activations_preserved and updated_at_trigger as passed
  from checks
)
select 1 / passed::integer as fail_closed, * from verdict;

select field_key, taxon_id, definition->>'valueScope' as value_scope, is_active
from public.taxon_factual_fields
order by taxon_id nulls first, field_key;
