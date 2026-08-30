-- AA06 post-apply read-only gate. Missing RPC/index is a failure, not an empty baseline.
-- Run only after canonical apply; never installs schema or changes production rows.
begin transaction read only;
do $verify$
declare
  v_function oid := to_regprocedure('public.read_account_landing_page_identity_baselines_v1(uuid,uuid)');
  v_index record;
  v_group record;
  v_model_path text;
  v_binding_path text;
  v_expected text;
  v_filter text;
  v_role text;
begin
  if v_function is null then raise exception 'AA06 identity RPC missing'; end if;
  if not exists (
    select 1 from pg_proc p join pg_language l on l.oid = p.prolang
    where p.oid = v_function and p.provolatile = 's' and not p.prosecdef and l.lanname = 'sql'
      and p.proconfig = array['search_path=pg_catalog']
      and p.proargnames = array['p_account_id','p_landing_page_id','id','account_id','landing_page_id','revision_number','generation_context_snapshot_json','latest_materialization_id']
      and p.proallargtypes = array['uuid'::regtype::oid,'uuid'::regtype::oid,'uuid'::regtype::oid,'uuid'::regtype::oid,'uuid'::regtype::oid,'bigint'::regtype::oid,'jsonb'::regtype::oid,'uuid'::regtype::oid]
      and p.proargmodes = array['i','i','t','t','t','t','t','t']::"char"[]
      and pg_get_userbyid(p.proowner) = 'postgres'
  ) then raise exception 'AA06 RPC signature, volatility, invoker, owner or search_path drift'; end if;
  if exists (
    select 1 from pg_proc p cross join lateral aclexplode(coalesce(p.proacl, acldefault('f',p.proowner))) acl
    where p.oid = v_function and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
  ) then raise exception 'AA06 PUBLIC execution is forbidden'; end if;
  foreach v_role in array array['anon','authenticated','ai_readonly'] loop
    if to_regrole(v_role) is not null and has_function_privilege(v_role, v_function, 'EXECUTE') then
      raise exception 'AA06 unexpected EXECUTE for %', v_role;
    end if;
  end loop;
  if not has_function_privilege('service_role', v_function, 'EXECUTE') then
    raise exception 'AA06 service_role EXECUTE missing';
  end if;

  for v_group in select * from (values
    ('account_lp_materializations_identity_funnel_idx', '@.fieldKey == "funnel_stage"'),
    ('account_lp_materializations_identity_transaction_idx', '@.fieldKey == "transaction_intent"'),
    ('account_lp_materializations_identity_offer_idx', '(@.fieldKey == "landing_page_offering_scope" || @.fieldKey == "primary_service_or_offer")')
  ) groups(index_name, field_filter) loop
    select i.*, am.amname, pg_get_expr(i.indpred, i.indrelid) as predicate,
      (select array_agg(a.attname::text order by k.ordinality)
       from unnest(i.indkey) with ordinality k(attnum,ordinality)
       join pg_attribute a on a.attrelid=i.indrelid and a.attnum=k.attnum) as key_names
    into v_index
    from pg_index i join pg_class c on c.oid=i.indexrelid join pg_am am on am.oid=c.relam
    where i.indexrelid=to_regclass('public.' || v_group.index_name);
    if not found then raise exception 'AA06 missing index %', v_group.index_name; end if;
    if v_index.indrelid <> 'public.account_landing_page_materializations'::regclass
       or not v_index.indisvalid or not v_index.indisready or v_index.indisunique
       or v_index.amname <> 'btree' or v_index.indnkeyatts <> 3 or v_index.indnatts <> 3
       or v_index.key_names <> array['account_id','landing_page_id','revision_number']
       or v_index.indoption::text <> '0 0 0' or v_index.predicate is null then
      raise exception 'AA06 index structure drift %', v_group.index_name;
    end if;
    v_filter := '? (@.type() == "object" && @.fieldKey.type() == "string" && ' || v_group.field_filter || ' && exists(@.value))';
    v_model_path := ('strict $.generationContext.modelContext.facts[*] ' || v_filter)::jsonpath::text;
    v_binding_path := ('strict $.generationContext.bindingFacts[*] ' || v_filter)::jsonpath::text;
    v_expected := format(
      '(jsonb_typeof(generation_context_snapshot_json #> %L::text[]) = %L::text) and (jsonb_path_exists(generation_context_snapshot_json, %L::jsonpath, %L::jsonb, true) or jsonb_path_exists(generation_context_snapshot_json, %L::jsonpath, %L::jsonb, true))',
      '{generationContext,modelContext,facts}', 'array', v_model_path, '{}', v_binding_path, '{}');
    -- Compare deparsed predicate after formatting-only normalization.
    if lower(regexp_replace(v_index.predicate, '[[:space:]()]', '', 'g')) <>
       lower(regexp_replace(v_expected, '[[:space:]()]', '', 'g')) then
      raise exception 'AA06 literal index predicate drift %', v_group.index_name;
    end if;
  end loop;
