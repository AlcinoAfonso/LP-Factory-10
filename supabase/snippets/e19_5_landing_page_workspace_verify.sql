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
    ('persisted_configuration_valid',
      not exists(select 1 from public.account_landing_page_shared_configurations where catalog_version<>5 or not public.e19_5_configuration_values_valid_for_account(account_id,values,array['account','business']))
      and not exists(select 1 from public.account_landing_page_configurations where catalog_version<>5 or not public.e19_5_configuration_values_valid_for_account(account_id,values,array['offer','campaign','landing_page']))
      and not exists(
        select 1
        from public.account_landing_page_configurations configuration
        left join public.account_landing_page_shared_configurations shared using (account_id)
        where shared.account_id is null
          or not public.e19_5_configuration_values_applicable(shared.values || configuration.values)
      ))
)
select check_name, case when ok then 'ok' else 'fail' end as status
from checks
order by check_name;
