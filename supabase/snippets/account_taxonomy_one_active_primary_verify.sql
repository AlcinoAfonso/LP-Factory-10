begin;
set transaction read only;
set local search_path = public, pg_catalog;

with index_state as (
  select
    index_row.indisunique,
    index_row.indisvalid,
    index_row.indisready,
    pg_get_indexdef(index_row.indexrelid) as definition,
    pg_get_expr(index_row.indpred, index_row.indrelid) as predicate
  from pg_index index_row
  where index_row.indexrelid = to_regclass('public.account_taxonomy_one_active_primary_idx')
), duplicate_active_primary_accounts as (
  select account_id, count(*) as link_count
  from public.account_taxonomy
  where is_primary = true
    and status = 'active'
  group by account_id
  having count(*) > 1
), unexpected_account_wide_unique_indexes as (
  select pg_get_indexdef(index_row.indexrelid) as definition
  from pg_index index_row
  where index_row.indrelid = to_regclass('public.account_taxonomy')
    and index_row.indisunique
    and index_row.indnkeyatts = 1
    and (
      select attribute.attname
      from pg_attribute attribute
      where attribute.attrelid = index_row.indrelid
        and attribute.attnum = index_row.indkey[0]
    ) = 'account_id'
    and index_row.indexrelid <> to_regclass('public.account_taxonomy_one_active_primary_idx')
), checks as (
  select
    'one_active_primary_index'::text as check_name,
    case
      when count(*) = 1
        and bool_and(indisunique and indisvalid and indisready)
        and bool_and(predicate ~* 'is_primary\s*=\s*true')
        and bool_and(predicate ~* 'status\s*=\s*''active''')
      then 'ok'
      else 'unexpected'
    end as status,
    coalesce(jsonb_agg(jsonb_build_object(
      'definition', definition,
      'predicate', predicate,
      'unique', indisunique,
      'valid', indisvalid,
      'ready', indisready
    )), '[]'::jsonb) as details
  from index_state

  union all

  select
    'no_duplicate_active_primary_accounts',
    case when count(*) = 0 then 'ok' else 'unexpected' end,
    coalesce(jsonb_agg(to_jsonb(duplicate_active_primary_accounts) order by account_id), '[]'::jsonb)
  from duplicate_active_primary_accounts

  union all

  select
    'zero_primary_non_primary_and_inactive_links_allowed',
    case when count(*) = 0 then 'ok' else 'unexpected' end,
    coalesce(jsonb_agg(to_jsonb(unexpected_account_wide_unique_indexes)), '[]'::jsonb)
  from unexpected_account_wide_unique_indexes
)
select check_name, status, details
from checks
order by check_name;

commit;
