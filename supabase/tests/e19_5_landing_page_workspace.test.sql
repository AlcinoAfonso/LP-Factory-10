begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values ('e1953000-0000-4000-8000-000000000001','authenticated','authenticated','e19.5.3-test@example.com',now(),now());

insert into public.accounts (id, name, subdomain, slug, status)
values ('e1953000-0000-4000-8000-000000000011','E19.5 workspace','e19-5-workspace','e19-5-workspace','active');

insert into public.account_users (account_id, user_id, role, status)
values ('e1953000-0000-4000-8000-000000000011','e1953000-0000-4000-8000-000000000001','owner','active');

insert into public.business_taxons (id, parent_id, level, name, slug, is_active)
values ('e1953000-0000-4000-8000-000000000041',null,'segment','Serviços gerais','servicos-gerais',true);

insert into public.account_taxonomy (account_id, taxon_id, is_primary, status, source_type)
values ('e1953000-0000-4000-8000-000000000011','e1953000-0000-4000-8000-000000000041',true,'active','manual');

insert into public.account_landing_pages (id, account_id, name, slug, status, created_by)
values (
  'e1953000-0000-4000-8000-000000000022',
  'e1953000-0000-4000-8000-000000000011',
  'Bootstrap histórico', 'bootstrap-historico', 'draft',
  'e1953000-0000-4000-8000-000000000001'
);

insert into public.account_landing_page_onboarding_configurations (
  account_id, landing_page_id, catalog_version, values, created_by, updated_by
) values (
  'e1953000-0000-4000-8000-000000000011',
  'e1953000-0000-4000-8000-000000000022',
  2,
  '{"landing_page_objective":{"scope":"landing_page","value":"Objetivo inicial"}}'::jsonb,
  'e1953000-0000-4000-8000-000000000001',
  'e1953000-0000-4000-8000-000000000001'
);

do $$
declare
  v_landing_page_id uuid;
  v_revision_id uuid;
  v_revision_number bigint;
  v_approved uuid;
  v_default text;
