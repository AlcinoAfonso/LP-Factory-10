with expected_baselines(environment, workload, modality, model, reasoning_effort, quality) as (
  values
    ('production', 'niche_resolution', 'responses_text', 'gpt-5.4-mini', 'none', null::text),
    ('preview', 'niche_resolution', 'responses_text', 'gpt-5.4-mini', 'none', null::text),
    ('production', 'commercial_activation_draft_generation', 'responses_text', 'gpt-5.4-mini', 'none', null::text),
    ('preview', 'commercial_activation_draft_generation', 'responses_text', 'gpt-5.4-mini', 'none', null::text),
    ('production', 'landing_page_draft_generation', 'responses_text', 'gpt-5.6-luna', 'max', null::text),
    ('preview', 'landing_page_draft_generation', 'responses_text', 'gpt-5.6-luna', 'max', null::text),
    ('production', 'taxon_input_catalog_sufficiency_evaluation', 'responses_text', 'gpt-5.6-terra', 'low', null::text),
    ('preview', 'taxon_input_catalog_sufficiency_evaluation', 'responses_text', 'gpt-5.6-terra', 'low', null::text),
    ('production', 'landing_page_draft_image_generation', 'image_generation', 'gpt-image-2', null::text, 'medium'),
    ('preview', 'landing_page_draft_image_generation', 'image_generation', 'gpt-image-2', null::text, 'medium')
),
expected_columns(table_name, column_name, data_type, is_nullable) as (
  values
    ('openai_workload_operational_configurations', 'environment', 'text', 'NO'),
    ('openai_workload_operational_configurations', 'workload', 'text', 'NO'),
    ('openai_workload_operational_configurations', 'modality', 'text', 'NO'),
    ('openai_workload_operational_configurations', 'active_revision_id', 'uuid', 'NO'),
    ('openai_workload_operational_configurations', 'pending_revision_id', 'uuid', 'YES'),
    ('openai_workload_operational_configurations', 'candidate_model', 'text', 'YES'),
    ('openai_workload_operational_configurations', 'candidate_reasoning_effort', 'text', 'YES'),
    ('openai_workload_operational_configurations', 'candidate_quality', 'text', 'YES'),
    ('openai_workload_operational_configurations', 'candidate_saved_by', 'uuid', 'YES'),
    ('openai_workload_operational_configurations', 'candidate_saved_at', 'timestamp with time zone', 'YES'),
    ('openai_workload_operational_configurations', 'configuration_version', 'bigint', 'NO'),
    ('openai_workload_operational_configurations', 'created_at', 'timestamp with time zone', 'NO'),
    ('openai_workload_operational_configurations', 'updated_at', 'timestamp with time zone', 'NO'),
    ('openai_workload_configuration_revisions', 'id', 'uuid', 'NO'),
    ('openai_workload_configuration_revisions', 'environment', 'text', 'NO'),
    ('openai_workload_configuration_revisions', 'workload', 'text', 'NO'),
    ('openai_workload_configuration_revisions', 'modality', 'text', 'NO'),
    ('openai_workload_configuration_revisions', 'revision_number', 'bigint', 'NO'),
    ('openai_workload_configuration_revisions', 'model', 'text', 'NO'),
    ('openai_workload_configuration_revisions', 'reasoning_effort', 'text', 'YES'),
    ('openai_workload_configuration_revisions', 'quality', 'text', 'YES'),
    ('openai_workload_configuration_revisions', 'validated_by', 'uuid', 'YES'),
    ('openai_workload_configuration_revisions', 'validated_at', 'timestamp with time zone', 'NO'),
    ('openai_workload_configuration_revisions', 'proof_metadata', 'jsonb', 'NO'),
    ('openai_workload_configuration_activations', 'id', 'uuid', 'NO'),
    ('openai_workload_configuration_activations', 'environment', 'text', 'NO'),
    ('openai_workload_configuration_activations', 'workload', 'text', 'NO'),
    ('openai_workload_configuration_activations', 'modality', 'text', 'NO'),
    ('openai_workload_configuration_activations', 'activation_number', 'bigint', 'NO'),
    ('openai_workload_configuration_activations', 'event_type', 'text', 'NO'),
    ('openai_workload_configuration_activations', 'previous_revision_id', 'uuid', 'YES'),
    ('openai_workload_configuration_activations', 'target_revision_id', 'uuid', 'NO'),
    ('openai_workload_configuration_activations', 'actor_user_id', 'uuid', 'YES'),
    ('openai_workload_configuration_activations', 'created_at', 'timestamp with time zone', 'NO')
),
expected_constraints(constraint_name) as (
  values
    ('openai_workload_configuration_revisions_pkey'),
    ('openai_workload_configuration_revisions_unit_revision_key'),
    ('openai_workload_configuration_revisions_id_unit_key'),
    ('openai_workload_configuration_revisions_validated_by_fkey'),
    ('openai_workload_configuration_revisions_environment_chk'),
    ('openai_workload_configuration_revisions_workload_chk'),
    ('openai_workload_configuration_revisions_modality_chk'),
    ('openai_workload_configuration_revisions_number_chk'),
    ('openai_workload_configuration_revisions_shape_chk'),
    ('openai_workload_configuration_revisions_proof_metadata_chk'),
    ('openai_workload_configuration_revisions_validator_chk'),
    ('openai_workload_operational_configurations_pkey'),
    ('openai_workload_operational_configurations_active_revision_fkey'),
    ('openai_workload_operational_configurations_pending_revision_fkey'),
    ('openai_workload_operational_configurations_candidate_saved_by_fkey'),
    ('openai_workload_operational_configurations_environment_chk'),
    ('openai_workload_operational_configurations_workload_chk'),
    ('openai_workload_operational_configurations_modality_chk'),
    ('openai_workload_operational_configurations_version_chk'),
    ('openai_workload_operational_configurations_pending_candidate_chk'),
    ('openai_workload_operational_configurations_pending_differs_from_active_chk'),
    ('openai_workload_operational_configurations_candidate_completeness_chk'),
    ('openai_workload_configuration_activations_pkey'),
    ('openai_workload_configuration_activations_unit_number_key'),
    ('openai_workload_configuration_activations_target_revision_fkey'),
    ('openai_workload_configuration_activations_previous_revision_fkey'),
    ('openai_workload_configuration_activations_actor_user_id_fkey'),
    ('openai_workload_configuration_activations_environment_chk'),
    ('openai_workload_configuration_activations_workload_chk'),
    ('openai_workload_configuration_activations_modality_chk'),
    ('openai_workload_configuration_activations_number_chk'),
    ('openai_workload_configuration_activations_event_type_chk'),
    ('openai_workload_configuration_activations_lifecycle_chk')
),
expected_indexes(index_name) as (
  values
    ('openai_workload_operational_configurations_pkey'),
    ('openai_workload_operational_configurations_active_revision_idx'),
    ('openai_workload_operational_configurations_pending_revision_idx'),
    ('openai_workload_configuration_revisions_pkey'),
    ('openai_workload_configuration_revisions_unit_revision_key'),
    ('openai_workload_configuration_revisions_id_unit_key'),
    ('openai_workload_configuration_revisions_validated_by_idx'),
    ('openai_workload_configuration_activations_pkey'),
    ('openai_workload_configuration_activations_unit_number_key'),
    ('openai_workload_configuration_activations_target_revision_idx'),
    ('openai_workload_configuration_activations_previous_revision_idx'),
    ('openai_workload_configuration_activations_actor_user_id_idx')
),
expected_functions(function_signature) as (
  values
    ('public.save_openai_workload_configuration_candidate_v1(text,text,text,text,text,uuid,bigint)'),
    ('public.discard_openai_workload_configuration_candidate_v1(text,text,uuid,bigint)'),
    ('public.promote_openai_workload_configuration_candidate_v1(text,text,jsonb,uuid,bigint)'),
    ('public.activate_openai_workload_configuration_revision_v1(text,text,uuid,uuid,bigint)'),
    ('public.rollback_openai_workload_configuration_revision_v1(text,text,uuid,uuid,bigint)')
),
latest_activations as (
  select distinct on (activation.environment, activation.workload)
    activation.environment,
    activation.workload,
    activation.target_revision_id
  from public.openai_workload_configuration_activations activation
  order by activation.environment, activation.workload, activation.activation_number desc
),
activation_chain as (
  select
    activation.*,
    lag(activation.target_revision_id) over (
      partition by activation.environment, activation.workload
      order by activation.activation_number
    ) as expected_previous_revision_id
  from public.openai_workload_configuration_activations activation
),
proof_metadata_compatibility as (
  select
    revision.id,
    revision.environment,
    revision.workload,
    revision.revision_number,
    coalesce(
      (
        jsonb_typeof(revision.proof_metadata) = 'object'
        and revision.proof_metadata ?& array[
          'schema_version',
          'proof_kind',
          'proof_result',
          'source'
        ]
        and jsonb_typeof(revision.proof_metadata -> 'schema_version') = 'number'
        and revision.proof_metadata ->> 'schema_version' = '1'
        and jsonb_typeof(revision.proof_metadata -> 'proof_kind') = 'string'
        and revision.proof_metadata ->> 'proof_kind' in ('bootstrap', 'operational')
        and jsonb_typeof(revision.proof_metadata -> 'proof_result') = 'string'
        and revision.proof_metadata ->> 'proof_result' = 'approved'
        and jsonb_typeof(revision.proof_metadata -> 'source') = 'string'
        and (
          (
            revision.proof_metadata ->> 'proof_kind' = 'bootstrap'
            and revision.proof_metadata ->> 'source' = 'repo_catalog'
          )
          or (
            revision.proof_metadata ->> 'proof_kind' = 'operational'
            and revision.proof_metadata ->> 'source' = 'openai_api'
          )
        )
        and case
          when not (revision.proof_metadata ? 'request_id')
            or revision.proof_metadata -> 'request_id' = 'null'::jsonb then true
          when jsonb_typeof(revision.proof_metadata -> 'request_id') = 'string' then
            char_length(revision.proof_metadata ->> 'request_id') between 1 and 128
            and revision.proof_metadata ->> 'request_id'
              ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'
          else false
        end
        and case
          when not (revision.proof_metadata ? 'provider_request_id')
            or revision.proof_metadata -> 'provider_request_id' = 'null'::jsonb then true
          when jsonb_typeof(revision.proof_metadata -> 'provider_request_id') = 'string' then
            char_length(revision.proof_metadata ->> 'provider_request_id') between 1 and 128
            and revision.proof_metadata ->> 'provider_request_id'
              ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'
          else false
        end
        and case
          when not (revision.proof_metadata ? 'latency_ms')
            or revision.proof_metadata -> 'latency_ms' = 'null'::jsonb then true
          when jsonb_typeof(revision.proof_metadata -> 'latency_ms') = 'number'
            and revision.proof_metadata ->> 'latency_ms' ~ '^(0|[1-9][0-9]*)$' then
            (revision.proof_metadata ->> 'latency_ms')::numeric <= 900000
          else false
        end
        and case
          when not (revision.proof_metadata ? 'contract_version')
            or revision.proof_metadata -> 'contract_version' = 'null'::jsonb then true
          when jsonb_typeof(revision.proof_metadata -> 'contract_version') = 'number'
            and revision.proof_metadata ->> 'contract_version' ~ '^[1-9][0-9]*$' then
            (revision.proof_metadata ->> 'contract_version')::numeric <= 1000
          else false
        end
        and revision.proof_metadata - array[
          'schema_version',
          'proof_kind',
          'proof_result',
          'request_id',
          'provider_request_id',
          'latency_ms',
          'contract_version',
          'source'
        ] = '{}'::jsonb
      ),
      false
    ) as compatible
  from public.openai_workload_configuration_revisions revision
),
checks as (
  select
    'bootstrap_baselines'::text as check_name,
    case when
      count(*) = 10
      and count(revision.id) = 10
      and count(configuration.environment) = 10
      and count(activation.id) = 10
      and (select count(*) from public.openai_workload_operational_configurations) = 10
      and (
        select count(*)
        from public.openai_workload_configuration_revisions
        where revision_number = 1
      ) = 10
      and (
        select count(*)
        from public.openai_workload_configuration_activations
        where event_type = 'bootstrap'
      ) = 10
    then 'ok' else 'mismatch' end as status,
    jsonb_build_object(
      'expected', count(*),
      'matched_revisions', count(revision.id),
      'matched_units', count(configuration.environment),
      'matched_bootstrap_events', count(activation.id)
    ) as details
  from expected_baselines expected
  left join public.openai_workload_configuration_revisions revision
    on revision.environment = expected.environment
    and revision.workload = expected.workload
    and revision.modality = expected.modality
    and revision.revision_number = 1
    and revision.model = expected.model
    and revision.reasoning_effort is not distinct from expected.reasoning_effort
    and revision.quality is not distinct from expected.quality
    and revision.validated_by is null
    and revision.proof_metadata @> '{"schema_version":1,"proof_kind":"bootstrap","proof_result":"approved","source":"repo_catalog"}'::jsonb
  left join public.openai_workload_operational_configurations configuration
    on configuration.environment = expected.environment
    and configuration.workload = expected.workload
    and configuration.modality = expected.modality
    and configuration.configuration_version >= 1
  left join public.openai_workload_configuration_activations activation
    on activation.environment = expected.environment
    and activation.workload = expected.workload
    and activation.modality = expected.modality
    and activation.activation_number = 1
    and activation.event_type = 'bootstrap'
    and activation.previous_revision_id is null
    and activation.target_revision_id = revision.id
    and activation.actor_user_id is null

  union all

  select
    'proof_metadata_contract',
    case when count(*) filter (where not metadata.compatible) = 0
      then 'ok' else 'invalid' end,
    jsonb_build_object(
      'revision_rows', count(*),
      'incompatible_rows', count(*) filter (where not metadata.compatible),
      'incompatible_revisions', coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', metadata.id,
            'environment', metadata.environment,
            'workload', metadata.workload,
            'revision_number', metadata.revision_number
          )
          order by metadata.environment, metadata.workload, metadata.revision_number
        ) filter (where not metadata.compatible),
        '[]'::jsonb
      )
    )
  from proof_metadata_compatibility metadata

  union all

  select
    'active_and_pending_cardinality',
    case when
      count(*) = 10
      and count(configuration.active_revision_id) = 10
      and count(distinct configuration.active_revision_id) = 10
      and count(*) filter (
        where (configuration.candidate_model is not null)::integer
          + (configuration.pending_revision_id is not null)::integer > 1
      ) = 0
      and count(*) filter (
        where configuration.pending_revision_id is not null
          and configuration.pending_revision_id = configuration.active_revision_id
      ) = 0
    then 'ok' else 'invalid' end,
    jsonb_build_object(
      'units', count(*),
      'active_revisions', count(configuration.active_revision_id),
      'distinct_active_revisions', count(distinct configuration.active_revision_id),
      'candidate_units', count(*) filter (where configuration.candidate_model is not null),
      'pending_revision_units', count(*) filter (where configuration.pending_revision_id is not null),
      'multiple_pending_units', count(*) filter (
        where (configuration.candidate_model is not null)::integer
          + (configuration.pending_revision_id is not null)::integer > 1
      ),
      'pending_equals_active_units', count(*) filter (
        where configuration.pending_revision_id is not null
          and configuration.pending_revision_id = configuration.active_revision_id
      )
    )
  from public.openai_workload_operational_configurations configuration

  union all

  select
    'references_and_lifecycle',
    case when
      count(*) filter (where active_revision.id is null) = 0
      and count(*) filter (
        where configuration.pending_revision_id is not null
          and pending_revision.id is null
      ) = 0
      and count(*) filter (
        where latest.target_revision_id is distinct from configuration.active_revision_id
      ) = 0
      and not exists (
        select 1
        from public.openai_workload_configuration_activations activation_reference
        left join public.openai_workload_configuration_revisions target_reference
          on target_reference.id = activation_reference.target_revision_id
          and target_reference.environment = activation_reference.environment
          and target_reference.workload = activation_reference.workload
        left join public.openai_workload_configuration_revisions previous_reference
          on previous_reference.id = activation_reference.previous_revision_id
          and previous_reference.environment = activation_reference.environment
          and previous_reference.workload = activation_reference.workload
        where target_reference.id is null
          or (
            activation_reference.previous_revision_id is not null
            and previous_reference.id is null
          )
      )
      and not exists (
        select 1
        from activation_chain chain
        where chain.activation_number = 1
          and (
            chain.event_type <> 'bootstrap'
            or chain.previous_revision_id is not null
            or chain.actor_user_id is not null
          )
          or chain.activation_number > 1
          and (
            chain.event_type not in ('activate', 'rollback')
            or chain.previous_revision_id is distinct from chain.expected_previous_revision_id
            or chain.actor_user_id is null
          )
      )
      and not exists (
        select 1
        from (
          select
            environment,
            workload,
            min(activation_number) as first_number,
            max(activation_number) as last_number,
            count(*) as event_count
          from public.openai_workload_configuration_activations
          group by environment, workload
        ) event_sequence
        where event_sequence.first_number <> 1
          or event_sequence.last_number <> event_sequence.event_count
      )
    then 'ok' else 'invalid' end,
    jsonb_build_object(
      'units', count(*),
      'invalid_active_references', count(*) filter (where active_revision.id is null),
      'invalid_pending_references', count(*) filter (
        where configuration.pending_revision_id is not null
          and pending_revision.id is null
      ),
      'latest_event_drift', count(*) filter (
        where latest.target_revision_id is distinct from configuration.active_revision_id
      ),
      'invalid_activation_references', (
        select count(*)
        from public.openai_workload_configuration_activations activation_reference
        left join public.openai_workload_configuration_revisions target_reference
          on target_reference.id = activation_reference.target_revision_id
          and target_reference.environment = activation_reference.environment
          and target_reference.workload = activation_reference.workload
        left join public.openai_workload_configuration_revisions previous_reference
          on previous_reference.id = activation_reference.previous_revision_id
          and previous_reference.environment = activation_reference.environment
          and previous_reference.workload = activation_reference.workload
        where target_reference.id is null
          or (
            activation_reference.previous_revision_id is not null
            and previous_reference.id is null
          )
      )
    )
  from public.openai_workload_operational_configurations configuration
  left join public.openai_workload_configuration_revisions active_revision
    on active_revision.id = configuration.active_revision_id
    and active_revision.environment = configuration.environment
    and active_revision.workload = configuration.workload
  left join public.openai_workload_configuration_revisions pending_revision
    on pending_revision.id = configuration.pending_revision_id
    and pending_revision.environment = configuration.environment
    and pending_revision.workload = configuration.workload
  left join latest_activations latest
    on latest.environment = configuration.environment
    and latest.workload = configuration.workload

  union all

  select
    'columns_and_tables_drift',
    case when
      count(*) filter (
        where actual.column_name is not null
          and actual.data_type = expected.data_type
          and actual.is_nullable = expected.is_nullable
      ) = (select count(*) from expected_columns)
      and not exists (
        select 1
        from information_schema.columns actual_extra
        where actual_extra.table_schema = 'public'
          and actual_extra.table_name in (
            'openai_workload_operational_configurations',
            'openai_workload_configuration_revisions',
            'openai_workload_configuration_activations'
          )
          and not exists (
            select 1
            from expected_columns expected_column
            where expected_column.table_name = actual_extra.table_name
              and expected_column.column_name = actual_extra.column_name
          )
      )
      and (
        select count(*)
        from information_schema.tables
        where table_schema = 'public'
          and table_name in (
            'openai_workload_operational_configurations',
            'openai_workload_configuration_revisions',
            'openai_workload_configuration_activations'
          )
      ) = 3
    then 'ok' else 'drift' end,
    jsonb_build_object(
      'expected_columns', (select count(*) from expected_columns),
      'matching_columns', count(*) filter (
        where actual.column_name is not null
          and actual.data_type = expected.data_type
          and actual.is_nullable = expected.is_nullable
      ),
      'managed_tables', (
        select jsonb_agg(table_name order by table_name)
        from information_schema.tables
        where table_schema = 'public'
          and table_name in (
            'openai_workload_operational_configurations',
            'openai_workload_configuration_revisions',
            'openai_workload_configuration_activations'
          )
      )
    )
  from expected_columns expected
  left join information_schema.columns actual
    on actual.table_schema = 'public'
    and actual.table_name = expected.table_name
    and actual.column_name = expected.column_name

  union all

  select
    'constraints_and_indexes',
    case when
      count(*) filter (where object_kind = 'constraint') = (select count(*) from expected_constraints)
      and count(*) filter (where object_kind = 'index') = (select count(*) from expected_indexes)
      and count(*) filter (
        where object_kind = 'constraint'
          and object_name like '%_fkey'
          and definition not ilike '%ON UPDATE RESTRICT ON DELETE RESTRICT%'
      ) = 0
    then 'ok' else 'missing_or_drifted' end,
    jsonb_agg(jsonb_build_object(
      'kind', object_kind,
      'name', object_name,
      'definition', definition
    ) order by object_kind, object_name)
  from (
    select
      'constraint'::text as object_kind,
      expected.constraint_name as object_name,
      pg_get_constraintdef(actual.oid) as definition
    from expected_constraints expected
    left join pg_constraint actual
      on actual.conname = expected.constraint_name
      and actual.connamespace = 'public'::regnamespace
    where actual.oid is not null
    union all
    select
      'index',
      expected.index_name,
      actual.indexdef
    from expected_indexes expected
    left join pg_indexes actual
      on actual.schemaname = 'public'
      and actual.indexname = expected.index_name
    where actual.indexname is not null
  ) objects

  union all

  select
    'rls_policies_and_table_grants',
    case when
      count(*) filter (where target.relrowsecurity) = 3
      and not exists (
        select 1
        from pg_policies policy
        where policy.schemaname = 'public'
          and policy.tablename in (
            'openai_workload_operational_configurations',
            'openai_workload_configuration_revisions',
            'openai_workload_configuration_activations'
          )
      )
      and not exists (
        select 1
        from information_schema.role_table_grants grant_row
        where grant_row.table_schema = 'public'
          and grant_row.table_name in (
            'openai_workload_operational_configurations',
            'openai_workload_configuration_revisions',
            'openai_workload_configuration_activations'
          )
          and lower(grant_row.grantee) in ('public', 'anon', 'authenticated', 'ai_readonly')
      )
      and has_table_privilege('service_role', 'public.openai_workload_operational_configurations', 'SELECT')
      and not has_table_privilege(
        'service_role',
        'public.openai_workload_operational_configurations',
        'INSERT,DELETE,TRUNCATE'
      )
      and has_table_privilege('service_role', 'public.openai_workload_configuration_revisions', 'SELECT,INSERT')
      and not has_table_privilege('service_role', 'public.openai_workload_configuration_revisions', 'UPDATE,DELETE,TRUNCATE')
      and has_table_privilege('service_role', 'public.openai_workload_configuration_activations', 'SELECT,INSERT')
      and not has_table_privilege('service_role', 'public.openai_workload_configuration_activations', 'UPDATE,DELETE,TRUNCATE')
    then 'ok' else 'mismatch' end,
    jsonb_build_object(
      'rls_tables', count(*) filter (where target.relrowsecurity),
      'policies', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'table', policy.tablename,
          'policy', policy.policyname,
          'roles', policy.roles,
          'command', policy.cmd
        )), '[]'::jsonb)
        from pg_policies policy
        where policy.schemaname = 'public'
          and policy.tablename in (
            'openai_workload_operational_configurations',
            'openai_workload_configuration_revisions',
            'openai_workload_configuration_activations'
          )
      ),
      'service_configuration_select', has_table_privilege(
        'service_role',
        'public.openai_workload_operational_configurations',
        'SELECT'
      ),
      'service_configuration_insert_delete_truncate', has_table_privilege(
        'service_role',
        'public.openai_workload_operational_configurations',
        'INSERT,DELETE,TRUNCATE'
      ),
      'service_revision_read_append', has_table_privilege(
        'service_role',
        'public.openai_workload_configuration_revisions',
        'SELECT,INSERT'
      ),
      'service_activation_read_append', has_table_privilege(
        'service_role',
        'public.openai_workload_configuration_activations',
        'SELECT,INSERT'
      )
    )
  from pg_class target
  where target.oid in (
    'public.openai_workload_operational_configurations'::regclass,
    'public.openai_workload_configuration_revisions'::regclass,
    'public.openai_workload_configuration_activations'::regclass
  )

  union all

  select
    'configuration_update_grants',
    case when
      count(*) = 9
      and count(*) filter (
        where column_name in (
          'active_revision_id',
          'pending_revision_id',
          'candidate_model',
          'candidate_reasoning_effort',
          'candidate_quality',
          'candidate_saved_by',
          'candidate_saved_at',
          'configuration_version',
          'updated_at'
        )
      ) = 9
    then 'ok' else 'mismatch' end,
    coalesce(jsonb_agg(column_name order by column_name), '[]'::jsonb)
  from information_schema.role_column_grants
  where table_schema = 'public'
    and table_name = 'openai_workload_operational_configurations'
    and grantee = 'service_role'
    and privilege_type = 'UPDATE'

  union all

  select
    'rpc_security',
    case when
      count(*) = 5
      and count(*) filter (
        where procedure_oid is not null
          and security_definer = false
          and fixed_search_path
          and service_execute
          and not anon_execute
          and not authenticated_execute
          and not public_execute
          and not ai_readonly_execute
      ) = 5
    then 'ok' else 'mismatch' end,
    jsonb_agg(jsonb_build_object(
      'signature', function_signature,
      'security_invoker', not security_definer,
      'fixed_search_path', fixed_search_path,
      'service_execute', service_execute,
      'anon_execute', anon_execute,
      'authenticated_execute', authenticated_execute,
      'public_execute', public_execute,
      'ai_readonly_execute', ai_readonly_execute
    ) order by function_signature)
  from (
    select
      expected.function_signature,
      proc.oid as procedure_oid,
      coalesce(proc.prosecdef, true) as security_definer,
      coalesce(proc.proconfig @> array['search_path=pg_catalog'], false) as fixed_search_path,
      coalesce(has_function_privilege('service_role', proc.oid, 'EXECUTE'), false) as service_execute,
      coalesce(has_function_privilege('anon', proc.oid, 'EXECUTE'), false) as anon_execute,
      coalesce(has_function_privilege('authenticated', proc.oid, 'EXECUTE'), false) as authenticated_execute,
      exists (
        select 1
        from aclexplode(coalesce(proc.proacl, acldefault('f', proc.proowner))) acl
        where acl.grantee = 0
          and acl.privilege_type = 'EXECUTE'
      ) as public_execute,
      exists (
        select 1
        from aclexplode(coalesce(proc.proacl, acldefault('f', proc.proowner))) acl
        join pg_roles role on role.oid = acl.grantee
        where role.rolname = 'ai_readonly'
          and acl.privilege_type = 'EXECUTE'
    ) as ai_readonly_execute
    from expected_functions expected
    left join pg_proc proc
      on proc.oid = to_regprocedure(expected.function_signature)
  ) functions

  union all

  select
    'append_only_triggers',
    case when
      count(*) = 2
      and count(*) filter (where trigger_enabled <> 'D') = 2
    then 'ok' else 'missing_or_disabled' end,
    coalesce(jsonb_agg(jsonb_build_object(
      'table', table_name,
      'trigger', trigger_name,
      'enabled', trigger_enabled,
      'definition', definition
    ) order by table_name), '[]'::jsonb)
  from (
    select
      target.relname as table_name,
      trigger.tgname as trigger_name,
      trigger.tgenabled as trigger_enabled,
      pg_get_triggerdef(trigger.oid) as definition
    from pg_trigger trigger
    join pg_class target on target.oid = trigger.tgrelid
    join pg_namespace namespace on namespace.oid = target.relnamespace
    where namespace.nspname = 'public'
      and trigger.tgname in (
        'openai_workload_configuration_revisions_append_only',
        'openai_workload_configuration_activations_append_only'
      )
      and not trigger.tgisinternal
  ) triggers
)
select check_name, status, details
from checks
order by check_name;
