with checks(check_name, ok) as (
  values
    ('readiness', coalesce((public.e19_5_landing_page_workspace_readiness()->>'ready')::boolean,false)),
    ('status_contract_transitional',
      pg_get_constraintdef((select oid from pg_constraint where conrelid='public.account_landing_pages'::regclass and conname='account_landing_pages_status_chk')) ilike all(array['%draft%','%active%','%archived%'])
      and (select pg_get_expr(d.adbin,d.adrelid) from pg_attrdef d join pg_attribute a on a.attrelid=d.adrelid and a.attnum=d.adnum where d.adrelid='public.account_landing_pages'::regclass and a.attname='status') = '''draft''::text'),
    ('configuration_residences',
      to_regclass('public.account_landing_page_shared_configurations') is not null
      and to_regclass('public.account_landing_page_configurations') is not null),
    ('approval_pointer', exists(select 1 from pg_constraint where conrelid='public.account_landing_pages'::regclass and conname='account_landing_pages_approved_materialization_fkey')),
    ('workspace_rpc_grants',
      has_function_privilege('service_role','public.create_account_landing_page_v1(uuid,text,text,uuid)','EXECUTE')
      and not has_function_privilege('authenticated','public.create_account_landing_page_v1(uuid,text,text,uuid)','EXECUTE')),
    ('configuration_initialization',
      exists(
        select 1
        from pg_attribute column_row
        join pg_attrdef attribute
          on attribute.adrelid=column_row.attrelid and attribute.adnum=column_row.attnum
        where column_row.attrelid='public.account_landing_page_configurations'::regclass
          and column_row.attname='is_initialized'
          and column_row.attnotnull
          and pg_get_expr(attribute.adbin,attribute.adrelid) in ('false','false::boolean')
      )
      and not exists(
        select 1 from public.account_landing_page_configurations
        where not is_initialized and values<>'{}'::jsonb
      )),
    ('palette_contrast_contract',
      public.e19_5_configuration_values_valid(
        '{"brand_color_palette":{"scope":"business","value":{"primary":"#949494","secondary":"#000000","accent":"#000000","background":"#ffffff","text":"#767676"}}}'::jsonb,
        array['business']
      )
      and not public.e19_5_configuration_values_valid(
        '{"brand_color_palette":{"scope":"business","value":{"primary":"#ffffff","secondary":"#ffffff","accent":"#ffffff","background":"#ffffff","text":"#ffffff"}}}'::jsonb,
        array['business']
      )
      and not public.e19_5_configuration_values_valid(
        '{"brand_color_palette":{"scope":"business","value":{"primary":"#000000","secondary":"#000000","accent":"#000000","background":"#ffffff","text":"#777777"}}}'::jsonb,
        array['business']
      )
      and not public.e19_5_configuration_values_valid(
        '{"brand_color_palette":{"scope":"business","value":{"primary":"#959595","secondary":"#000000","accent":"#000000","background":"#ffffff","text":"#000000"}}}'::jsonb,
        array['business']
      )),
    ('persisted_configuration_valid',
      not exists(select 1 from public.account_landing_page_shared_configurations where catalog_version<>5 or not public.e19_5_configuration_values_valid_for_account(account_id,values,array['account','business']))
      and not exists(select 1 from public.account_landing_page_configurations where catalog_version<>5 or not public.e19_5_configuration_values_valid_for_account(account_id,values,array['offer','campaign','landing_page'])))
)
select check_name, case when ok then 'ok' else 'fail' end as status
from checks
order by check_name;