end;
$verify$;

-- At most 25 authorized operational LPs; select only metadata and byte counts.
with targets as (
  select account_id, id as landing_page_id from public.account_landing_pages
  where status in ('draft','active') order by id limit 25
), results as (
  select t.account_id, t.landing_page_id, r.*,
    (select m.id from public.account_landing_page_materializations m
     where m.account_id=t.account_id and m.landing_page_id=t.landing_page_id
     order by revision_number desc limit 1) as expected_latest
  from targets t left join lateral (
    select count(*) as snapshots,
      array_agg(b.revision_number order by b.revision_number) as revisions,
      (array_agg(b.id order by b.revision_number desc))[1] as last_selected,
      count(distinct b.id) as distinct_ids,
      count(distinct b.revision_number) as distinct_revisions,
      bool_and(b.account_id=t.account_id and b.landing_page_id=t.landing_page_id) as tenant_ok,
      count(distinct b.latest_materialization_id) as latest_tokens,
      (array_agg(b.latest_materialization_id))[1] as latest_token,
      sum(octet_length(b.generation_context_snapshot_json::text)) as snapshot_bytes
    from public.read_account_landing_page_identity_baselines_v1(t.account_id,t.landing_page_id) b
  ) r on true
)
select *, snapshots <= 4 and distinct_ids=snapshots and distinct_revisions=snapshots
  and (case when expected_latest is null then snapshots=0
       else snapshots>0 and tenant_ok and latest_tokens=1
       and latest_token=expected_latest and last_selected=expected_latest end) as contract_ok
from results order by landing_page_id limit 25;

select t.id as landing_page_id, not exists (
  select 1 from public.read_account_landing_page_identity_baselines_v1(
    '00000000-0000-0000-0000-000000000000'::uuid, t.id)
) as tenant_mismatch_empty
from public.account_landing_pages t
where t.account_id <> '00000000-0000-0000-0000-000000000000'::uuid
order by t.id limit 25;

select c.relname, i.indisvalid, i.indisready, pg_get_indexdef(c.oid) as definition,
  pg_get_expr(i.indpred,i.indrelid) as predicate, pg_relation_size(c.oid) as bytes
from pg_class c join pg_index i on i.indexrelid=c.oid
where c.oid in (
  to_regclass('public.account_lp_materializations_identity_funnel_idx'),
  to_regclass('public.account_lp_materializations_identity_transaction_idx'),
  to_regclass('public.account_lp_materializations_identity_offer_idx'),
  to_regclass('public.account_landing_page_materializations_current_idx')
) order by c.relname limit 25;
rollback;
-- Separate post-apply planner proof: EXPLAIN the exact SQL body with authorized UUIDs,
-- naturally and inside BEGIN READ ONLY; SET LOCAL enable_seqscan=off; ...; ROLLBACK.
-- Diagnostic index use is not a latency benchmark; never change persistent settings.
