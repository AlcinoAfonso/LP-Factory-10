begin;
set transaction read only;
set local search_path = public, pg_catalog;

with expected_review_columns(column_name) as (
  values
    ('baseline_is_active'::text),
    ('baseline_reviewed_input_catalog_version'),
    ('chain_snapshot'),
    ('closed_at'),
    ('closed_by'),
    ('context_fingerprint'),
    ('created_at'),
    ('draft_content_fingerprint'),
    ('draft_context_fingerprint'),
    ('draft_revision'),
    ('id'),
    ('kind'),
    ('opened_at'),
    ('opened_by'),
    ('opened_operation_id'),
    ('revision'),
    ('status'),
    ('target_input_catalog_version'),
    ('taxon_id'),
    ('updated_at')
),
expected_event_columns(column_name) as (
  values
    ('actor_user_id'::text),
    ('content_fingerprint'),
    ('context_fingerprint'),
    ('created_at'),
    ('decision_kind'),
    ('event_kind'),
    ('id'),
    ('operation_id'),
    ('payload_json'),
    ('review_id'),
    ('sequence_number'),
    ('source_strategy')
),
expected_constraints(table_name, constraint_name, constraint_type) as (
  values
    ('business_taxon_factual_reviews'::text, 'business_taxon_factual_reviews_pkey', 'p'::"char"),
    ('business_taxon_factual_reviews', 'business_taxon_factual_reviews_taxon_id_fkey', 'f'::"char"),
    ('business_taxon_factual_reviews', 'business_taxon_factual_reviews_opened_by_fkey', 'f'::"char"),
    ('business_taxon_factual_reviews', 'business_taxon_factual_reviews_closed_by_fkey', 'f'::"char"),
    ('business_taxon_factual_reviews', 'business_taxon_factual_reviews_opened_operation_id_key', 'u'::"char"),
    ('business_taxon_factual_reviews', 'business_taxon_factual_reviews_kind_chk', 'c'::"char"),
    ('business_taxon_factual_reviews', 'business_taxon_factual_reviews_status_chk', 'c'::"char"),
    ('business_taxon_factual_reviews', 'business_taxon_factual_reviews_kind_baseline_chk', 'c'::"char"),
    ('business_taxon_factual_reviews', 'business_taxon_factual_reviews_baseline_version_chk', 'c'::"char"),
    ('business_taxon_factual_reviews', 'business_taxon_factual_reviews_target_version_chk', 'c'::"char"),
    ('business_taxon_factual_reviews', 'business_taxon_factual_reviews_draft_revision_chk', 'c'::"char"),
    ('business_taxon_factual_reviews', 'business_taxon_factual_reviews_context_fingerprint_chk', 'c'::"char"),
    ('business_taxon_factual_reviews', 'business_taxon_factual_reviews_chain_snapshot_chk', 'c'::"char"),
    ('business_taxon_factual_reviews', 'business_taxon_factual_reviews_draft_content_fingerprint_chk', 'c'::"char"),
    ('business_taxon_factual_reviews', 'business_taxon_factual_reviews_draft_context_fingerprint_chk', 'c'::"char"),
    ('business_taxon_factual_reviews', 'business_taxon_factual_reviews_revision_chk', 'c'::"char"),
    ('business_taxon_factual_reviews', 'business_taxon_factual_reviews_draft_reference_chk', 'c'::"char"),
    ('business_taxon_factual_reviews', 'business_taxon_factual_reviews_closure_chk', 'c'::"char"),
    ('business_taxon_factual_review_events', 'business_taxon_factual_review_events_pkey', 'p'::"char"),
    ('business_taxon_factual_review_events', 'business_taxon_factual_review_events_review_id_fkey', 'f'::"char"),
    ('business_taxon_factual_review_events', 'business_taxon_factual_review_events_actor_user_id_fkey', 'f'::"char"),
    ('business_taxon_factual_review_events', 'business_taxon_factual_review_events_sequence_chk', 'c'::"char"),
    ('business_taxon_factual_review_events', 'business_taxon_factual_review_events_kind_chk', 'c'::"char"),
    ('business_taxon_factual_review_events', 'business_taxon_factual_review_events_source_strategy_chk', 'c'::"char"),
    ('business_taxon_factual_review_events', 'business_taxon_factual_review_events_decision_kind_chk', 'c'::"char"),
    ('business_taxon_factual_review_events', 'business_taxon_factual_review_events_payload_chk', 'c'::"char"),
    ('business_taxon_factual_review_events', 'business_taxon_factual_review_events_context_fingerprint_chk', 'c'::"char"),
    ('business_taxon_factual_review_events', 'business_taxon_factual_review_events_content_fingerprint_chk', 'c'::"char"),
    ('business_taxon_factual_review_events', 'business_taxon_factual_review_events_review_sequence_key', 'u'::"char"),
    ('business_taxon_factual_review_events', 'business_taxon_factual_review_events_review_operation_key', 'u'::"char")
),
checks as (
  select 'taxon_default_inactive'::text as check_name,
    coalesce((
      select lower(column_default) in ('false', 'false::boolean')
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'business_taxons'
        and column_name = 'is_active'
    ), false) as ok

  union all

  select 'review_columns',
    array(
      select column_name::text
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'business_taxon_factual_reviews'
      order by column_name
    ) = array(select column_name from expected_review_columns order by column_name)

  union all

  select 'event_columns',
    array(
      select column_name::text
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'business_taxon_factual_review_events'
      order by column_name
    ) = array(select column_name from expected_event_columns order by column_name)

  union all

  select 'material_constraints',
    not exists (
      select 1
      from expected_constraints expected
      left join pg_constraint constraints
        on constraints.conrelid = format('public.%I', expected.table_name)::regclass
        and constraints.conname = expected.constraint_name
      where constraints.oid is null
         or constraints.contype <> expected.constraint_type
         or not constraints.convalidated
    )

  union all

  select 'foreign_key_actions',
    coalesce((
      select count(*) = 5
        and bool_and(constraints.confupdtype = 'c')
        and bool_and(constraints.confdeltype = 'r')
      from pg_constraint constraints
      where constraints.conrelid in (
        'public.business_taxon_factual_reviews'::regclass,
        'public.business_taxon_factual_review_events'::regclass
      )
        and constraints.contype = 'f'
    ), false)

  union all

  select 'idempotency_keys',
    coalesce((
      select count(*) = 2
        and bool_and(index_state.indisunique)
        and bool_and(index_state.indisvalid)
      from pg_index index_state
      where index_state.indexrelid in (
        'public.business_taxon_factual_reviews_opened_operation_id_key'::regclass,
        'public.business_taxon_factual_review_events_review_operation_key'::regclass
      )
    ), false)

  union all

  select 'service_only_rls',
    coalesce((
      select bool_and(c.relrowsecurity)
        and not exists (
          select 1
          from pg_policies policies
          where policies.schemaname = 'public'
            and policies.tablename in (
              'business_taxon_factual_reviews',
              'business_taxon_factual_review_events'
            )
        )
        and not exists (
          select 1
          from information_schema.role_table_grants grants
          where grants.table_schema = 'public'
            and grants.table_name in (
              'business_taxon_factual_reviews',
              'business_taxon_factual_review_events'
            )
            and grants.grantee = 'PUBLIC'
        )
        and not has_table_privilege('anon', 'public.business_taxon_factual_reviews', 'SELECT,INSERT,UPDATE,DELETE')
        and not has_table_privilege('authenticated', 'public.business_taxon_factual_reviews', 'SELECT,INSERT,UPDATE,DELETE')
        and not has_table_privilege('anon', 'public.business_taxon_factual_review_events', 'SELECT,INSERT,UPDATE,DELETE')
        and not has_table_privilege('authenticated', 'public.business_taxon_factual_review_events', 'SELECT,INSERT,UPDATE,DELETE')
        and has_table_privilege('service_role', 'public.business_taxon_factual_reviews', 'SELECT')
        and has_table_privilege('service_role', 'public.business_taxon_factual_reviews', 'INSERT')
        and has_table_privilege('service_role', 'public.business_taxon_factual_reviews', 'UPDATE')
        and not has_table_privilege('service_role', 'public.business_taxon_factual_reviews', 'DELETE,TRUNCATE')
        and has_table_privilege('service_role', 'public.business_taxon_factual_review_events', 'SELECT')
        and has_table_privilege('service_role', 'public.business_taxon_factual_review_events', 'INSERT')
        and not has_table_privilege('service_role', 'public.business_taxon_factual_review_events', 'UPDATE,DELETE,TRUNCATE')
        and (
          to_regrole('ai_readonly') is null
          or (
            not has_table_privilege('ai_readonly', 'public.business_taxon_factual_reviews', 'SELECT,INSERT,UPDATE,DELETE')
            and not has_table_privilege('ai_readonly', 'public.business_taxon_factual_review_events', 'SELECT,INSERT,UPDATE,DELETE')
          )
        )
      from pg_class c
      where c.oid in (
        'public.business_taxon_factual_reviews'::regclass,
        'public.business_taxon_factual_review_events'::regclass
      )
    ), false)

  union all

  select 'one_unclosed_review_per_taxon',
    coalesce((
      select index_state.indisunique
        and index_state.indisvalid
        and pg_get_expr(index_state.indpred, index_state.indrelid)
          ~* 'status = any .*open.*awaiting_catalog_publication'
      from pg_index index_state
      where index_state.indexrelid =
        to_regclass('public.business_taxon_factual_reviews_one_unclosed_per_taxon_idx')
    ), false)

  union all

  select 'event_append_only',
    coalesce((
      select count(*) = 1
        and bool_and(not trigger_state.tgisinternal)
      from pg_trigger trigger_state
      where trigger_state.tgrelid = 'public.business_taxon_factual_review_events'::regclass
        and trigger_state.tgname = 'business_taxon_factual_review_events_append_only'
    ), false)

  union all

  select 'material_triggers',
    coalesce((
      select count(*) = 2
        and bool_and(not trigger_state.tgisinternal)
        and bool_and(trigger_state.tgenabled = 'O')
        and bool_and(
          (trigger_state.tgname = 'business_taxon_factual_reviews_set_updated_at' and trigger_state.tgtype = 19)
          or
          (trigger_state.tgname = 'business_taxon_factual_review_events_append_only' and trigger_state.tgtype = 27)
        )
      from pg_trigger trigger_state
      where (
        trigger_state.tgrelid = 'public.business_taxon_factual_reviews'::regclass
        and trigger_state.tgname = 'business_taxon_factual_reviews_set_updated_at'
      )
      or (
        trigger_state.tgrelid = 'public.business_taxon_factual_review_events'::regclass
        and trigger_state.tgname = 'business_taxon_factual_review_events_append_only'
      )
    ), false)

  union all

  select 'rpc_security',
    not exists (
      select 1
      from information_schema.routine_privileges
      where routine_schema = 'public'
        and routine_name in (
          'open_business_taxon_factual_review_v1',
          'close_business_taxon_factual_review_without_change_v1'
        )
        and grantee = 'PUBLIC'
        and privilege_type = 'EXECUTE'
    )
      and not has_function_privilege('anon', 'public.open_business_taxon_factual_review_v1(uuid,text,jsonb,uuid,uuid,boolean,integer)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.open_business_taxon_factual_review_v1(uuid,text,jsonb,uuid,uuid,boolean,integer)', 'EXECUTE')
      and has_function_privilege('service_role', 'public.open_business_taxon_factual_review_v1(uuid,text,jsonb,uuid,uuid,boolean,integer)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.close_business_taxon_factual_review_without_change_v1(uuid,uuid,uuid,bigint,integer,text,text,jsonb)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.close_business_taxon_factual_review_without_change_v1(uuid,uuid,uuid,bigint,integer,text,text,jsonb)', 'EXECUTE')
      and has_function_privilege('service_role', 'public.close_business_taxon_factual_review_without_change_v1(uuid,uuid,uuid,bigint,integer,text,text,jsonb)', 'EXECUTE')
      and (
        to_regrole('ai_readonly') is null
        or (
          not has_function_privilege('ai_readonly', 'public.open_business_taxon_factual_review_v1(uuid,text,jsonb,uuid,uuid,boolean,integer)', 'EXECUTE')
          and not has_function_privilege('ai_readonly', 'public.close_business_taxon_factual_review_without_change_v1(uuid,uuid,uuid,bigint,integer,text,text,jsonb)', 'EXECUTE')
        )
      )
      and coalesce((
        select not procedures.prosecdef
          and procedures.proconfig @> array['search_path=public, pg_catalog']::text[]
        from pg_proc procedures
        where procedures.oid = 'public.open_business_taxon_factual_review_v1(uuid,text,jsonb,uuid,uuid,boolean,integer)'::regprocedure
      ), false)
      and coalesce((
        select not procedures.prosecdef
          and procedures.proconfig @> array['search_path=public, pg_catalog']::text[]
        from pg_proc procedures
        where procedures.oid = 'public.close_business_taxon_factual_review_without_change_v1(uuid,uuid,uuid,bigint,integer,text,text,jsonb)'::regprocedure
      ), false)
)
select
  check_name,
  ok,
  case when bool_and(ok) over () then 'ok' else 'unexpected' end as status
from checks
order by check_name;

rollback;
