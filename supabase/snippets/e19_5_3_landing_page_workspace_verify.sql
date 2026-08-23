-- Fails closed unless 20260822170000_e19_5_3_landing_page_workspace.sql
-- is applied with the complete E19.5.3 contract in the target environment.
do $$
declare
  v_signature text;
  v_function oid;
begin
  if to_regclass('public.account_landing_page_shared_configurations') is null
     or to_regclass('public.account_landing_page_configurations') is null then
    raise exception 'E19.5.3 configuration residences are missing';
  end if;

  if exists (
    with expected(
      table_name, column_name, data_type, is_nullable, default_fragment
    ) as (
      values
        ('account_landing_page_shared_configurations', 'account_id', 'uuid', 'NO', null),
        ('account_landing_page_shared_configurations', 'catalog_version', 'integer', 'NO', null),
        ('account_landing_page_shared_configurations', 'values', 'jsonb', 'NO', '''{}''::jsonb'),
        ('account_landing_page_shared_configurations', 'revision', 'bigint', 'NO', '1'),
        ('account_landing_page_shared_configurations', 'created_by', 'uuid', 'NO', null),
        ('account_landing_page_shared_configurations', 'updated_by', 'uuid', 'NO', null),
        ('account_landing_page_shared_configurations', 'created_at', 'timestamp with time zone', 'NO', 'now()'),
        ('account_landing_page_shared_configurations', 'updated_at', 'timestamp with time zone', 'NO', 'now()'),
        ('account_landing_page_configurations', 'landing_page_id', 'uuid', 'NO', null),
        ('account_landing_page_configurations', 'account_id', 'uuid', 'NO', null),
        ('account_landing_page_configurations', 'catalog_version', 'integer', 'NO', null),
        ('account_landing_page_configurations', 'values', 'jsonb', 'NO', '''{}''::jsonb'),
        ('account_landing_page_configurations', 'revision', 'bigint', 'NO', '1'),
        ('account_landing_page_configurations', 'created_by', 'uuid', 'NO', null),
        ('account_landing_page_configurations', 'updated_by', 'uuid', 'NO', null),
        ('account_landing_page_configurations', 'created_at', 'timestamp with time zone', 'NO', 'now()'),
        ('account_landing_page_configurations', 'updated_at', 'timestamp with time zone', 'NO', 'now()')
    ), actual as (
      select table_name, column_name, data_type, is_nullable, column_default
      from information_schema.columns
      where table_schema = 'public'
        and table_name in (
          'account_landing_page_shared_configurations',
          'account_landing_page_configurations'
        )
    )
    select 1
    from expected
    full join actual using (table_name, column_name)
    where expected.column_name is null
       or actual.column_name is null
       or actual.data_type is distinct from expected.data_type
       or actual.is_nullable is distinct from expected.is_nullable
       or (
         expected.default_fragment is null
         and actual.column_default is not null
       )
       or (
         expected.default_fragment is not null
         and position(expected.default_fragment in coalesce(actual.column_default, '')) = 0
       )
  ) then
    raise exception 'E19.5.3 residence columns or defaults drifted';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'account_landing_pages'
      and column_name = 'approved_materialization_id'
      and data_type = 'uuid'
      and is_nullable = 'YES'
      and column_default is null
  ) then
    raise exception 'E19.5.3 approval pointer column drifted';
  end if;

  if exists (
    with expected(table_name, constraint_name, constraint_type) as (
      values
        ('account_landing_page_shared_configurations', 'account_landing_page_shared_configurations_pkey', 'p'),
        ('account_landing_page_shared_configurations', 'account_landing_page_shared_configurations_account_fkey', 'f'),
        ('account_landing_page_shared_configurations', 'account_landing_page_shared_configurations_created_by_fkey', 'f'),
        ('account_landing_page_shared_configurations', 'account_landing_page_shared_configurations_updated_by_fkey', 'f'),
        ('account_landing_page_shared_configurations', 'account_landing_page_shared_configurations_catalog_chk', 'c'),
        ('account_landing_page_shared_configurations', 'account_landing_page_shared_configurations_revision_chk', 'c'),
        ('account_landing_page_shared_configurations', 'account_landing_page_shared_configurations_values_chk', 'c'),
        ('account_landing_page_configurations', 'account_landing_page_configurations_pkey', 'p'),
        ('account_landing_page_configurations', 'account_landing_page_configurations_landing_page_fkey', 'f'),
        ('account_landing_page_configurations', 'account_landing_page_configurations_account_fkey', 'f'),
        ('account_landing_page_configurations', 'account_landing_page_configurations_created_by_fkey', 'f'),
        ('account_landing_page_configurations', 'account_landing_page_configurations_updated_by_fkey', 'f'),
        ('account_landing_page_configurations', 'account_landing_page_configurations_catalog_chk', 'c'),
        ('account_landing_page_configurations', 'account_landing_page_configurations_revision_chk', 'c'),
        ('account_landing_page_configurations', 'account_landing_page_configurations_values_chk', 'c')
    )
    select 1
    from expected
    left join pg_constraint constraint_object
      on constraint_object.conrelid = to_regclass('public.' || expected.table_name)
      and constraint_object.conname = expected.constraint_name
      and constraint_object.contype = expected.constraint_type::"char"
    where constraint_object.oid is null
  ) then
    raise exception 'E19.5.3 residence constraints are incomplete';
  end if;

  if exists (
    with expected(constraint_name, definition) as (
      values
        ('account_landing_page_shared_configurations_account_fkey', 'foreign key (account_id) references accounts(id) on update cascade on delete cascade'),
        ('account_landing_page_shared_configurations_created_by_fkey', 'foreign key (created_by) references auth.users(id) on update cascade on delete restrict'),
        ('account_landing_page_shared_configurations_updated_by_fkey', 'foreign key (updated_by) references auth.users(id) on update cascade on delete restrict'),
        ('account_landing_page_configurations_landing_page_fkey', 'foreign key (landing_page_id, account_id) references account_landing_pages(id, account_id) on update cascade on delete cascade'),
        ('account_landing_page_configurations_account_fkey', 'foreign key (account_id) references accounts(id) on update cascade on delete cascade'),
        ('account_landing_page_configurations_created_by_fkey', 'foreign key (created_by) references auth.users(id) on update cascade on delete restrict'),
        ('account_landing_page_configurations_updated_by_fkey', 'foreign key (updated_by) references auth.users(id) on update cascade on delete restrict')
    )
    select 1
    from expected
    left join pg_constraint constraint_object
      on constraint_object.conname = expected.constraint_name
      and constraint_object.connamespace = 'public'::regnamespace
    where constraint_object.oid is null
       or regexp_replace(lower(pg_get_constraintdef(constraint_object.oid)), '\s+', ' ', 'g') <> expected.definition
  ) then
    raise exception 'E19.5.3 residence foreign key definitions drifted';
  end if;

  if not exists (
       select 1 from pg_constraint
       where conrelid = 'public.account_landing_page_shared_configurations'::regclass
         and conname = 'account_landing_page_shared_configurations_pkey'
         and pg_get_constraintdef(oid) = 'PRIMARY KEY (account_id)'
     )
     or not exists (
       select 1 from pg_constraint
       where conrelid = 'public.account_landing_page_configurations'::regclass
         and conname = 'account_landing_page_configurations_pkey'
         and pg_get_constraintdef(oid) = 'PRIMARY KEY (landing_page_id)'
     )
     or not exists (
       select 1 from pg_constraint
       where conrelid = 'public.account_landing_page_shared_configurations'::regclass
         and conname = 'account_landing_page_shared_configurations_catalog_chk'
         and pg_get_constraintdef(oid) ilike '%catalog_version > 0%'
     )
     or not exists (
       select 1 from pg_constraint
       where conrelid = 'public.account_landing_page_shared_configurations'::regclass
         and conname = 'account_landing_page_shared_configurations_revision_chk'
         and pg_get_constraintdef(oid) ilike '%revision > 0%'
     )
     or not exists (
       select 1 from pg_constraint
       where conrelid = 'public.account_landing_page_shared_configurations'::regclass
         and conname = 'account_landing_page_shared_configurations_values_chk'
         and pg_get_constraintdef(oid) ilike '%e19_5_configuration_values_have_scopes%'
         and pg_get_constraintdef(oid) ilike '%account%business%'
     )
     or not exists (
       select 1 from pg_constraint
       where conrelid = 'public.account_landing_page_configurations'::regclass
         and conname = 'account_landing_page_configurations_catalog_chk'
         and pg_get_constraintdef(oid) ilike '%catalog_version > 0%'
     )
     or not exists (
       select 1 from pg_constraint
       where conrelid = 'public.account_landing_page_configurations'::regclass
         and conname = 'account_landing_page_configurations_revision_chk'
         and pg_get_constraintdef(oid) ilike '%revision > 0%'
     )
     or not exists (
       select 1 from pg_constraint
       where conrelid = 'public.account_landing_page_configurations'::regclass
         and conname = 'account_landing_page_configurations_values_chk'
         and pg_get_constraintdef(oid) ilike '%e19_5_configuration_values_have_scopes%'
         and pg_get_constraintdef(oid) ilike '%offer%campaign%landing_page%'
     ) then
    raise exception 'E19.5.3 primary key or check definitions drifted';
  end if;

  if not exists (
       select 1 from pg_index
       where indexrelid = to_regclass('public.account_landing_page_configurations_account_idx')
         and indisvalid and indisready
         and pg_get_indexdef(indexrelid) ilike '%(account_id, landing_page_id)%'
     )
     or not exists (
       select 1 from pg_index
       where indexrelid = to_regclass('public.account_landing_pages_account_status_updated_idx')
         and indisvalid and indisready
         and pg_get_indexdef(indexrelid) ilike '%(account_id, status, updated_at desc, id)%'
     )
     or not exists (
       select 1 from pg_index
       where indexrelid = to_regclass('public.account_landing_page_materializations_id_landing_page_account_key')
         and indisvalid and indisready and indisunique
         and pg_get_indexdef(indexrelid) ilike '%(id, landing_page_id, account_id)%'
     ) then
    raise exception 'E19.5.3 required indexes drifted';
  end if;

  if not exists (
       select 1 from information_schema.triggers
       where event_object_schema = 'public'
         and event_object_table = 'account_landing_page_shared_configurations'
         and trigger_name = 'account_landing_page_shared_configurations_set_updated_at'
         and action_timing = 'BEFORE'
         and event_manipulation = 'UPDATE'
         and action_orientation = 'ROW'
         and action_statement ilike '%tg_set_updated_at%'
     )
     or not exists (
       select 1 from information_schema.triggers
       where event_object_schema = 'public'
         and event_object_table = 'account_landing_page_configurations'
         and trigger_name = 'account_landing_page_configurations_set_updated_at'
         and action_timing = 'BEFORE'
         and event_manipulation = 'UPDATE'
         and action_orientation = 'ROW'
         and action_statement ilike '%tg_set_updated_at%'
     ) then
    raise exception 'E19.5.3 updated_at triggers drifted';
  end if;

  if not coalesce((select relrowsecurity from pg_class where oid = 'public.account_landing_page_shared_configurations'::regclass), false)
     or not coalesce((select relrowsecurity from pg_class where oid = 'public.account_landing_page_configurations'::regclass), false)
     or (select pg_get_userbyid(relowner) <> 'postgres' from pg_class where oid = 'public.account_landing_page_shared_configurations'::regclass)
     or (select pg_get_userbyid(relowner) <> 'postgres' from pg_class where oid = 'public.account_landing_page_configurations'::regclass)
     or exists (
       select 1 from pg_policies
       where schemaname = 'public'
         and tablename in ('account_landing_page_shared_configurations', 'account_landing_page_configurations')
     ) then
    raise exception 'E19.5.3 RLS or no-policy contract drifted';
  end if;

  if exists (
    select 1
    from pg_class table_object
    cross join lateral aclexplode(
      coalesce(table_object.relacl, acldefault('r', table_object.relowner))
    ) privilege
    where table_object.oid in (
      'public.account_landing_page_shared_configurations'::regclass,
      'public.account_landing_page_configurations'::regclass
    )
      and (
        privilege.grantee = 0
        or privilege.grantee in (
          select role_object.oid
          from pg_roles role_object
          where role_object.rolname in ('anon', 'authenticated', 'ai_readonly')
        )
      )
  ) then
    raise exception 'E19.5.3 external table ACLs drifted';
  end if;

  if exists (
    select 1
    from pg_class table_object
    left join lateral (
      select
        array_agg(
          distinct privilege.privilege_type
          order by privilege.privilege_type
        ) as privileges,
        bool_or(privilege.is_grantable) as has_grant_option
      from aclexplode(
        coalesce(table_object.relacl, acldefault('r', table_object.relowner))
      ) privilege
      where privilege.grantee = to_regrole('service_role')
    ) service_acl on true
    where table_object.oid in (
      'public.account_landing_page_shared_configurations'::regclass,
      'public.account_landing_page_configurations'::regclass
    )
      and (
        service_acl.privileges is distinct from array['INSERT', 'SELECT', 'UPDATE']::text[]
        or coalesce(service_acl.has_grant_option, false)
      )
  ) then
    raise exception 'E19.5.3 service_role table ACLs drifted';
  end if;

  foreach v_signature in array array[
    'public.save_account_landing_page_configuration_v1(uuid,uuid,jsonb,jsonb,bigint,bigint,integer,uuid,uuid)',
    'public.approve_account_landing_page_materialization_v1(uuid,uuid,uuid,uuid)',
    'public.append_account_landing_page_materialization_v2(uuid,uuid,uuid,jsonb,jsonb,uuid,bigint,bigint)'
  ] loop
    v_function := to_regprocedure(v_signature);
    if v_function is null then
      raise exception 'E19.5.3 RPC missing: %', v_signature;
    end if;
    if (
         select procedure.prosecdef
            or procedure.provolatile <> 'v'
            or pg_get_userbyid(procedure.proowner) <> 'postgres'
            or pg_get_functiondef(procedure.oid) not ilike '%security invoker%'
            or pg_get_functiondef(procedure.oid) not ilike '%set search_path to ''public'', ''pg_catalog''%'
         from pg_proc procedure
         where procedure.oid = v_function
       ) then
      raise exception 'E19.5.3 RPC metadata drifted: %', v_signature;
    end if;
    if not has_function_privilege('service_role', v_function, 'EXECUTE')
       or has_function_privilege('anon', v_function, 'EXECUTE')
       or has_function_privilege('authenticated', v_function, 'EXECUTE') then
      raise exception 'E19.5.3 RPC execute grants drifted: %', v_signature;
    end if;
    if exists (
      select 1
      from pg_proc procedure
      cross join lateral aclexplode(
        coalesce(procedure.proacl, acldefault('f', procedure.proowner))
      ) privilege
      where procedure.oid = v_function
        and privilege.grantee = 0
        and privilege.privilege_type = 'EXECUTE'
    ) then
      raise exception 'E19.5.3 PUBLIC must not execute: %', v_signature;
    end if;
    if to_regrole('ai_readonly') is not null
       and has_function_privilege('ai_readonly', v_function, 'EXECUTE') then
      raise exception 'E19.5.3 ai_readonly must not execute: %', v_signature;
    end if;
  end loop;

  v_signature := 'public.e19_5_actor_can_manage(uuid,uuid)';
  v_function := to_regprocedure(v_signature);
  if v_function is null
     or not (select prosecdef from pg_proc where oid = v_function)
     or (select provolatile <> 's' from pg_proc where oid = v_function)
     or (select prorettype <> 'boolean'::regtype from pg_proc where oid = v_function)
     or (select prolang <> (select oid from pg_language where lanname = 'sql') from pg_proc where oid = v_function)
     or (select pg_get_userbyid(proowner) <> 'postgres' from pg_proc where oid = v_function)
     or pg_get_functiondef(v_function) not ilike '%security definer%'
     or pg_get_functiondef(v_function) not ilike '%set search_path to ''public'', ''pg_catalog''%'
     or not has_function_privilege('service_role', v_function, 'EXECUTE')
     or has_function_privilege('anon', v_function, 'EXECUTE')
     or has_function_privilege('authenticated', v_function, 'EXECUTE') then
    raise exception 'E19.5.3 actor helper metadata or grants drifted';
  end if;

  v_signature := 'public.e19_5_configuration_values_have_scopes(jsonb,text[])';
  v_function := to_regprocedure(v_signature);
  if v_function is null
     or (select prosecdef from pg_proc where oid = v_function)
     or (select provolatile <> 'i' from pg_proc where oid = v_function)
     or (select prorettype <> 'boolean'::regtype from pg_proc where oid = v_function)
     or (select prolang <> (select oid from pg_language where lanname = 'sql') from pg_proc where oid = v_function)
     or (select pg_get_userbyid(proowner) <> 'postgres' from pg_proc where oid = v_function)
     or pg_get_functiondef(v_function) not ilike '%security invoker%'
     or pg_get_functiondef(v_function) not ilike '%set search_path to ''pg_catalog''%'
     or not has_function_privilege('service_role', v_function, 'EXECUTE')
     or has_function_privilege('anon', v_function, 'EXECUTE')
     or has_function_privilege('authenticated', v_function, 'EXECUTE') then
    raise exception 'E19.5.3 scope helper metadata or grants drifted';
  end if;

  if exists (
    select 1
    from pg_proc procedure
    cross join lateral aclexplode(
      coalesce(procedure.proacl, acldefault('f', procedure.proowner))
    ) privilege
    where procedure.oid in (
      'public.e19_5_actor_can_manage(uuid,uuid)'::regprocedure,
      'public.e19_5_configuration_values_have_scopes(jsonb,text[])'::regprocedure
    )
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ) then
    raise exception 'E19.5.3 PUBLIC helper grants drifted';
  end if;

  if to_regrole('ai_readonly') is not null
     and (
       has_function_privilege('ai_readonly', 'public.e19_5_actor_can_manage(uuid,uuid)', 'EXECUTE')
       or has_function_privilege('ai_readonly', 'public.e19_5_configuration_values_have_scopes(jsonb,text[])', 'EXECUTE')
     ) then
    raise exception 'E19.5.3 ai_readonly helper grants drifted';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.account_landing_pages'::regclass
      and conname = 'account_landing_pages_approved_materialization_fkey'
      and condeferrable
      and condeferred
      and confrelid = 'public.account_landing_page_materializations'::regclass
      and confupdtype = 'r'
      and confdeltype = 'a'
      and pg_get_constraintdef(oid) ilike 'FOREIGN KEY (approved_materialization_id, id, account_id) REFERENCES account_landing_page_materializations(id, landing_page_id, account_id)%'
  ) or not exists (
    select 1 from pg_constraint
    where conrelid = 'public.account_landing_page_materializations'::regclass
      and conname = 'account_landing_page_materializations_id_landing_page_account_key'
      and contype = 'u'
      and pg_get_constraintdef(oid) = 'UNIQUE (id, landing_page_id, account_id)'
  ) then
    raise exception 'E19.5.3 tenant-safe approval constraints drifted';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name in ('account_landing_page_shared_configurations', 'account_landing_page_configurations')
      and column_name in ('is_initialized', 'is_complete', 'status')
  ) then
    raise exception 'E19.5.3 eager state columns are forbidden';
  end if;
end;
$$;

select 'E19.5.3 workspace contract verified' as result;
