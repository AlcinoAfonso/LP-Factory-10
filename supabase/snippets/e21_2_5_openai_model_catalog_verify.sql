begin transaction read only;

with
expected_columns(table_name, column_name, data_type, is_nullable) as (
  values
    ('openai_model_catalog_models', 'modality', 'text', 'NO'),
    ('openai_model_catalog_models', 'model', 'text', 'NO'),
    ('openai_model_catalog_models', 'available_for_selection', 'boolean', 'NO'),
    ('openai_model_catalog_models', 'catalog_version', 'bigint', 'NO'),
    ('openai_model_catalog_models', 'updated_by', 'uuid', 'YES'),
    ('openai_model_catalog_models', 'created_at', 'timestamp with time zone', 'NO'),
    ('openai_model_catalog_models', 'updated_at', 'timestamp with time zone', 'NO'),
    ('openai_model_catalog_parameters', 'modality', 'text', 'NO'),
    ('openai_model_catalog_parameters', 'model', 'text', 'NO'),
    ('openai_model_catalog_parameters', 'parameter_kind', 'text', 'NO'),
    ('openai_model_catalog_parameters', 'parameter_value', 'text', 'NO'),
    ('openai_model_catalog_parameters', 'available_for_selection', 'boolean', 'NO'),
    ('openai_model_catalog_parameters', 'catalog_version', 'bigint', 'NO'),
    ('openai_model_catalog_parameters', 'updated_by', 'uuid', 'YES'),
    ('openai_model_catalog_parameters', 'created_at', 'timestamp with time zone', 'NO'),
    ('openai_model_catalog_parameters', 'updated_at', 'timestamp with time zone', 'NO')
),
expected_constraints(constraint_name) as (
  values
    ('openai_model_catalog_models_pkey'),
    ('openai_model_catalog_models_updated_by_fkey'),
    ('openai_model_catalog_models_modality_chk'),
    ('openai_model_catalog_models_model_shape_chk'),
    ('openai_model_catalog_models_version_chk'),
    ('openai_model_catalog_models_timestamps_chk'),
    ('openai_model_catalog_model_has_parameter'),
    ('openai_model_catalog_parameters_pkey'),
    ('openai_model_catalog_parameters_model_fkey'),
    ('openai_model_catalog_parameters_updated_by_fkey'),
    ('openai_model_catalog_parameters_shape_chk'),
    ('openai_model_catalog_parameters_version_chk'),
    ('openai_model_catalog_parameters_timestamps_chk')
),
expected_indexes(index_name) as (
  values
    ('openai_model_catalog_models_pkey'),
    ('openai_model_catalog_models_updated_by_idx'),
    ('openai_model_catalog_parameters_pkey'),
    ('openai_model_catalog_parameters_updated_by_idx')
),
expected_models(modality, model) as (
  values
    ('responses_text', 'gpt-5.4-mini'),
    ('responses_text', 'gpt-5.6-luna'),
    ('responses_text', 'gpt-5.6-terra'),
    ('responses_text', 'gpt-5.6-sol'),
    ('image_generation', 'gpt-image-2')
),
expected_parameters(modality, model, parameter_kind, parameter_value) as (
  values
    ('responses_text', 'gpt-5.4-mini', 'reasoning_effort', 'none'),
    ('responses_text', 'gpt-5.4-mini', 'reasoning_effort', 'low'),
    ('responses_text', 'gpt-5.4-mini', 'reasoning_effort', 'medium'),
    ('responses_text', 'gpt-5.4-mini', 'reasoning_effort', 'high'),
    ('responses_text', 'gpt-5.4-mini', 'reasoning_effort', 'xhigh'),
    ('responses_text', 'gpt-5.6-luna', 'reasoning_effort', 'none'),
    ('responses_text', 'gpt-5.6-luna', 'reasoning_effort', 'low'),
    ('responses_text', 'gpt-5.6-luna', 'reasoning_effort', 'medium'),
    ('responses_text', 'gpt-5.6-luna', 'reasoning_effort', 'high'),
    ('responses_text', 'gpt-5.6-luna', 'reasoning_effort', 'xhigh'),
    ('responses_text', 'gpt-5.6-luna', 'reasoning_effort', 'max'),
    ('responses_text', 'gpt-5.6-terra', 'reasoning_effort', 'none'),
    ('responses_text', 'gpt-5.6-terra', 'reasoning_effort', 'low'),
    ('responses_text', 'gpt-5.6-terra', 'reasoning_effort', 'medium'),
    ('responses_text', 'gpt-5.6-terra', 'reasoning_effort', 'high'),
    ('responses_text', 'gpt-5.6-terra', 'reasoning_effort', 'xhigh'),
    ('responses_text', 'gpt-5.6-terra', 'reasoning_effort', 'max'),
    ('responses_text', 'gpt-5.6-sol', 'reasoning_effort', 'none'),
    ('responses_text', 'gpt-5.6-sol', 'reasoning_effort', 'low'),
    ('responses_text', 'gpt-5.6-sol', 'reasoning_effort', 'medium'),
    ('responses_text', 'gpt-5.6-sol', 'reasoning_effort', 'high'),
    ('responses_text', 'gpt-5.6-sol', 'reasoning_effort', 'xhigh'),
    ('responses_text', 'gpt-5.6-sol', 'reasoning_effort', 'max'),
    ('image_generation', 'gpt-image-2', 'quality', 'low'),
    ('image_generation', 'gpt-image-2', 'quality', 'medium'),
    ('image_generation', 'gpt-image-2', 'quality', 'high')
),
expected_rpcs(function_signature, expected_result, expected_volatility) as (
  values
    (
      'public.add_openai_model_catalog_model_v1(text,text,text,text[],uuid)',
      'TABLE(catalog_version bigint, parameter_count bigint)',
      'v'
    ),
    (
      'public.set_openai_model_catalog_model_availability_v1(text,text,boolean,uuid,bigint)',
      'bigint',
      'v'
    ),
    (
      'public.set_openai_model_catalog_parameter_availability_v1(text,text,text,text,boolean,uuid,bigint)',
      'bigint',
      'v'
    ),
    (
      'public.check_openai_model_catalog_configuration_available_v1(text,text,bigint)',
      'TABLE(configuration_version bigint, candidate_modality text, candidate_model text, candidate_parameter_kind text, candidate_parameter_value text)',
      's'
    ),
    (
      'public.save_openai_workload_configuration_candidate_v1(text,text,text,text,text,uuid,bigint)',
      'bigint',
      'v'
    ),
    (
      'public.promote_openai_workload_configuration_candidate_v1(text,text,jsonb,uuid,bigint)',
      'TABLE(candidate_revision_id uuid, candidate_revision_number bigint, configuration_version bigint)',
      'v'
    )
),
expected_trigger_helpers(function_signature) as (
  values
    ('public.prevent_openai_model_catalog_delete_v1()'),
    ('public.assert_openai_model_catalog_model_has_parameter_v1()')
),
catalog_table_acls as (
  select
    target.relname as table_name,
    target.relowner,
    acl.grantee,
    coalesce(grantee.rolname, 'PUBLIC') as grantee_name,
    acl.privilege_type,
    acl.is_grantable
  from pg_class target
  cross join lateral aclexplode(coalesce(target.relacl, acldefault('r', target.relowner))) acl
  left join pg_roles grantee on grantee.oid = acl.grantee
  where target.oid in (
    'public.openai_model_catalog_models'::regclass,
    'public.openai_model_catalog_parameters'::regclass
  )
),
rpc_facts as (
  select
    expected.function_signature,
    expected.expected_result,
    expected.expected_volatility,
    proc.oid,
    proc.proowner,
    proc.prosecdef,
    proc.provolatile,
    proc.proconfig,
    pg_get_function_result(proc.oid) as actual_result,
    pg_get_functiondef(proc.oid) as definition
  from expected_rpcs expected
  left join pg_proc proc
    on proc.oid = to_regprocedure(expected.function_signature)
),
rpc_acls as (
  select
    facts.function_signature,
    facts.proowner,
    acl.grantee,
    coalesce(grantee.rolname, 'PUBLIC') as grantee_name,
    acl.privilege_type,
    acl.is_grantable
  from rpc_facts facts
  cross join lateral aclexplode(
    coalesce(
      (select proc.proacl from pg_proc proc where proc.oid = facts.oid),
      acldefault('f', facts.proowner)
    )
  ) acl
  left join pg_roles grantee on grantee.oid = acl.grantee
  where facts.oid is not null
),
trigger_helper_facts as (
  select
    expected.function_signature,
    proc.oid,
    proc.proowner,
    proc.prosecdef,
    proc.proconfig
  from expected_trigger_helpers expected
  left join pg_proc proc
    on proc.oid = to_regprocedure(expected.function_signature)
),
trigger_helper_acls as (
  select
    facts.function_signature,
    facts.proowner,
    acl.grantee,
    coalesce(grantee.rolname, 'PUBLIC') as grantee_name,
    acl.privilege_type,
    acl.is_grantable
  from trigger_helper_facts facts
  cross join lateral aclexplode(
    coalesce(
      (select proc.proacl from pg_proc proc where proc.oid = facts.oid),
      acldefault('f', facts.proowner)
    )
  ) acl
  left join pg_roles grantee on grantee.oid = acl.grantee
  where facts.oid is not null
),
latest_activations as (
  select distinct on (activation.environment, activation.workload)
    activation.environment,
    activation.workload,
    activation.target_revision_id
  from public.openai_workload_configuration_activations activation
  order by
    activation.environment,
    activation.workload,
    activation.activation_number desc
),
checks(check_name, status, details) as (
  select
    'objects_and_columns',
    case when
      (
        select count(*)
        from information_schema.tables target
        where target.table_schema = 'public'
          and target.table_name in (
            'openai_model_catalog_models',
            'openai_model_catalog_parameters'
          )
      ) = 2
      and (
        select count(*)
        from expected_columns expected
        join information_schema.columns actual
          on actual.table_schema = 'public'
          and actual.table_name = expected.table_name
          and actual.column_name = expected.column_name
          and actual.data_type = expected.data_type
          and actual.is_nullable = expected.is_nullable
      ) = (select count(*) from expected_columns)
      and not exists (
        select 1
        from information_schema.columns actual
        where actual.table_schema = 'public'
          and actual.table_name in (
            'openai_model_catalog_models',
            'openai_model_catalog_parameters'
          )
          and not exists (
            select 1
            from expected_columns expected
            where expected.table_name = actual.table_name
              and expected.column_name = actual.column_name
          )
      )
    then 'ok' else 'missing_or_drifted' end,
    jsonb_build_object(
      'expected_columns', (select count(*) from expected_columns),
      'actual_columns', (
        select count(*)
        from information_schema.columns actual
        where actual.table_schema = 'public'
          and actual.table_name in (
            'openai_model_catalog_models',
            'openai_model_catalog_parameters'
          )
      )
    )

  union all

  select
    'constraints_and_indexes',
    case when
      (
        select count(*)
        from expected_constraints expected
        join pg_constraint actual
          on actual.conname = expected.constraint_name
          and actual.connamespace = 'public'::regnamespace
      ) = (select count(*) from expected_constraints)
      and not exists (
        select 1
        from pg_constraint actual
        where actual.conrelid in (
          'public.openai_model_catalog_models'::regclass,
          'public.openai_model_catalog_parameters'::regclass
        )
          and not exists (
            select 1
            from expected_constraints expected
            where expected.constraint_name = actual.conname
          )
      )
      and (
        select count(*)
        from expected_indexes expected
        join pg_indexes actual
          on actual.schemaname = 'public'
          and actual.indexname = expected.index_name
      ) = (select count(*) from expected_indexes)
      and not exists (
        select 1
        from pg_indexes actual
        where actual.schemaname = 'public'
          and actual.tablename in (
            'openai_model_catalog_models',
            'openai_model_catalog_parameters'
          )
          and not exists (
            select 1
            from expected_indexes expected
            where expected.index_name = actual.indexname
          )
      )
      and pg_get_constraintdef((
        select constraint_row.oid
        from pg_constraint constraint_row
        where constraint_row.conname = 'openai_model_catalog_parameters_model_fkey'
          and constraint_row.conrelid = 'public.openai_model_catalog_parameters'::regclass
      )) ilike '%ON UPDATE RESTRICT ON DELETE RESTRICT%'
    then 'ok' else 'missing_or_drifted' end,
    jsonb_build_object(
      'constraints', (
        select jsonb_agg(jsonb_build_object(
          'name', actual.conname,
          'definition', pg_get_constraintdef(actual.oid)
        ) order by actual.conname)
        from pg_constraint actual
        where actual.conrelid in (
          'public.openai_model_catalog_models'::regclass,
          'public.openai_model_catalog_parameters'::regclass
        )
      ),
      'indexes', (
        select jsonb_agg(jsonb_build_object(
          'name', actual.indexname,
          'definition', actual.indexdef
        ) order by actual.indexname)
        from pg_indexes actual
        where actual.schemaname = 'public'
          and actual.tablename in (
            'openai_model_catalog_models',
            'openai_model_catalog_parameters'
          )
      )
    )

  union all

  select
    'bootstrap',
    case when
      not exists (
        select 1
        from expected_models expected
        left join public.openai_model_catalog_models actual
          on actual.modality = expected.modality
          and actual.model = expected.model
        where actual.model is null
      )
      and not exists (
        select 1
        from expected_parameters expected
        left join public.openai_model_catalog_parameters actual
          on actual.modality = expected.modality
          and actual.model = expected.model
          and actual.parameter_kind = expected.parameter_kind
          and actual.parameter_value = expected.parameter_value
        where actual.parameter_value is null
      )
    then 'ok' else 'incomplete' end,
    jsonb_build_object(
      'expected_models', (select count(*) from expected_models),
      'present_expected_models', (
        select count(*)
        from expected_models expected
        join public.openai_model_catalog_models actual
          on actual.modality = expected.modality
          and actual.model = expected.model
      ),
      'expected_parameters', (select count(*) from expected_parameters),
      'present_expected_parameters', (
        select count(*)
        from expected_parameters expected
        join public.openai_model_catalog_parameters actual
          on actual.modality = expected.modality
          and actual.model = expected.model
          and actual.parameter_kind = expected.parameter_kind
          and actual.parameter_value = expected.parameter_value
      ),
      'available_expected_models', (
        select count(*)
        from expected_models expected
        join public.openai_model_catalog_models actual
          on actual.modality = expected.modality
          and actual.model = expected.model
        where actual.available_for_selection
      ),
      'available_expected_parameters', (
        select count(*)
        from expected_parameters expected
        join public.openai_model_catalog_parameters actual
          on actual.modality = expected.modality
          and actual.model = expected.model
          and actual.parameter_kind = expected.parameter_kind
          and actual.parameter_value = expected.parameter_value
        where actual.available_for_selection
      )
    )

  union all

  select
    'catalog_completeness_and_eligibility',
    case when
      not exists (
        select 1
        from public.openai_model_catalog_models model
        where not exists (
          select 1
          from public.openai_model_catalog_parameters parameter
          where parameter.modality = model.modality
            and parameter.model = model.model
        )
      )
      and not exists (
        select 1
        from public.openai_model_catalog_parameters parameter
        where not (
          (
            parameter.modality = 'responses_text'
            and parameter.parameter_kind = 'reasoning_effort'
            and parameter.parameter_value in ('none', 'low', 'medium', 'high', 'xhigh', 'max')
          )
          or (
            parameter.modality = 'image_generation'
            and parameter.parameter_kind = 'quality'
            and parameter.parameter_value in ('low', 'medium', 'high')
          )
        )
      )
    then 'ok' else 'invalid' end,
    jsonb_build_object(
      'models', (select count(*) from public.openai_model_catalog_models),
      'parameters', (select count(*) from public.openai_model_catalog_parameters),
      'eligible_combinations', (
        select count(*)
        from public.openai_model_catalog_parameters parameter
        join public.openai_model_catalog_models model
          on model.modality = parameter.modality
          and model.model = parameter.model
        where model.available_for_selection
          and parameter.available_for_selection
      ),
      'models_without_parameters', (
        select count(*)
        from public.openai_model_catalog_models model
        where not exists (
          select 1
          from public.openai_model_catalog_parameters parameter
          where parameter.modality = model.modality
            and parameter.model = model.model
        )
      )
    )

  union all

  select
    'lifecycle_preservation_and_shape',
    case when
      not exists (
        select 1
        from pg_constraint constraint_row
        where constraint_row.conrelid in (
          'public.openai_workload_operational_configurations'::regclass,
          'public.openai_workload_configuration_revisions'::regclass,
          'public.openai_workload_configuration_activations'::regclass
        )
          and constraint_row.confrelid in (
            'public.openai_model_catalog_models'::regclass,
            'public.openai_model_catalog_parameters'::regclass
          )
      )
      and not exists (
        select 1
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
        where active_revision.id is null
          or (
            configuration.pending_revision_id is not null
            and pending_revision.id is null
          )
          or latest.target_revision_id is distinct from configuration.active_revision_id
      )
      and not exists (
        select 1
        from pg_constraint constraint_row
        where constraint_row.conname in (
          'openai_workload_configuration_revisions_shape_chk',
          'openai_workload_operational_configurations_candidate_completeness_chk'
        )
          and pg_get_constraintdef(constraint_row.oid) ~ 'gpt-[0-9]'
      )
    then 'ok' else 'invalid_or_coupled' end,
    jsonb_build_object(
      'operational_units', (
        select count(*) from public.openai_workload_operational_configurations
      ),
      'historical_revisions', (
        select count(*) from public.openai_workload_configuration_revisions
      ),
      'activation_events', (
        select count(*) from public.openai_workload_configuration_activations
      ),
      'historical_revisions_currently_unavailable', (
        select count(*)
        from public.openai_workload_configuration_revisions revision
        left join public.openai_model_catalog_models model
          on model.modality = revision.modality
          and model.model = revision.model
        left join public.openai_model_catalog_parameters parameter
          on parameter.modality = revision.modality
          and parameter.model = revision.model
          and parameter.parameter_kind = case
            when revision.modality = 'responses_text' then 'reasoning_effort'
            when revision.modality = 'image_generation' then 'quality'
          end
          and parameter.parameter_value = case
            when revision.modality = 'responses_text' then revision.reasoning_effort
            when revision.modality = 'image_generation' then revision.quality
          end
        where not coalesce(model.available_for_selection, false)
          or not coalesce(parameter.available_for_selection, false)
      )
    )

  union all

  select
    'rls_policies_and_exact_table_acls',
    case when
      (
        select count(*)
        from pg_class target
        where target.oid in (
          'public.openai_model_catalog_models'::regclass,
          'public.openai_model_catalog_parameters'::regclass
        )
          and target.relrowsecurity
      ) = 2
      and not exists (
        select 1
        from pg_policies policy
        where policy.schemaname = 'public'
          and policy.tablename in (
            'openai_model_catalog_models',
            'openai_model_catalog_parameters'
          )
      )
      and (
        select count(*)
        from catalog_table_acls acl
        where acl.grantee_name = 'service_role'
          and acl.privilege_type in ('SELECT', 'INSERT', 'UPDATE')
          and not acl.is_grantable
      ) = 6
      and not exists (
        select 1
        from catalog_table_acls acl
        where acl.grantee <> acl.relowner
          and (
            acl.grantee_name <> 'service_role'
            or acl.privilege_type not in ('SELECT', 'INSERT', 'UPDATE')
            or acl.is_grantable
          )
      )
    then 'ok' else 'mismatch' end,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'table', acl.table_name,
        'grantee', acl.grantee_name,
        'privilege', acl.privilege_type,
        'grantable', acl.is_grantable
      ) order by acl.table_name, acl.grantee_name, acl.privilege_type)
      from catalog_table_acls acl
      where acl.grantee <> acl.relowner
    ), '[]'::jsonb)

  union all

  select
    'rpc_shapes_and_exact_acls',
    case when
      (select count(*) from rpc_facts where oid is not null) = (select count(*) from expected_rpcs)
      and not exists (
        select 1
        from rpc_facts facts
        where facts.oid is null
          or facts.prosecdef
          or not coalesce(facts.proconfig @> array['search_path=pg_catalog'], false)
          or facts.provolatile <> facts.expected_volatility
          or lower(facts.actual_result) <> lower(facts.expected_result)
      )
      and (
        select count(*)
        from rpc_acls acl
        where acl.grantee_name = 'service_role'
          and acl.privilege_type = 'EXECUTE'
          and not acl.is_grantable
      ) = (select count(*) from expected_rpcs)
      and not exists (
        select 1
        from rpc_acls acl
        where acl.grantee <> acl.proowner
          and (
            acl.grantee_name <> 'service_role'
            or acl.privilege_type <> 'EXECUTE'
            or acl.is_grantable
          )
      )
      and (select count(*) from trigger_helper_facts where oid is not null)
        = (select count(*) from expected_trigger_helpers)
      and not exists (
        select 1
        from trigger_helper_facts facts
        where facts.oid is null
          or facts.prosecdef
          or not coalesce(facts.proconfig @> array['search_path=pg_catalog'], false)
      )
      and not exists (
        select 1
        from trigger_helper_acls acl
        where acl.grantee <> acl.proowner
      )
    then 'ok' else 'mismatch' end,
    jsonb_build_object(
      'rpcs', (
        select jsonb_agg(jsonb_build_object(
          'signature', facts.function_signature,
          'result', facts.actual_result,
          'security_invoker', not facts.prosecdef,
          'volatility', facts.provolatile,
          'fixed_search_path', coalesce(facts.proconfig @> array['search_path=pg_catalog'], false),
          'definition_has_for_update', lower(facts.definition) like '%for update%'
        ) order by facts.function_signature)
        from rpc_facts facts
      ),
      'trigger_helpers', (
        select jsonb_agg(jsonb_build_object(
          'signature', facts.function_signature,
          'security_invoker', not facts.prosecdef,
          'fixed_search_path', coalesce(facts.proconfig @> array['search_path=pg_catalog'], false),
          'non_owner_execute_grants', (
            select count(*)
            from trigger_helper_acls acl
            where acl.function_signature = facts.function_signature
              and acl.grantee <> acl.proowner
          )
        ) order by facts.function_signature)
        from trigger_helper_facts facts
      )
    )

  union all

  select
    'triggers_lock_order_and_read_only_preflight',
    case when
      (
        select count(*)
        from pg_trigger trigger_row
        where trigger_row.tgrelid in (
          'public.openai_model_catalog_models'::regclass,
          'public.openai_model_catalog_parameters'::regclass
        )
          and not trigger_row.tgisinternal
          and trigger_row.tgenabled <> 'D'
          and trigger_row.tgname in (
            'openai_model_catalog_models_prevent_delete',
            'openai_model_catalog_parameters_prevent_delete',
            'openai_model_catalog_model_has_parameter'
          )
      ) = 3
      and (
        select
          strpos(lower(facts.definition), 'from public.openai_workload_operational_configurations')
          < strpos(lower(facts.definition), 'from public.openai_model_catalog_models')
          and strpos(lower(facts.definition), 'from public.openai_model_catalog_models')
          < strpos(lower(facts.definition), 'from public.openai_model_catalog_parameters')
          and (length(lower(facts.definition)) - length(replace(lower(facts.definition), 'for update', ''))) / 10 = 3
        from rpc_facts facts
        where facts.function_signature = 'public.save_openai_workload_configuration_candidate_v1(text,text,text,text,text,uuid,bigint)'
      )
      and (
        select
          strpos(lower(facts.definition), 'from public.openai_workload_operational_configurations')
          < strpos(lower(facts.definition), 'from public.openai_model_catalog_models')
          and strpos(lower(facts.definition), 'from public.openai_model_catalog_models')
          < strpos(lower(facts.definition), 'from public.openai_model_catalog_parameters')
          and (length(lower(facts.definition)) - length(replace(lower(facts.definition), 'for update', ''))) / 10 = 3
        from rpc_facts facts
        where facts.function_signature = 'public.promote_openai_workload_configuration_candidate_v1(text,text,jsonb,uuid,bigint)'
      )
      and (
        select lower(facts.definition) not like '%for update%'
        from rpc_facts facts
        where facts.function_signature = 'public.check_openai_model_catalog_configuration_available_v1(text,text,bigint)'
      )
    then 'ok' else 'mismatch' end,
    jsonb_build_object(
      'triggers', (
        select jsonb_agg(jsonb_build_object(
          'table', target.relname,
          'trigger', trigger_row.tgname,
          'enabled', trigger_row.tgenabled,
          'definition', pg_get_triggerdef(trigger_row.oid)
        ) order by target.relname, trigger_row.tgname)
        from pg_trigger trigger_row
        join pg_class target on target.oid = trigger_row.tgrelid
        where trigger_row.tgrelid in (
          'public.openai_model_catalog_models'::regclass,
          'public.openai_model_catalog_parameters'::regclass
        )
          and not trigger_row.tgisinternal
      ),
      'lock_order', 'unit -> model -> parameter',
      'proof_preflight_lock_free', (
        select lower(facts.definition) not like '%for update%'
        from rpc_facts facts
        where facts.function_signature = 'public.check_openai_model_catalog_configuration_available_v1(text,text,bigint)'
      )
    )
)
select check_name, status, details
from checks
order by check_name;

rollback;
