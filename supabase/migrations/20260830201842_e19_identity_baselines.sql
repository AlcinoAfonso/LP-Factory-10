-- AA-PR06 / ARC-004. Read-only selection; existing writers and tokens are unchanged.
begin;

create index account_lp_materializations_identity_funnel_idx
  on public.account_landing_page_materializations (account_id, landing_page_id, revision_number asc)
  where jsonb_typeof(generation_context_snapshot_json #> '{generationContext,modelContext,facts}') = 'array'
    and (
      jsonb_path_exists(generation_context_snapshot_json, 'strict $.generationContext.modelContext.facts[*] ? (@.type() == "object" && @.fieldKey.type() == "string" && @.fieldKey == "funnel_stage" && exists(@.value))', '{}'::jsonb, true)
      or jsonb_path_exists(generation_context_snapshot_json, 'strict $.generationContext.bindingFacts[*] ? (@.type() == "object" && @.fieldKey.type() == "string" && @.fieldKey == "funnel_stage" && exists(@.value))', '{}'::jsonb, true)
    );

create index account_lp_materializations_identity_transaction_idx
  on public.account_landing_page_materializations (account_id, landing_page_id, revision_number asc)
  where jsonb_typeof(generation_context_snapshot_json #> '{generationContext,modelContext,facts}') = 'array'
    and (
      jsonb_path_exists(generation_context_snapshot_json, 'strict $.generationContext.modelContext.facts[*] ? (@.type() == "object" && @.fieldKey.type() == "string" && @.fieldKey == "transaction_intent" && exists(@.value))', '{}'::jsonb, true)
      or jsonb_path_exists(generation_context_snapshot_json, 'strict $.generationContext.bindingFacts[*] ? (@.type() == "object" && @.fieldKey.type() == "string" && @.fieldKey == "transaction_intent" && exists(@.value))', '{}'::jsonb, true)
    );

create index account_lp_materializations_identity_offer_idx
  on public.account_landing_page_materializations (account_id, landing_page_id, revision_number asc)
  where jsonb_typeof(generation_context_snapshot_json #> '{generationContext,modelContext,facts}') = 'array'
    and (
      jsonb_path_exists(generation_context_snapshot_json, 'strict $.generationContext.modelContext.facts[*] ? (@.type() == "object" && @.fieldKey.type() == "string" && (@.fieldKey == "landing_page_offering_scope" || @.fieldKey == "primary_service_or_offer") && exists(@.value))', '{}'::jsonb, true)
      or jsonb_path_exists(generation_context_snapshot_json, 'strict $.generationContext.bindingFacts[*] ? (@.type() == "object" && @.fieldKey.type() == "string" && (@.fieldKey == "landing_page_offering_scope" || @.fieldKey == "primary_service_or_offer") && exists(@.value))', '{}'::jsonb, true)
    );

create function public.read_account_landing_page_identity_baselines_v1(
  p_account_id uuid,
  p_landing_page_id uuid
)
returns table (
  id uuid,
  account_id uuid,
  landing_page_id uuid,
  revision_number bigint,
  generation_context_snapshot_json jsonb,
  latest_materialization_id uuid
)
language sql
stable
security invoker
set search_path = pg_catalog
as $function$
-- Eligibility only: model facts must be an array even for binding facts.
-- Strict paths do not unwrap arrays; value:null is present, invalid offers qualify.
with latest as (
  select id, revision_number
  from public.account_landing_page_materializations
  where account_id = p_account_id and landing_page_id = p_landing_page_id
  order by revision_number desc
  limit 1
), selected as (
  (select id, revision_number
   from public.account_landing_page_materializations
   where account_id = p_account_id and landing_page_id = p_landing_page_id
     and jsonb_typeof(generation_context_snapshot_json #> '{generationContext,modelContext,facts}') = 'array'
    and (
      jsonb_path_exists(generation_context_snapshot_json, 'strict $.generationContext.modelContext.facts[*] ? (@.type() == "object" && @.fieldKey.type() == "string" && @.fieldKey == "funnel_stage" && exists(@.value))', '{}'::jsonb, true)
      or jsonb_path_exists(generation_context_snapshot_json, 'strict $.generationContext.bindingFacts[*] ? (@.type() == "object" && @.fieldKey.type() == "string" && @.fieldKey == "funnel_stage" && exists(@.value))', '{}'::jsonb, true)
    )
   order by revision_number asc
   limit 1)
  union
  (select id, revision_number
   from public.account_landing_page_materializations
   where account_id = p_account_id and landing_page_id = p_landing_page_id
     and jsonb_typeof(generation_context_snapshot_json #> '{generationContext,modelContext,facts}') = 'array'
    and (
      jsonb_path_exists(generation_context_snapshot_json, 'strict $.generationContext.modelContext.facts[*] ? (@.type() == "object" && @.fieldKey.type() == "string" && @.fieldKey == "transaction_intent" && exists(@.value))', '{}'::jsonb, true)
      or jsonb_path_exists(generation_context_snapshot_json, 'strict $.generationContext.bindingFacts[*] ? (@.type() == "object" && @.fieldKey.type() == "string" && @.fieldKey == "transaction_intent" && exists(@.value))', '{}'::jsonb, true)
    )
   order by revision_number asc
   limit 1)
  union
  (select id, revision_number
   from public.account_landing_page_materializations
   where account_id = p_account_id and landing_page_id = p_landing_page_id
     and jsonb_typeof(generation_context_snapshot_json #> '{generationContext,modelContext,facts}') = 'array'
    and (
      jsonb_path_exists(generation_context_snapshot_json, 'strict $.generationContext.modelContext.facts[*] ? (@.type() == "object" && @.fieldKey.type() == "string" && (@.fieldKey == "landing_page_offering_scope" || @.fieldKey == "primary_service_or_offer") && exists(@.value))', '{}'::jsonb, true)
      or jsonb_path_exists(generation_context_snapshot_json, 'strict $.generationContext.bindingFacts[*] ? (@.type() == "object" && @.fieldKey.type() == "string" && (@.fieldKey == "landing_page_offering_scope" || @.fieldKey == "primary_service_or_offer") && exists(@.value))', '{}'::jsonb, true)
    )
   order by revision_number asc
   limit 1)
  union
  select id, revision_number from latest
)
select m.id, m.account_id, m.landing_page_id, m.revision_number,
       m.generation_context_snapshot_json, latest.id as latest_materialization_id
from selected
join public.account_landing_page_materializations m
  on m.id = selected.id and m.revision_number = selected.revision_number
 and m.account_id = p_account_id and m.landing_page_id = p_landing_page_id
cross join latest
order by m.revision_number asc;
$function$;

revoke all on function public.read_account_landing_page_identity_baselines_v1(uuid, uuid)
  from public, anon, authenticated;
do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.read_account_landing_page_identity_baselines_v1(uuid, uuid) from ai_readonly';
  end if;
end;
$$;
grant execute on function public.read_account_landing_page_identity_baselines_v1(uuid, uuid)
  to service_role;

comment on function public.read_account_landing_page_identity_baselines_v1(uuid, uuid)
  is 'Complete tenant-scoped identity selection: first presence per three groups plus latest, deduplicated, ascending, at most four original snapshots in one MVCC statement. Domain evaluation stays in E19. Three partial indexes trade storage and append work for bounded ordered probes.';

commit;