begin
  if public.e19_5_configuration_values_applicable(
    '{"primary_conversion_channel":{"scope":"landing_page","value":"form"},"whatsapp_destination":{"scope":"landing_page","value":"+5521979658483"}}'::jsonb
  ) then raise exception 'destination outside applicable conversion channel must fail'; end if;
  if public.e19_5_configuration_values_applicable(
    '{"traffic_source":{"scope":"campaign","value":"organic"},"paid_search_keyword_map":{"scope":"campaign","value":{"cluster":["imoveis"]}}}'::jsonb
  ) then raise exception 'paid search map outside paid search traffic must fail'; end if;

  if public.e19_5_configuration_values_valid_for_account(
    'e1953000-0000-4000-8000-000000000011',
    '{"business_display_name":{"scope":"business","value":"cópia indevida"}}'::jsonb,
    array['account','business']
  ) then raise exception 'current account authority must not be copied'; end if;
  if public.e19_5_configuration_values_valid_for_account(
    'e1953000-0000-4000-8000-000000000011',
    '{"property_types":{"scope":"offer","value":["house"]}}'::jsonb,
    array['offer','campaign','landing_page']
  ) then raise exception 'field outside the current taxon chain must fail'; end if;

  perform * from public.handoff_account_landing_page_onboarding_v1(
    'e1953000-0000-4000-8000-000000000011',
    'e1953000-0000-4000-8000-000000000022', 1,
    'e1953000-0000-4000-8000-000000000001'
  );
  update public.account_landing_page_onboarding_configurations
  set values = values || '{"whatsapp_destination":{"scope":"landing_page","value":"+5521979658483"}}'::jsonb,
      revision = revision + 1
  where account_id = 'e1953000-0000-4000-8000-000000000011';
  perform * from public.handoff_account_landing_page_onboarding_v1(
    'e1953000-0000-4000-8000-000000000011',
    'e1953000-0000-4000-8000-000000000022', 1,
    'e1953000-0000-4000-8000-000000000001'
  );
  if not exists (
    select 1 from public.account_landing_page_configurations
    where landing_page_id = 'e1953000-0000-4000-8000-000000000022'
      and revision = 1
  ) then raise exception 'materialized handoff retry must ignore later bootstrap drift'; end if;

  select landing_page_id into v_landing_page_id
  from public.create_account_landing_page_v1(
    'e1953000-0000-4000-8000-000000000011','Página operacional','pagina-operacional',
    'e1953000-0000-4000-8000-000000000001'
  );

  if (select status from public.account_landing_pages where id=v_landing_page_id) <> 'active' then
    raise exception 'new workspace identity must be active';
  end if;

  perform * from public.save_account_landing_page_configuration_v1(
    'e1953000-0000-4000-8000-000000000011', v_landing_page_id,
    '{"brand_logo_asset":{"scope":"business","value":{"asset_id":"logo"}}}'::jsonb,
    '{"landing_page_objective":{"scope":"landing_page","value":"Captar contatos qualificados"}}'::jsonb,
    1, 1, 'e1953000-0000-4000-8000-000000000001'
  );

  select materialization_id, revision_number into v_revision_id, v_revision_number
  from public.append_account_landing_page_materialization_v1(
    'e1953000-0000-4000-8000-000000000011', v_landing_page_id,
    'e1953000-0000-4000-8000-000000000031','{"contractVersion":1}'::jsonb,
    '{"snapshotVersion":2,"generationContext":{"contractVersion":4}}'::jsonb,
    'e1953000-0000-4000-8000-000000000001'
  );
  if v_revision_number <> 1 then raise exception 'first append must be revision one'; end if;

  v_approved := public.approve_account_landing_page_materialization_v1(
    'e1953000-0000-4000-8000-000000000011',v_landing_page_id,v_revision_id,
    'e1953000-0000-4000-8000-000000000001'
  );
  if v_approved is distinct from v_revision_id then raise exception 'approval must select existing revision'; end if;

  perform * from public.append_account_landing_page_materialization_v1(
    'e1953000-0000-4000-8000-000000000011', v_landing_page_id,
    'e1953000-0000-4000-8000-000000000032','{"contractVersion":1,"second":true}'::jsonb,
    '{"snapshotVersion":2,"generationContext":{"contractVersion":4}}'::jsonb,
    'e1953000-0000-4000-8000-000000000001'
  );
  if (select approved_materialization_id from public.account_landing_pages where id=v_landing_page_id)
     is distinct from v_revision_id then raise exception 'append must preserve prior approval'; end if;

  perform public.set_account_landing_page_archived_v1(
    'e1953000-0000-4000-8000-000000000011',v_landing_page_id,true,
    'e1953000-0000-4000-8000-000000000001'
  );

  perform * from public.append_account_landing_page_materialization_v1(
    'e1953000-0000-4000-8000-000000000011', v_landing_page_id,
    'e1953000-0000-4000-8000-000000000032','{}'::jsonb,'{}'::jsonb,
    'e1953000-0000-4000-8000-000000000001'
  );
  begin
    perform * from public.append_account_landing_page_materialization_v1(
      'e1953000-0000-4000-8000-000000000011', v_landing_page_id,
      'e1953000-0000-4000-8000-000000000033','{}'::jsonb,'{}'::jsonb,
      'e1953000-0000-4000-8000-000000000001'
    );
    raise exception using errcode='P0002',message='new archived append must fail';
  exception when sqlstate 'P0001' then null;
  end;

  perform public.set_account_landing_page_archived_v1(
    'e1953000-0000-4000-8000-000000000011',v_landing_page_id,false,
    'e1953000-0000-4000-8000-000000000001'
  );
  if (select count(*) from public.account_landing_page_materializations where landing_page_id=v_landing_page_id) <> 2
     or (select approved_materialization_id from public.account_landing_pages where id=v_landing_page_id) is distinct from v_revision_id then
    raise exception 'restore must preserve history and approval';
  end if;

  select pg_get_expr(attribute.adbin, attribute.adrelid) into v_default
  from pg_attrdef attribute join pg_attribute column_row
    on column_row.attrelid=attribute.adrelid and column_row.attnum=attribute.adnum
  where attribute.adrelid='public.account_landing_pages'::regclass and column_row.attname='status';
  if v_default is distinct from '''draft''::text' then raise exception 'contract default was anticipated'; end if;

  set constraints account_landing_pages_approved_materialization_fkey deferred;
  delete from public.account_landing_pages where id=v_landing_page_id;
  if exists (select 1 from public.account_landing_page_materializations where landing_page_id=v_landing_page_id) then
    raise exception 'parent delete must preserve aggregate cascade semantics';
  end if;
end;
$$;

do $$
begin
  if not coalesce((public.e19_5_landing_page_workspace_readiness()->>'ready')::boolean,false) then
    raise exception 'workspace readiness must pass';
  end if;
  if exists (
    select 1 from information_schema.role_routine_grants
    where specific_schema='public'
      and routine_name like '%account_landing_page%v1'
      and lower(grantee) in ('public','anon','authenticated','ai_readonly')
  ) then raise exception 'workspace RPCs must remain service_role-only'; end if;
end;
$$;

rollback;
