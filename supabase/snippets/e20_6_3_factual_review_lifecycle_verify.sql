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
    ('landing_page_input_catalog_drafts'::text, 'landing_page_input_catalog_drafts_factual_review_save_receipts_chk', 'c'::"char"),
    ('business_taxon_factual_reviews', 'business_taxon_factual_reviews_pkey', 'p'::"char"),
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

  select 'draft_save_receipts',
    coalesce((
      select columns.is_nullable = 'NO'
        and columns.data_type = 'jsonb'
        and columns.column_default = '''{}''::jsonb'
      from information_schema.columns
      where columns.table_schema = 'public'
        and columns.table_name = 'landing_page_input_catalog_drafts'
        and columns.column_name = 'factual_review_save_receipts'
    ), false)

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
      select count(*) = 4
        and bool_and(not trigger_state.tgisinternal)
        and bool_and(trigger_state.tgenabled = 'O')
        and bool_and(
          (trigger_state.tgname = 'business_taxon_factual_reviews_set_updated_at' and trigger_state.tgtype = 19)
          or
          (trigger_state.tgname = 'business_taxon_factual_review_events_append_only' and trigger_state.tgtype = 27)
          or
          (trigger_state.tgname = 'landing_page_input_catalog_drafts_set_updated_at' and trigger_state.tgtype = 19)
          or
          (trigger_state.tgname = 'landing_page_input_catalog_drafts_guard_factual_projection' and trigger_state.tgtype = 23)
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
      or (
        trigger_state.tgrelid = 'public.landing_page_input_catalog_drafts'::regclass
        and trigger_state.tgname in (
          'landing_page_input_catalog_drafts_set_updated_at',
          'landing_page_input_catalog_drafts_guard_factual_projection'
        )
      )
    ), false)

  union all

  select 'evaluation_event_contract',
    coalesce((
      select lower(pg_get_constraintdef(constraints.oid)) like '%evaluation_inconclusive%'
        and lower(pg_get_constraintdef(constraints.oid)) like '%content_fingerprint is null%'
      from pg_constraint constraints
      where constraints.conrelid = 'public.business_taxon_factual_review_events'::regclass
        and constraints.conname = 'business_taxon_factual_review_events_content_fingerprint_chk'
    ), false)
      and coalesce((
        select pg_get_functiondef(procedures.oid) like '%outputFingerprint%'
          and pg_get_functiondef(procedures.oid) like '%inputCatalogVersion%'
          and pg_get_functiondef(procedures.oid) like '%candidateCount%'
          and pg_get_functiondef(procedures.oid) like '%webSearchSources%'
          and pg_get_functiondef(procedures.oid) like '%materialTextUrlProjection%'
          and pg_get_functiondef(procedures.oid) like '%factual_review_evaluation_text_sources_invalid%'
          and pg_get_functiondef(procedures.oid) like '%regexp_replace%[.,;:!?]+$%'
          and pg_get_functiondef(procedures.oid) like '%v_url_parts[3] = ''443''%'
          and pg_get_functiondef(procedures.oid) like '%lower(v_url_parts[1])%'
          and pg_get_functiondef(procedures.oid) like '%evaluationContextFingerprint%'
          and pg_get_functiondef(procedures.oid) like '%reviewContextFingerprint%'
          and pg_get_functiondef(procedures.oid) like '%deadlineAtMs%'
          and pg_get_functiondef(procedures.oid) like '%factual_review_evaluation_deadline_exceeded%'
          and pg_get_functiondef(procedures.oid) like '%web_search_focal%'
          and pg_get_functiondef(procedures.oid) like '%evaluation_inconclusive%'
        from pg_proc procedures
        where procedures.oid =
          'public.append_business_taxon_factual_review_evaluation_event_v1(uuid,uuid,uuid,bigint,text,text,text,text,jsonb)'::regprocedure
      ), false)

  union all

  select 'evaluation_decision_binding',
    coalesce((
      select count(*) = 2
        and bool_and(pg_get_functiondef(procedures.oid) like '%recommendationEvaluationContextFingerprint%')
        and bool_and(pg_get_functiondef(procedures.oid) like '%evaluationContextFingerprint%')
        and bool_and(pg_get_functiondef(procedures.oid) like '%reviewContextFingerprint%')
      from pg_proc procedures
      where procedures.oid in (
        'public.close_business_taxon_factual_review_without_change_v1(uuid,uuid,uuid,bigint,integer,text,text,jsonb,jsonb)'::regprocedure,
        'public.record_business_taxon_factual_catalog_change_decision_v1(uuid,uuid,uuid,bigint,text,jsonb,bigint,integer,text,text,jsonb)'::regprocedure
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
          'close_business_taxon_factual_review_without_change_v1',
          'append_business_taxon_factual_review_evaluation_event_v1',
          'record_business_taxon_factual_catalog_change_decision_v1',
          'save_business_taxon_factual_review_draft_v1',
          'authorize_business_taxon_factual_review_publication_v1',
          'reconcile_business_taxon_factual_review_publication_v1'
        )
        and grantee = 'PUBLIC'
        and privilege_type = 'EXECUTE'
    )
      and not has_function_privilege('anon', 'public.open_business_taxon_factual_review_v1(uuid,text,jsonb,uuid,uuid,boolean,integer)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.open_business_taxon_factual_review_v1(uuid,text,jsonb,uuid,uuid,boolean,integer)', 'EXECUTE')
      and has_function_privilege('service_role', 'public.open_business_taxon_factual_review_v1(uuid,text,jsonb,uuid,uuid,boolean,integer)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.close_business_taxon_factual_review_without_change_v1(uuid,uuid,uuid,bigint,integer,text,text,jsonb,jsonb)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.close_business_taxon_factual_review_without_change_v1(uuid,uuid,uuid,bigint,integer,text,text,jsonb,jsonb)', 'EXECUTE')
      and has_function_privilege('service_role', 'public.close_business_taxon_factual_review_without_change_v1(uuid,uuid,uuid,bigint,integer,text,text,jsonb,jsonb)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.append_business_taxon_factual_review_evaluation_event_v1(uuid,uuid,uuid,bigint,text,text,text,text,jsonb)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.append_business_taxon_factual_review_evaluation_event_v1(uuid,uuid,uuid,bigint,text,text,text,text,jsonb)', 'EXECUTE')
      and has_function_privilege('service_role', 'public.append_business_taxon_factual_review_evaluation_event_v1(uuid,uuid,uuid,bigint,text,text,text,text,jsonb)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.record_business_taxon_factual_catalog_change_decision_v1(uuid,uuid,uuid,bigint,text,jsonb,bigint,integer,text,text,jsonb)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.record_business_taxon_factual_catalog_change_decision_v1(uuid,uuid,uuid,bigint,text,jsonb,bigint,integer,text,text,jsonb)', 'EXECUTE')
      and has_function_privilege('service_role', 'public.record_business_taxon_factual_catalog_change_decision_v1(uuid,uuid,uuid,bigint,text,jsonb,bigint,integer,text,text,jsonb)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.save_business_taxon_factual_review_draft_v1(uuid,uuid,bigint,jsonb,text)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.save_business_taxon_factual_review_draft_v1(uuid,uuid,bigint,jsonb,text)', 'EXECUTE')
      and has_function_privilege('service_role', 'public.save_business_taxon_factual_review_draft_v1(uuid,uuid,bigint,jsonb,text)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.authorize_business_taxon_factual_review_publication_v1(uuid,uuid,bigint,text,text,uuid[])', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.authorize_business_taxon_factual_review_publication_v1(uuid,uuid,bigint,text,text,uuid[])', 'EXECUTE')
      and has_function_privilege('service_role', 'public.authorize_business_taxon_factual_review_publication_v1(uuid,uuid,bigint,text,text,uuid[])', 'EXECUTE')
      and not has_function_privilege('anon', 'public.reconcile_business_taxon_factual_review_publication_v1(uuid,uuid,bigint,integer,text,text)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.reconcile_business_taxon_factual_review_publication_v1(uuid,uuid,bigint,integer,text,text)', 'EXECUTE')
      and has_function_privilege('service_role', 'public.reconcile_business_taxon_factual_review_publication_v1(uuid,uuid,bigint,integer,text,text)', 'EXECUTE')
      and (
        to_regrole('ai_readonly') is null
        or (
          not has_function_privilege('ai_readonly', 'public.open_business_taxon_factual_review_v1(uuid,text,jsonb,uuid,uuid,boolean,integer)', 'EXECUTE')
          and not has_function_privilege('ai_readonly', 'public.close_business_taxon_factual_review_without_change_v1(uuid,uuid,uuid,bigint,integer,text,text,jsonb,jsonb)', 'EXECUTE')
          and not has_function_privilege('ai_readonly', 'public.append_business_taxon_factual_review_evaluation_event_v1(uuid,uuid,uuid,bigint,text,text,text,text,jsonb)', 'EXECUTE')
          and not has_function_privilege('ai_readonly', 'public.record_business_taxon_factual_catalog_change_decision_v1(uuid,uuid,uuid,bigint,text,jsonb,bigint,integer,text,text,jsonb)', 'EXECUTE')
          and not has_function_privilege('ai_readonly', 'public.save_business_taxon_factual_review_draft_v1(uuid,uuid,bigint,jsonb,text)', 'EXECUTE')
          and not has_function_privilege('ai_readonly', 'public.authorize_business_taxon_factual_review_publication_v1(uuid,uuid,bigint,text,text,uuid[])', 'EXECUTE')
          and not has_function_privilege('ai_readonly', 'public.reconcile_business_taxon_factual_review_publication_v1(uuid,uuid,bigint,integer,text,text)', 'EXECUTE')
        )
      )
      and coalesce((
        select not procedures.prosecdef
          and procedures.proconfig @> array['search_path=public, pg_catalog']::text[]
        from pg_proc procedures
        where procedures.oid = 'public.open_business_taxon_factual_review_v1(uuid,text,jsonb,uuid,uuid,boolean,integer)'::regprocedure
      ), false)
      and coalesce((
        select count(*) = 7
          and bool_and(not procedures.prosecdef)
          and bool_and(procedures.proconfig @> array['search_path=public, pg_catalog']::text[])
        from pg_proc procedures
        where procedures.oid in (
          'public.open_business_taxon_factual_review_v1(uuid,text,jsonb,uuid,uuid,boolean,integer)'::regprocedure,
          'public.close_business_taxon_factual_review_without_change_v1(uuid,uuid,uuid,bigint,integer,text,text,jsonb,jsonb)'::regprocedure,
          'public.append_business_taxon_factual_review_evaluation_event_v1(uuid,uuid,uuid,bigint,text,text,text,text,jsonb)'::regprocedure,
          'public.record_business_taxon_factual_catalog_change_decision_v1(uuid,uuid,uuid,bigint,text,jsonb,bigint,integer,text,text,jsonb)'::regprocedure,
          'public.save_business_taxon_factual_review_draft_v1(uuid,uuid,bigint,jsonb,text)'::regprocedure,
          'public.authorize_business_taxon_factual_review_publication_v1(uuid,uuid,bigint,text,text,uuid[])'::regprocedure,
          'public.reconcile_business_taxon_factual_review_publication_v1(uuid,uuid,bigint,integer,text,text)'::regprocedure
        )
      ), false)
)
select
  check_name,
  ok,
  case when bool_and(ok) over () then 'ok' else 'unexpected' end as status
from checks
order by check_name;

rollback;
