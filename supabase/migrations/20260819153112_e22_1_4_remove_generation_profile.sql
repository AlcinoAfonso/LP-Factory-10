begin;

set local lock_timeout = '5s';

lock table public.landing_page_generation_profiles,
  public.landing_page_generation_profile_items
in access exclusive mode;

do $gate$
declare
  v_profile_id constant uuid := 'c211015e-d9c6-4241-a29a-7cd41e93b8fc';
  v_profile_ids uuid[];
  v_item_ids uuid[];
  v_relation_names text[];
  v_function_signatures text[];
  v_constraint_names text[];
  v_index_names text[];
  v_trigger_inventory text[];
  v_runtime_grants text[];
  v_function_grants text[];
  v_count bigint;
begin
  select array_agg(profile.id order by profile.id)
  into v_profile_ids
  from public.landing_page_generation_profiles profile;

  if v_profile_ids is distinct from array[v_profile_id]::uuid[]
    or not exists (
      select 1
      from public.landing_page_generation_profiles profile
      join public.business_taxons taxon on taxon.id = profile.owner_taxon_id
      where profile.id = v_profile_id
        and profile.status = 'active'
        and taxon.slug = 'corretor-imoveis'
    ) then
    raise exception 'E22_1_4_PROFILE_DRIFT';
  end if;

  select array_agg(item.id order by item.id)
  into v_item_ids
  from public.landing_page_generation_profile_items item;

  if v_item_ids is distinct from array[
    '24aa1490-626d-4b27-85e6-48418671974d'::uuid,
    '4720c93d-514d-40d1-87db-90efed8e41ae'::uuid,
    '58d75fdc-7fb8-457a-afbf-a27646d1db2f'::uuid,
    '68e594b6-edc2-4a29-9d0a-1c5c84228f10'::uuid,
    '6f8cddf0-75f5-4b3b-9763-7b0b3c2d1cab'::uuid,
    'b575de6a-6e36-4a70-bb23-61f1da2135e1'::uuid,
    'b8bec193-8dea-40ec-9409-788514d3579b'::uuid,
    'd0a7a193-d77d-4e92-b97d-d3c99c4f2f9d'::uuid,
    'd44b6eff-a320-4a3e-a14f-9bb03b112991'::uuid,
    'de85639a-adaf-4338-81e9-0674da2a4c34'::uuid,
    'e64ab82e-c51b-4b39-9220-c130e0317f91'::uuid
  ]::uuid[]
    or exists (
      select 1
      from public.landing_page_generation_profile_items item
      where item.profile_id <> v_profile_id
    ) then
    raise exception 'E22_1_4_PROFILE_ITEM_DRIFT';
  end if;

  select array_agg(relation.relname order by relation.relname)
  into v_relation_names
  from pg_class relation
  join pg_namespace namespace on namespace.oid = relation.relnamespace
  where namespace.nspname = 'public'
    and relation.relname in (
      'landing_page_generation_profiles',
      'landing_page_generation_profile_items'
    )
    and relation.relkind in ('r', 'p');

  if v_relation_names is distinct from array[
    'landing_page_generation_profile_items',
    'landing_page_generation_profiles'
  ]::text[] then
    raise exception 'E22_1_4_TABLE_DRIFT';
  end if;

  select array_agg(
    format('%s(%s)', procedure.proname, oidvectortypes(procedure.proargtypes))
    order by procedure.proname, oidvectortypes(procedure.proargtypes)
  )
  into v_function_signatures
  from pg_proc procedure
  join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.proname in (
      'save_landing_page_generation_profile_draft',
      'activate_landing_page_generation_profile',
      'archive_landing_page_generation_profile',
      'get_landing_page_generation_profile_lifecycle_status'
    );

  if v_function_signatures is distinct from array[
    'activate_landing_page_generation_profile(uuid, timestamp with time zone)',
    'archive_landing_page_generation_profile(uuid, timestamp with time zone)',
    'get_landing_page_generation_profile_lifecycle_status()',
    'save_landing_page_generation_profile_draft(uuid, uuid, timestamp with time zone, text, jsonb, text, uuid, text, jsonb)'
  ]::text[] then
    raise exception 'E22_1_4_RPC_DRIFT';
  end if;

  select array_agg(constraint_object.conname order by constraint_object.conname)
  into v_constraint_names
  from pg_constraint constraint_object
  where constraint_object.conrelid in (
    'public.landing_page_generation_profiles'::regclass,
    'public.landing_page_generation_profile_items'::regclass
  );

  if v_constraint_names is distinct from array[
    'landing_page_generation_profile_items_guidance_chk',
    'landing_page_generation_profile_items_module_key_chk',
    'landing_page_generation_profile_items_module_version_chk',
    'landing_page_generation_profile_items_order_chk',
    'landing_page_generation_profile_items_pkey',
    'landing_page_generation_profile_items_priority_chk',
    'landing_page_generation_profile_items_profile_id_fkey',
    'landing_page_generation_profile_items_profile_module_uidx',
    'landing_page_generation_profile_items_profile_order_uidx',
    'landing_page_generation_profile_items_variant_key_chk',
    'landing_page_generation_profile_items_variant_pair_chk',
    'landing_page_generation_profile_items_variant_version_chk',
    'landing_page_generation_profiles_guidance_chk',
    'landing_page_generation_profiles_owner_taxon_id_fkey',
    'landing_page_generation_profiles_owner_version_uidx',
    'landing_page_generation_profiles_pkey',
    'landing_page_generation_profiles_status_chk',
    'landing_page_generation_profiles_version_chk'
  ]::text[] then
    raise exception 'E22_1_4_CONSTRAINT_DRIFT';
  end if;

  select array_agg(index_relation.relname order by index_relation.relname)
  into v_index_names
  from pg_index index_object
  join pg_class index_relation on index_relation.oid = index_object.indexrelid
  where index_object.indrelid in (
    'public.landing_page_generation_profiles'::regclass,
    'public.landing_page_generation_profile_items'::regclass
  );

  if v_index_names is distinct from array[
    'landing_page_generation_profile_items_pkey',
    'landing_page_generation_profile_items_profile_module_uidx',
    'landing_page_generation_profile_items_profile_order_uidx',
    'landing_page_generation_profiles_one_active_owner_idx',
    'landing_page_generation_profiles_owner_version_uidx',
    'landing_page_generation_profiles_pkey'
  ]::text[] then
    raise exception 'E22_1_4_INDEX_DRIFT';
  end if;

  select array_agg(
    format('%s:%s.%s', trigger_object.tgname, function_namespace.nspname, trigger_function.proname)
    order by trigger_object.tgname
  )
  into v_trigger_inventory
  from pg_trigger trigger_object
  join pg_proc trigger_function on trigger_function.oid = trigger_object.tgfoid
  join pg_namespace function_namespace on function_namespace.oid = trigger_function.pronamespace
  where not trigger_object.tgisinternal
    and trigger_object.tgrelid in (
      'public.landing_page_generation_profiles'::regclass,
      'public.landing_page_generation_profile_items'::regclass
    );

  if v_trigger_inventory is distinct from array[
    'landing_page_generation_profile_items_set_updated_at:public.tg_set_updated_at',
    'landing_page_generation_profiles_set_updated_at:public.tg_set_updated_at'
  ]::text[] then
    raise exception 'E22_1_4_TRIGGER_DRIFT';
  end if;

  if exists (
    select 1
    from pg_class relation
    where relation.oid in (
      'public.landing_page_generation_profiles'::regclass,
      'public.landing_page_generation_profile_items'::regclass
    )
      and not relation.relrowsecurity
  ) or exists (
    select 1
    from pg_policy policy
    where policy.polrelid in (
      'public.landing_page_generation_profiles'::regclass,
      'public.landing_page_generation_profile_items'::regclass
    )
  ) then
    raise exception 'E22_1_4_RLS_DRIFT';
  end if;

  select array_agg(
    format('%s:%s:%s', privilege.table_name, privilege.grantee, privilege.privilege_type)
    order by privilege.table_name, privilege.grantee, privilege.privilege_type
  )
  into v_runtime_grants
  from information_schema.table_privileges privilege
  where privilege.table_schema = 'public'
    and privilege.table_name in (
      'landing_page_generation_profiles',
      'landing_page_generation_profile_items'
    )
    and privilege.grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role', 'ai_readonly');

  if v_runtime_grants is distinct from array[
    'landing_page_generation_profile_items:service_role:SELECT',
    'landing_page_generation_profiles:service_role:SELECT'
  ]::text[] then
    raise exception 'E22_1_4_TABLE_GRANT_DRIFT';
  end if;

  select array_agg(
    format(
      '%s(%s):%s:%s',
      procedure.proname,
      oidvectortypes(procedure.proargtypes),
      coalesce(grantee.rolname, 'PUBLIC'),
      privilege.privilege_type
    )
    order by procedure.proname, oidvectortypes(procedure.proargtypes), coalesce(grantee.rolname, 'PUBLIC')
  )
  into v_function_grants
  from pg_proc procedure
  join pg_namespace namespace on namespace.oid = procedure.pronamespace
  cross join lateral aclexplode(coalesce(procedure.proacl, acldefault('f', procedure.proowner))) privilege
  left join pg_roles grantee on grantee.oid = privilege.grantee
  where namespace.nspname = 'public'
    and procedure.proname in (
      'save_landing_page_generation_profile_draft',
      'activate_landing_page_generation_profile',
      'archive_landing_page_generation_profile',
      'get_landing_page_generation_profile_lifecycle_status'
    )
    and coalesce(grantee.rolname, 'PUBLIC') in (
      'PUBLIC',
      'anon',
      'authenticated',
      'service_role',
      'ai_readonly'
    );

  if v_function_grants is distinct from array[
    'activate_landing_page_generation_profile(uuid, timestamp with time zone):authenticated:EXECUTE',
    'archive_landing_page_generation_profile(uuid, timestamp with time zone):authenticated:EXECUTE',
    'get_landing_page_generation_profile_lifecycle_status():authenticated:EXECUTE',
    'save_landing_page_generation_profile_draft(uuid, uuid, timestamp with time zone, text, jsonb, text, uuid, text, jsonb):authenticated:EXECUTE'
  ]::text[] then
    raise exception 'E22_1_4_FUNCTION_GRANT_DRIFT';
  end if;

  select count(*)
  into v_count
  from pg_constraint constraint_object
  where constraint_object.confrelid in (
    'public.landing_page_generation_profiles'::regclass,
    'public.landing_page_generation_profile_items'::regclass
  )
    and constraint_object.conrelid not in (
      'public.landing_page_generation_profiles'::regclass,
      'public.landing_page_generation_profile_items'::regclass
    );

  if v_count <> 0 then
    raise exception 'E22_1_4_EXTERNAL_FK_DEPENDENCY';
  end if;

  select count(*)
  into v_count
  from (
    select view_object.schemaname, view_object.viewname
    from pg_views view_object
    where view_object.schemaname not in ('pg_catalog', 'information_schema')
      and (
        position('landing_page_generation_profiles' in lower(view_object.definition)) > 0
        or position('landing_page_generation_profile_items' in lower(view_object.definition)) > 0
      )
    union all
    select view_object.schemaname, view_object.matviewname
    from pg_matviews view_object
    where view_object.schemaname not in ('pg_catalog', 'information_schema')
      and (
        position('landing_page_generation_profiles' in lower(view_object.definition)) > 0
        or position('landing_page_generation_profile_items' in lower(view_object.definition)) > 0
      )
  ) dependent_view;

  if v_count <> 0 then
    raise exception 'E22_1_4_VIEW_DEPENDENCY';
  end if;

  select count(*)
  into v_count
  from pg_proc procedure
  join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname not in ('pg_catalog', 'information_schema')
    and procedure.proname not in (
      'save_landing_page_generation_profile_draft',
      'activate_landing_page_generation_profile',
      'archive_landing_page_generation_profile',
      'get_landing_page_generation_profile_lifecycle_status'
    )
    and (
      position('landing_page_generation_profiles' in lower(pg_get_functiondef(procedure.oid))) > 0
      or position('landing_page_generation_profile_items' in lower(pg_get_functiondef(procedure.oid))) > 0
      or position('save_landing_page_generation_profile_draft' in lower(pg_get_functiondef(procedure.oid))) > 0
      or position('activate_landing_page_generation_profile' in lower(pg_get_functiondef(procedure.oid))) > 0
      or position('archive_landing_page_generation_profile' in lower(pg_get_functiondef(procedure.oid))) > 0
      or position('get_landing_page_generation_profile_lifecycle_status' in lower(pg_get_functiondef(procedure.oid))) > 0
    );

  if v_count <> 0 then
    raise exception 'E22_1_4_EXTERNAL_FUNCTION_DEPENDENCY';
  end if;

  select count(*)
  into v_count
  from pg_trigger trigger_object
  where not trigger_object.tgisinternal
    and trigger_object.tgrelid not in (
      'public.landing_page_generation_profiles'::regclass,
      'public.landing_page_generation_profile_items'::regclass
    )
    and (
      position('landing_page_generation_profiles' in lower(pg_get_triggerdef(trigger_object.oid, true))) > 0
      or position('landing_page_generation_profile_items' in lower(pg_get_triggerdef(trigger_object.oid, true))) > 0
      or position('save_landing_page_generation_profile_draft' in lower(pg_get_triggerdef(trigger_object.oid, true))) > 0
      or position('activate_landing_page_generation_profile' in lower(pg_get_triggerdef(trigger_object.oid, true))) > 0
      or position('archive_landing_page_generation_profile' in lower(pg_get_triggerdef(trigger_object.oid, true))) > 0
      or position('get_landing_page_generation_profile_lifecycle_status' in lower(pg_get_triggerdef(trigger_object.oid, true))) > 0
    );

  if v_count <> 0 then
    raise exception 'E22_1_4_EXTERNAL_TRIGGER_DEPENDENCY';
  end if;

  select count(*)
  into v_count
  from pg_policies policy
  where policy.tablename not in (
      'landing_page_generation_profiles',
      'landing_page_generation_profile_items'
    )
    and (
      position('landing_page_generation_profiles' in lower(coalesce(policy.qual, '') || ' ' || coalesce(policy.with_check, ''))) > 0
      or position('landing_page_generation_profile_items' in lower(coalesce(policy.qual, '') || ' ' || coalesce(policy.with_check, ''))) > 0
    );

  if v_count <> 0 then
    raise exception 'E22_1_4_EXTERNAL_POLICY_DEPENDENCY';
  end if;

  select count(*)
  into v_count
  from pg_publication_tables publication
  where publication.schemaname = 'public'
    and publication.tablename in (
      'landing_page_generation_profiles',
      'landing_page_generation_profile_items'
    );

  if v_count <> 0 then
    raise exception 'E22_1_4_PUBLICATION_DEPENDENCY';
  end if;
end
$gate$;

drop function public.save_landing_page_generation_profile_draft(
  uuid,
  uuid,
  timestamptz,
  text,
  jsonb,
  text,
  uuid,
  text,
  jsonb
);
drop function public.activate_landing_page_generation_profile(uuid, timestamptz);
drop function public.archive_landing_page_generation_profile(uuid, timestamptz);
drop function public.get_landing_page_generation_profile_lifecycle_status();

drop table public.landing_page_generation_profile_items;
drop table public.landing_page_generation_profiles;

commit;
