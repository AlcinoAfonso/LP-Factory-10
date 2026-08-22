begin;

create or replace function public.e19_5_actor_can_manage(
  p_account_id uuid,
  p_actor_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.accounts account
    join public.account_users membership
      on membership.account_id = account.id
    where account.id = p_account_id
      and account.status = 'active'
      and membership.user_id = p_actor_user_id
      and membership.status = 'active'
      and membership.role in ('owner', 'admin')
  );
$$;

revoke all on function public.e19_5_actor_can_manage(uuid, uuid)
  from public, anon, authenticated, service_role;

create or replace function public.e19_5_configuration_values_valid(
  p_values jsonb,
  p_allowed_scopes text[]
)
returns boolean
language sql
immutable
security invoker
set search_path = pg_catalog
as $$
  select
    jsonb_typeof(p_values) = 'object'
    and not exists (
      select 1
      from jsonb_each(p_values) entry
      cross join lateral (
        select case entry.key
          when 'business_display_name' then 'business'
          when 'primary_service_or_offer' then 'offer'
          when 'primary_service_or_offer_description' then 'offer'
          when 'brand_logo_asset' then 'business'
          when 'brand_color_palette' then 'business'
          when 'funnel_stage' then 'landing_page'
          when 'traffic_source' then 'campaign'
          when 'primary_conversion_channel' then 'landing_page'
          when 'whatsapp_destination' then 'landing_page'
          when 'phone_destination' then 'landing_page'
          when 'email_destination' then 'landing_page'
          when 'external_url_destination' then 'landing_page'
          when 'privacy_policy_url' then 'business'
          when 'paid_search_keyword_map' then 'campaign'
          when 'landing_page_objective' then 'landing_page'
          when 'service_locations' then 'business'
          when 'property_types' then 'offer'
          when 'property_price_range' then 'offer'
          when 'property_stage' then 'offer'
          when 'transaction_intent' then 'landing_page'
          when 'financing_support_available' then 'business'
          when 'document_support_available' then 'business'
          when 'creci_registration' then 'business'
          when 'attendance_modes' then 'business'
          else null
        end as expected_scope
      ) expected
      where expected.expected_scope is null
        or jsonb_typeof(entry.value) <> 'object'
        or entry.value ->> 'scope' is distinct from expected.expected_scope
        or not (expected.expected_scope = any(p_allowed_scopes))
        or not (entry.value ? 'value')
        or entry.value - 'scope' - 'value' <> '{}'::jsonb
        or not coalesce(
          case entry.key
            when 'business_display_name' then
              jsonb_typeof(entry.value -> 'value') = 'string'
              and length(btrim(entry.value ->> 'value')) > 0
            when 'primary_service_or_offer' then
              jsonb_typeof(entry.value -> 'value') = 'string'
              and length(btrim(entry.value ->> 'value')) > 0
            when 'primary_service_or_offer_description' then
              jsonb_typeof(entry.value -> 'value') = 'string'
              and length(btrim(entry.value ->> 'value')) > 0
            when 'creci_registration' then
              jsonb_typeof(entry.value -> 'value') = 'string'
              and length(btrim(entry.value ->> 'value')) > 0
            when 'landing_page_objective' then
              jsonb_typeof(entry.value -> 'value') = 'string'
              and length(btrim(entry.value ->> 'value')) > 0
            when 'funnel_stage' then
              jsonb_typeof(entry.value -> 'value') = 'string'
              and entry.value ->> 'value' in ('bofu', 'mofu', 'tofu')
            when 'traffic_source' then
              jsonb_typeof(entry.value -> 'value') = 'string'
              and entry.value ->> 'value' in (
                'paid_search', 'paid_social', 'organic', 'whatsapp', 'qr_code', 'other'
              )
            when 'primary_conversion_channel' then
              jsonb_typeof(entry.value -> 'value') = 'string'
              and entry.value ->> 'value' in (
                'whatsapp', 'form', 'phone', 'email', 'external_url'
              )
            when 'property_stage' then
              jsonb_typeof(entry.value -> 'value') = 'string'
              and entry.value ->> 'value' in (
                'launch', 'under_construction', 'ready', 'used', 'mixed'
              )
            when 'transaction_intent' then
              jsonb_typeof(entry.value -> 'value') = 'string'
              and entry.value ->> 'value' in ('buy', 'sell', 'valuation', 'mixed', 'rent')
            when 'whatsapp_destination' then
              jsonb_typeof(entry.value -> 'value') = 'string'
              and entry.value ->> 'value' ~ '^\+[1-9][0-9]{7,14}$'
            when 'phone_destination' then
              jsonb_typeof(entry.value -> 'value') = 'string'
              and entry.value ->> 'value' ~ '^\+[1-9][0-9]{7,14}$'
            when 'email_destination' then
              jsonb_typeof(entry.value -> 'value') = 'string'
              and btrim(entry.value ->> 'value') ~* '^[a-z0-9_+''-]([a-z0-9._+''-]*[a-z0-9_+''-])?@([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$'
              and btrim(entry.value ->> 'value') not like '%..%'
            when 'external_url_destination' then
              jsonb_typeof(entry.value -> 'value') = 'string'
              and btrim(entry.value ->> 'value') ~* '^https://[^/?#[:space:]]+([/?#][^[:space:]]*)?$'
            when 'privacy_policy_url' then
              jsonb_typeof(entry.value -> 'value') = 'string'
              and btrim(entry.value ->> 'value') ~* '^https://[^/?#[:space:]]+([/?#][^[:space:]]*)?$'
            when 'financing_support_available' then
              jsonb_typeof(entry.value -> 'value') = 'boolean'
            when 'document_support_available' then
              jsonb_typeof(entry.value -> 'value') = 'boolean'
            when 'service_locations' then
              case when jsonb_typeof(entry.value -> 'value') = 'array' then
                jsonb_array_length(entry.value -> 'value') > 0
                and not exists (
                  select 1 from jsonb_array_elements(entry.value -> 'value') item
                  where jsonb_typeof(item) <> 'string'
                    or length(btrim(item #>> '{}')) = 0
                )
                and (
                  select count(*) = count(distinct lower(btrim(item #>> '{}')))
                  from jsonb_array_elements(entry.value -> 'value') item
                )
              else false end
            when 'property_types' then
              case when jsonb_typeof(entry.value -> 'value') = 'array' then
                jsonb_array_length(entry.value -> 'value') > 0
                and not exists (
                  select 1 from jsonb_array_elements(entry.value -> 'value') item
                  where jsonb_typeof(item) <> 'string'
                    or length(btrim(item #>> '{}')) = 0
                )
                and (
                  select count(*) = count(distinct lower(btrim(item #>> '{}')))
                  from jsonb_array_elements(entry.value -> 'value') item
                )
              else false end
            when 'attendance_modes' then
              case when jsonb_typeof(entry.value -> 'value') = 'array' then
                jsonb_array_length(entry.value -> 'value') > 0
                and not exists (
                  select 1 from jsonb_array_elements(entry.value -> 'value') item
                  where jsonb_typeof(item) <> 'string'
                    or lower(btrim(item #>> '{}')) not in ('in_person', 'remote')
                )
                and (
                  select count(*) = count(distinct lower(btrim(item #>> '{}')))
                  from jsonb_array_elements(entry.value -> 'value') item
                )
              else false end
            when 'property_price_range' then
              case when jsonb_typeof(entry.value -> 'value') = 'object' then
                (entry.value -> 'value') ?& array['minimum', 'maximum', 'currency']
                and (entry.value -> 'value') - 'minimum' - 'maximum' - 'currency' = '{}'::jsonb
                and jsonb_typeof(entry.value #> '{value,minimum}') = 'number'
                and jsonb_typeof(entry.value #> '{value,maximum}') = 'number'
                and entry.value #>> '{value,currency}' = 'BRL'
                and (entry.value #>> '{value,minimum}')::numeric >= 0
                and abs((entry.value #>> '{value,minimum}')::numeric) <= 1.7976931348623157e308
                and abs((entry.value #>> '{value,maximum}')::numeric) <= 1.7976931348623157e308
                and (entry.value #>> '{value,minimum}')::numeric
                  <= (entry.value #>> '{value,maximum}')::numeric
              else false end
            when 'paid_search_keyword_map' then
              case when jsonb_typeof(entry.value -> 'value') = 'array' then
                jsonb_array_length(entry.value -> 'value') > 0
                and not exists (
                  select 1
                  from jsonb_array_elements(entry.value -> 'value') item
                  where jsonb_typeof(item) <> 'object'
                    or item - 'keyword_or_cluster' - 'message_anchor' - 'ad_context' <> '{}'::jsonb
                    or jsonb_typeof(item -> 'keyword_or_cluster') <> 'string'
                    or length(btrim(item ->> 'keyword_or_cluster')) = 0
                    or jsonb_typeof(item -> 'message_anchor') <> 'string'
                    or length(btrim(item ->> 'message_anchor')) = 0
                    or (
                      item ? 'ad_context'
                      and (
                        jsonb_typeof(item -> 'ad_context') <> 'string'
                        or length(btrim(item ->> 'ad_context')) = 0
                      )
                    )
                )
                and (
                  select count(*) = count(distinct lower(btrim(item ->> 'keyword_or_cluster')))
                  from jsonb_array_elements(entry.value -> 'value') item
                )
              else false end
            when 'brand_logo_asset' then
              case when jsonb_typeof(entry.value -> 'value') = 'object' then
                (entry.value -> 'value') - 'asset_id' = '{}'::jsonb
                and jsonb_typeof(entry.value #> '{value,asset_id}') = 'string'
                and length(btrim(entry.value #>> '{value,asset_id}')) > 0
                and btrim(entry.value #>> '{value,asset_id}') !~* '^[a-z][a-z0-9+.-]*:'
                and left(btrim(entry.value #>> '{value,asset_id}'), 2) <> '//'
                and left(btrim(entry.value #>> '{value,asset_id}'), 2) <> E'\\\\'
              else false end
            when 'brand_color_palette' then
              case when jsonb_typeof(entry.value -> 'value') = 'object' then
                (entry.value -> 'value') ?& array['primary', 'secondary', 'accent', 'background', 'text']
                and (entry.value -> 'value') - 'primary' - 'secondary' - 'accent' - 'background' - 'text' = '{}'::jsonb
                and jsonb_typeof(entry.value #> '{value,primary}') = 'string'
                and jsonb_typeof(entry.value #> '{value,secondary}') = 'string'
                and jsonb_typeof(entry.value #> '{value,accent}') = 'string'
                and jsonb_typeof(entry.value #> '{value,background}') = 'string'
                and jsonb_typeof(entry.value #> '{value,text}') = 'string'
                and entry.value #>> '{value,primary}' ~ '^#[0-9A-Fa-f]{6}$'
                and entry.value #>> '{value,secondary}' ~ '^#[0-9A-Fa-f]{6}$'
                and entry.value #>> '{value,accent}' ~ '^#[0-9A-Fa-f]{6}$'
                and entry.value #>> '{value,background}' ~ '^#[0-9A-Fa-f]{6}$'
                and entry.value #>> '{value,text}' ~ '^#[0-9A-Fa-f]{6}$'
              else false end
            else false
          end,
          false
        )
    );
$$;

revoke all on function public.e19_5_configuration_values_valid(jsonb, text[])
  from public, anon, authenticated, service_role;

create or replace function public.e19_5_configuration_values_valid_for_account(
  p_account_id uuid,
  p_values jsonb,
  p_allowed_scopes text[]
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  with recursive taxon_chain as (
    select taxon.id, taxon.slug, taxon.level, taxon.parent_id, taxon.is_active
    from public.account_taxonomy link
    join public.business_taxons taxon on taxon.id = link.taxon_id
    where link.account_id = p_account_id
      and link.is_primary = true
      and link.status = 'active'
    union
    select parent.id, parent.slug, parent.level, parent.parent_id, parent.is_active
    from public.business_taxons parent
    join taxon_chain child on child.parent_id = parent.id
  ), account_authority as (
    select length(btrim(coalesce(account.name, ''))) > 0 as has_business_display_name
    from public.accounts account
    where account.id = p_account_id
  )
  select
    public.e19_5_configuration_values_valid(p_values, p_allowed_scopes)
    and exists (
      select 1 from taxon_chain
      where level = 'segment' and parent_id is null and is_active = true
    )
    and not exists (select 1 from taxon_chain where is_active = false)
    and not (
      coalesce((select has_business_display_name from account_authority), false)
      and p_values ? 'business_display_name'
    )
    and not exists (
      select 1
      from jsonb_object_keys(p_values) as keys(field_key)
      where keys.field_key in ('service_locations','property_types','property_price_range','property_stage')
        and not exists (
          select 1 from taxon_chain
          where level = 'segment' and slug = 'imobiliario' and is_active = true
        )
    )
    and not exists (
      select 1
      from jsonb_object_keys(p_values) as keys(field_key)
      where keys.field_key in ('transaction_intent','financing_support_available','document_support_available','creci_registration','attendance_modes')
        and not exists (
          select 1 from taxon_chain
          where level = 'niche' and slug = 'corretor-imoveis' and is_active = true
        )
    );
$$;

revoke all on function public.e19_5_configuration_values_valid_for_account(uuid, jsonb, text[])
  from public, anon, authenticated, service_role;

alter table public.account_landing_page_materializations
  add constraint account_landing_page_materializations_id_landing_page_account_key
  unique (id, landing_page_id, account_id);

alter table public.account_landing_pages
  add column approved_materialization_id uuid null;

alter table public.account_landing_pages
  add constraint account_landing_pages_approved_materialization_fkey
  foreign key (approved_materialization_id, id, account_id)
  references public.account_landing_page_materializations(id, landing_page_id, account_id)
  on update restrict
  on delete no action
  deferrable initially deferred;

create index account_landing_pages_account_status_updated_idx
  on public.account_landing_pages (account_id, status, updated_at desc, id);

create table public.account_landing_page_shared_configurations (
  account_id uuid primary key,
  catalog_version integer not null,
  values jsonb not null default '{}'::jsonb,
  revision bigint not null default 1,
  created_by uuid not null,
  updated_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_landing_page_shared_configurations_account_fkey
    foreign key (account_id) references public.accounts(id)
    on update cascade on delete cascade,
  constraint account_landing_page_shared_configurations_created_by_fkey
    foreign key (created_by) references auth.users(id)
    on update cascade on delete restrict,
  constraint account_landing_page_shared_configurations_updated_by_fkey
    foreign key (updated_by) references auth.users(id)
    on update cascade on delete restrict,
  constraint account_landing_page_shared_configurations_catalog_chk
    check (catalog_version = 5),
  constraint account_landing_page_shared_configurations_revision_chk
    check (revision > 0),
  constraint account_landing_page_shared_configurations_values_chk
    check (public.e19_5_configuration_values_valid(values, array['account', 'business']))
);

create table public.account_landing_page_configurations (
  landing_page_id uuid primary key,
  account_id uuid not null,
  catalog_version integer not null,
  values jsonb not null default '{}'::jsonb,
  revision bigint not null default 1,
  created_by uuid not null,
  updated_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_landing_page_configurations_landing_page_fkey
    foreign key (landing_page_id, account_id)
    references public.account_landing_pages(id, account_id)
    on update cascade on delete cascade,
  constraint account_landing_page_configurations_account_fkey
    foreign key (account_id) references public.accounts(id)
    on update cascade on delete cascade,
  constraint account_landing_page_configurations_created_by_fkey
    foreign key (created_by) references auth.users(id)
    on update cascade on delete restrict,
  constraint account_landing_page_configurations_updated_by_fkey
    foreign key (updated_by) references auth.users(id)
    on update cascade on delete restrict,
  constraint account_landing_page_configurations_catalog_chk
    check (catalog_version = 5),
  constraint account_landing_page_configurations_revision_chk
    check (revision > 0),
  constraint account_landing_page_configurations_values_chk
    check (public.e19_5_configuration_values_valid(values, array['offer', 'campaign', 'landing_page']))
);

create index account_landing_page_configurations_account_idx
  on public.account_landing_page_configurations (account_id, landing_page_id);

create trigger account_landing_page_shared_configurations_set_updated_at
  before update on public.account_landing_page_shared_configurations
  for each row execute function public.tg_set_updated_at();

create trigger account_landing_page_configurations_set_updated_at
  before update on public.account_landing_page_configurations
  for each row execute function public.tg_set_updated_at();

alter table public.account_landing_page_shared_configurations enable row level security;
alter table public.account_landing_page_configurations enable row level security;

revoke all on table public.account_landing_page_shared_configurations
  from public, anon, authenticated, service_role;
revoke all on table public.account_landing_page_configurations
  from public, anon, authenticated, service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on table public.account_landing_page_shared_configurations from ai_readonly';
    execute 'revoke all on table public.account_landing_page_configurations from ai_readonly';
  end if;
end;
$$;

grant select, insert, update on table public.account_landing_page_shared_configurations to service_role;
grant select, insert, update on table public.account_landing_page_configurations to service_role;
revoke delete on table public.account_landing_pages from service_role;

do $$
begin
  if exists (
    select 1
    from public.account_landing_page_onboarding_configurations onboarding
    where onboarding.landing_page_id is not null
      and (
        not public.e19_5_configuration_values_valid_for_account(
          onboarding.account_id,
          onboarding.values,
          array['account', 'business', 'offer', 'campaign', 'landing_page']
        )
      )
  ) then
    raise exception using errcode = '23514', message = 'e19_5_invalid_onboarding_configuration';
  end if;
end;
$$;

insert into public.account_landing_page_shared_configurations (
  account_id, catalog_version, values, revision, created_by, updated_by
)
select distinct on (landing_page.account_id)
  landing_page.account_id, 5, '{}'::jsonb, 1,
  landing_page.created_by, landing_page.created_by
from public.account_landing_pages landing_page
order by landing_page.account_id, landing_page.created_at, landing_page.id;

insert into public.account_landing_page_configurations (
  landing_page_id, account_id, catalog_version, values, revision, created_by, updated_by
)
select landing_page.id, landing_page.account_id, 5, '{}'::jsonb, 1,
  landing_page.created_by, landing_page.created_by
from public.account_landing_pages landing_page;

update public.account_landing_page_shared_configurations shared
set values = source.values,
    revision = shared.revision + 1
from (
  select onboarding.account_id,
    coalesce(jsonb_object_agg(entry.key, entry.value)
      filter (where entry.value ->> 'scope' in ('account', 'business')), '{}'::jsonb) as values
  from public.account_landing_page_onboarding_configurations onboarding
  left join lateral jsonb_each(onboarding.values) entry on true
  where onboarding.landing_page_id is not null
  group by onboarding.account_id
) source
where shared.account_id = source.account_id;

update public.account_landing_page_configurations configuration
set values = source.values,
    revision = configuration.revision + 1
from (
  select onboarding.account_id, onboarding.landing_page_id,
    coalesce(jsonb_object_agg(entry.key, entry.value)
      filter (where entry.value ->> 'scope' in ('offer', 'campaign', 'landing_page')), '{}'::jsonb) as values
  from public.account_landing_page_onboarding_configurations onboarding
  left join lateral jsonb_each(onboarding.values) entry on true
  where onboarding.landing_page_id is not null
  group by onboarding.account_id, onboarding.landing_page_id
) source
where configuration.account_id = source.account_id
  and configuration.landing_page_id = source.landing_page_id;

create or replace function public.create_account_landing_page_v1(
  p_account_id uuid,
  p_name text,
  p_slug text,
  p_actor_user_id uuid
)
returns table(landing_page_id uuid, status text)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_landing_page_id uuid;
begin
  if not public.e19_5_actor_can_manage(p_account_id, p_actor_user_id) then
    raise exception using errcode = '42501', message = 'actor_not_authorized';
  end if;
  if length(btrim(coalesce(p_name, ''))) = 0
     or coalesce(p_slug, '') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception using errcode = '22023', message = 'landing_page_identity_invalid';
  end if;

  insert into public.account_landing_pages(account_id, name, slug, status, created_by)
  values (p_account_id, btrim(p_name), p_slug, 'active', p_actor_user_id)
  returning id into v_landing_page_id;

  insert into public.account_landing_page_shared_configurations(
    account_id, catalog_version, values, revision, created_by, updated_by
  ) values (p_account_id, 5, '{}'::jsonb, 1, p_actor_user_id, p_actor_user_id)
  on conflict (account_id) do nothing;

  insert into public.account_landing_page_configurations(
    landing_page_id, account_id, catalog_version, values, revision, created_by, updated_by
  ) values (v_landing_page_id, p_account_id, 5, '{}'::jsonb, 1, p_actor_user_id, p_actor_user_id);

  return query select v_landing_page_id, 'active'::text;
end;
$$;

create or replace function public.handoff_account_landing_page_onboarding_v1(
  p_account_id uuid,
  p_landing_page_id uuid,
  p_expected_onboarding_revision bigint,
  p_actor_user_id uuid
)
returns table(shared_revision bigint, landing_page_revision bigint)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_onboarding public.account_landing_page_onboarding_configurations%rowtype;
  v_status text;
  v_shared_found boolean;
  v_landing_page_found boolean;
  v_shared_catalog_version integer;
  v_shared_values jsonb;
  v_shared_revision bigint;
  v_landing_page_catalog_version integer;
  v_landing_page_values jsonb;
  v_landing_page_revision bigint;
  v_onboarding_shared_values jsonb;
  v_onboarding_landing_page_values jsonb;
  v_next_shared_values jsonb;
  v_next_landing_page_values jsonb;
begin
  if not public.e19_5_actor_can_manage(p_account_id, p_actor_user_id) then
    raise exception using errcode = '42501', message = 'actor_not_authorized';
  end if;
  select status into v_status
  from public.account_landing_pages
  where id = p_landing_page_id and account_id = p_account_id
    and status in ('draft', 'active', 'archived')
  for update;
  if not found then raise exception using errcode = 'P0001', message = 'landing_page_not_operational'; end if;

  select catalog_version, values, revision
  into v_shared_catalog_version, v_shared_values, v_shared_revision
  from public.account_landing_page_shared_configurations
  where account_id = p_account_id
  for update;
  v_shared_found := found;

  select catalog_version, values, revision
  into v_landing_page_catalog_version, v_landing_page_values, v_landing_page_revision
  from public.account_landing_page_configurations
  where landing_page_id = p_landing_page_id and account_id = p_account_id
  for update;
  v_landing_page_found := found;

  if v_landing_page_found and v_landing_page_revision > 1 then
    if v_shared_catalog_version <> 5
       or v_landing_page_catalog_version <> 5
       or not v_shared_found
       or not public.e19_5_configuration_values_valid_for_account(
         p_account_id, v_shared_values, array['account', 'business']
       )
       or not public.e19_5_configuration_values_valid_for_account(
         p_account_id, v_landing_page_values, array['offer', 'campaign', 'landing_page']
       ) then
      raise exception using errcode = '23514', message = 'invalid_operational_configuration';
    end if;
    return query select v_shared_revision, v_landing_page_revision;
    return;
  end if;

  if v_status = 'archived' then
    raise exception using errcode = 'P0001', message = 'landing_page_not_operational';
  end if;

  select * into v_onboarding
  from public.account_landing_page_onboarding_configurations
  where account_id = p_account_id for update;
  if not found or v_onboarding.landing_page_id is distinct from p_landing_page_id
     or v_onboarding.revision <> p_expected_onboarding_revision then
    raise exception using errcode = '40001', message = 'onboarding_revision_conflict';
  end if;
  if not public.e19_5_configuration_values_valid_for_account(
    p_account_id, v_onboarding.values,
    array['account', 'business', 'offer', 'campaign', 'landing_page']
  ) then
    raise exception using errcode = '23514', message = 'invalid_onboarding_configuration';
  end if;

  select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb)
  into v_onboarding_shared_values
  from jsonb_each(v_onboarding.values) entry
  where entry.value ->> 'scope' in ('account', 'business');

  select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb)
  into v_onboarding_landing_page_values
  from jsonb_each(v_onboarding.values) entry
  where entry.value ->> 'scope' in ('offer', 'campaign', 'landing_page');

  v_next_shared_values := v_onboarding_shared_values || coalesce(v_shared_values, '{}'::jsonb);
  v_next_landing_page_values := v_onboarding_landing_page_values || coalesce(v_landing_page_values, '{}'::jsonb);

  if not public.e19_5_configuration_values_valid_for_account(
       p_account_id, v_next_shared_values, array['account', 'business']
     ) or not public.e19_5_configuration_values_valid_for_account(
       p_account_id, v_next_landing_page_values, array['offer', 'campaign', 'landing_page']
     ) then
    raise exception using errcode = '23514', message = 'invalid_operational_configuration';
  end if;

  if v_shared_found then
    update public.account_landing_page_shared_configurations
    set values = v_next_shared_values,
        revision = revision + case when values is distinct from v_next_shared_values then 1 else 0 end,
        updated_by = p_actor_user_id
    where account_id = p_account_id
    returning revision into v_shared_revision;
  else
    insert into public.account_landing_page_shared_configurations(
      account_id, catalog_version, values, revision, created_by, updated_by
    ) values (
      p_account_id, 5, v_next_shared_values, 1, p_actor_user_id, p_actor_user_id
    )
    returning revision into v_shared_revision;
  end if;

  if v_landing_page_found then
    update public.account_landing_page_configurations
    set values = v_next_landing_page_values,
        revision = revision + 1,
        updated_by = p_actor_user_id
    where landing_page_id = p_landing_page_id and account_id = p_account_id
    returning revision into v_landing_page_revision;
  else
    insert into public.account_landing_page_configurations(
      landing_page_id, account_id, catalog_version, values, revision, created_by, updated_by
    ) values (
      p_landing_page_id, p_account_id, 5, v_next_landing_page_values, 2,
      p_actor_user_id, p_actor_user_id
    )
    returning revision into v_landing_page_revision;
  end if;

  return query select v_shared_revision, v_landing_page_revision;
end;
$$;

create or replace function public.save_account_landing_page_configuration_v1(
  p_account_id uuid,
  p_landing_page_id uuid,
  p_shared_values jsonb,
  p_landing_page_values jsonb,
  p_expected_shared_revision bigint,
  p_expected_landing_page_revision bigint,
  p_actor_user_id uuid
)
returns table(shared_revision bigint, landing_page_revision bigint)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_shared_revision bigint;
  v_landing_page_revision bigint;
  v_current_shared_values jsonb;
  v_current_landing_page_values jsonb;
  v_editable_shared_values jsonb;
  v_editable_landing_page_values jsonb;
  v_next_shared_values jsonb;
  v_next_landing_page_values jsonb;
  v_shared_editable_fields constant text[] := array[
    'business_display_name', 'brand_color_palette', 'privacy_policy_url',
    'service_locations', 'financing_support_available',
    'document_support_available', 'creci_registration', 'attendance_modes'
  ];
  v_landing_page_editable_fields constant text[] := array[
    'primary_service_or_offer', 'primary_service_or_offer_description',
    'funnel_stage', 'traffic_source', 'primary_conversion_channel',
    'whatsapp_destination', 'phone_destination', 'email_destination',
    'external_url_destination', 'paid_search_keyword_map',
    'landing_page_objective', 'property_types', 'property_price_range',
    'property_stage', 'transaction_intent'
  ];
begin
  if not public.e19_5_actor_can_manage(p_account_id, p_actor_user_id) then
    raise exception using errcode = '42501', message = 'actor_not_authorized';
  end if;
  perform 1 from public.account_landing_pages
    where id = p_landing_page_id and account_id = p_account_id
      and status in ('draft', 'active') for update;
  if not found then raise exception using errcode = 'P0001', message = 'landing_page_not_operational'; end if;
  if jsonb_typeof(p_shared_values) is distinct from 'object'
     or jsonb_typeof(p_landing_page_values) is distinct from 'object' then
    raise exception using errcode = '22023', message = 'configuration_values_invalid';
  end if;

  select values, revision into v_current_shared_values, v_shared_revision
  from public.account_landing_page_shared_configurations
  where account_id = p_account_id
  for update;
  if not found or v_shared_revision <> p_expected_shared_revision then
    raise exception using errcode = '40001', message = 'shared_revision_conflict';
  end if;

  select values, revision into v_current_landing_page_values, v_landing_page_revision
  from public.account_landing_page_configurations
  where landing_page_id = p_landing_page_id and account_id = p_account_id
  for update;
  if not found or v_landing_page_revision <> p_expected_landing_page_revision then
    raise exception using errcode = '40001', message = 'landing_page_revision_conflict';
  end if;

  select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb)
  into v_editable_shared_values
  from jsonb_each(p_shared_values) entry
  where entry.key = any(v_shared_editable_fields);

  select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb)
  into v_editable_landing_page_values
  from jsonb_each(p_landing_page_values) entry
  where entry.key = any(v_landing_page_editable_fields);

  v_next_shared_values :=
    (v_current_shared_values - v_shared_editable_fields) || v_editable_shared_values;
  v_next_landing_page_values :=
    (v_current_landing_page_values - v_landing_page_editable_fields) || v_editable_landing_page_values;

  if not public.e19_5_configuration_values_valid_for_account(
       p_account_id, v_next_shared_values, array['account', 'business']
     ) or not public.e19_5_configuration_values_valid_for_account(
       p_account_id, v_next_landing_page_values, array['offer', 'campaign', 'landing_page']
     ) then
    raise exception using errcode = '22023', message = 'configuration_values_invalid';
  end if;

  update public.account_landing_page_shared_configurations
  set values = v_next_shared_values, revision = revision + 1, updated_by = p_actor_user_id
  where account_id = p_account_id and revision = p_expected_shared_revision
  returning revision into v_shared_revision;

  update public.account_landing_page_configurations
  set values = v_next_landing_page_values, revision = revision + 1, updated_by = p_actor_user_id
  where landing_page_id = p_landing_page_id and account_id = p_account_id
    and revision = p_expected_landing_page_revision
  returning revision into v_landing_page_revision;

  return query select v_shared_revision, v_landing_page_revision;
end;
$$;

create or replace function public.approve_account_landing_page_materialization_v1(
  p_account_id uuid,
  p_landing_page_id uuid,
  p_materialization_id uuid,
  p_actor_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_current uuid;
begin
  if not public.e19_5_actor_can_manage(p_account_id, p_actor_user_id) then
    raise exception using errcode = '42501', message = 'actor_not_authorized';
  end if;
  select approved_materialization_id into v_current
  from public.account_landing_pages
  where id = p_landing_page_id and account_id = p_account_id
    and status in ('draft', 'active') for update;
  if not found then raise exception using errcode = 'P0001', message = 'landing_page_not_operational'; end if;
  if not exists (
    select 1 from public.account_landing_page_materializations
    where id = p_materialization_id and landing_page_id = p_landing_page_id
      and account_id = p_account_id
  ) then raise exception using errcode = '23503', message = 'materialization_not_found'; end if;
  if v_current is distinct from p_materialization_id then
    update public.account_landing_pages
    set approved_materialization_id = p_materialization_id
    where id = p_landing_page_id and account_id = p_account_id;
  end if;
  return p_materialization_id;
end;
$$;

create or replace function public.set_account_landing_page_archived_v1(
  p_account_id uuid,
  p_landing_page_id uuid,
  p_archived boolean,
  p_actor_user_id uuid
)
returns text
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_status text; v_target text;
begin
  if not public.e19_5_actor_can_manage(p_account_id, p_actor_user_id) then
    raise exception using errcode = '42501', message = 'actor_not_authorized';
  end if;
  select status into v_status from public.account_landing_pages
  where id = p_landing_page_id and account_id = p_account_id for update;
  if not found then raise exception using errcode = 'P0001', message = 'landing_page_not_found'; end if;
  v_target := case when p_archived then 'archived' else 'active' end;
  if p_archived and v_status not in ('draft', 'active', 'archived') then
    raise exception using errcode = '23514', message = 'invalid_lifecycle_transition';
  end if;
  if not p_archived and v_status <> 'archived' then
    raise exception using errcode = '23514', message = 'invalid_lifecycle_transition';
  end if;
  if v_status is distinct from v_target then
    update public.account_landing_pages set status = v_target
    where id = p_landing_page_id and account_id = p_account_id;
  end if;
  return v_target;
end;
$$;

create or replace function public.e19_5_landing_page_workspace_readiness()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_ready boolean;
  v_status_contract boolean;
  v_append_compatibility boolean;
  v_materialization_objects boolean;
  v_workspace_objects boolean;
  v_status_check text;
  v_status_default text;
  v_status_validated boolean;
  v_append_oid oid;
  v_append_definition text;
  v_append_owner text;
  v_append_security_definer boolean;
  v_append_config text[];
begin
  select pg_get_constraintdef(constraint_row.oid), constraint_row.convalidated
  into v_status_check, v_status_validated
  from pg_constraint constraint_row
  where constraint_row.conrelid = 'public.account_landing_pages'::regclass
    and constraint_row.conname = 'account_landing_pages_status_chk'
    and constraint_row.contype = 'c';

  select pg_get_expr(attribute.adbin, attribute.adrelid)
  into v_status_default
  from pg_attrdef attribute
  join pg_attribute column_row
    on column_row.attrelid = attribute.adrelid
   and column_row.attnum = attribute.adnum
  where attribute.adrelid = 'public.account_landing_pages'::regclass
    and column_row.attname = 'status';

  v_status_contract := coalesce(
    v_status_validated
    and v_status_check ilike '%draft%'
    and v_status_check ilike '%active%'
    and v_status_check ilike '%archived%'
    and (
      select count(*)
      from regexp_matches(v_status_check, '''[^'']+''', 'g')
    ) = 3
    and v_status_default = '''draft''::text'
    and not exists (
      select 1 from public.account_landing_pages
      where status not in ('draft', 'active', 'archived')
    ),
    false
  );

  select to_regprocedure(
    'public.append_account_landing_page_materialization_v1(uuid,uuid,uuid,jsonb,jsonb,uuid)'
  )::oid into v_append_oid;

  if v_append_oid is not null then
    select
      pg_get_functiondef(procedure_row.oid),
      pg_get_userbyid(procedure_row.proowner),
      procedure_row.prosecdef,
      procedure_row.proconfig
    into
      v_append_definition,
      v_append_owner,
      v_append_security_definer,
      v_append_config
    from pg_proc procedure_row
    where procedure_row.oid = v_append_oid;
  end if;

  v_append_compatibility := coalesce(
    v_append_oid is not null
    and v_append_owner = 'postgres'
    and v_append_security_definer
    and 'search_path=public, pg_catalog' = any(v_append_config)
    and v_append_definition ~* 'status[[:space:]]+in[[:space:]]*\(''draft'',[[:space:]]*''active''\)'
    and strpos(lower(v_append_definition), 'where materialization.attempt_id = p_attempt_id') > 0
    and strpos(lower(v_append_definition), 'where materialization.attempt_id = p_attempt_id')
      < strpos(lower(v_append_definition), 'and lp.status in')
    and has_function_privilege('service_role', v_append_oid, 'EXECUTE')
    and not has_function_privilege('anon', v_append_oid, 'EXECUTE')
    and not has_function_privilege('authenticated', v_append_oid, 'EXECUTE'),
    false
  );

  v_materialization_objects := coalesce(
    (public.e19_4_landing_page_revision_readiness() ->> 'ready')::boolean,
    false
  ) and exists (
    select 1 from pg_constraint
    where conrelid = 'public.account_landing_page_materializations'::regclass
      and conname = 'account_landing_page_materializations_id_landing_page_account_key'
  );

  select
    to_regclass('public.account_landing_page_shared_configurations') is not null
    and to_regclass('public.account_landing_page_configurations') is not null
    and exists (select 1 from information_schema.columns where table_schema='public' and table_name='account_landing_pages' and column_name='approved_materialization_id')
    and exists (select 1 from pg_constraint where conrelid='public.account_landing_pages'::regclass and conname='account_landing_pages_approved_materialization_fkey')
    and (select relrowsecurity from pg_class where oid='public.account_landing_page_shared_configurations'::regclass)
    and (select relrowsecurity from pg_class where oid='public.account_landing_page_configurations'::regclass)
    and not exists (select 1 from pg_policies where schemaname='public' and tablename in ('account_landing_page_shared_configurations','account_landing_page_configurations'))
    and has_table_privilege('service_role','public.account_landing_page_shared_configurations','SELECT,INSERT,UPDATE')
    and not has_table_privilege('service_role','public.account_landing_page_shared_configurations','DELETE,TRUNCATE')
    and has_table_privilege('service_role','public.account_landing_page_configurations','SELECT,INSERT,UPDATE')
    and not has_table_privilege('service_role','public.account_landing_page_configurations','DELETE,TRUNCATE')
    and not has_table_privilege('service_role','public.account_landing_pages','DELETE')
    and has_function_privilege('service_role','public.create_account_landing_page_v1(uuid,text,text,uuid)','EXECUTE')
    and has_function_privilege('service_role','public.handoff_account_landing_page_onboarding_v1(uuid,uuid,bigint,uuid)','EXECUTE')
    and has_function_privilege('service_role','public.save_account_landing_page_configuration_v1(uuid,uuid,jsonb,jsonb,bigint,bigint,uuid)','EXECUTE')
    and has_function_privilege('service_role','public.approve_account_landing_page_materialization_v1(uuid,uuid,uuid,uuid)','EXECUTE')
    and has_function_privilege('service_role','public.set_account_landing_page_archived_v1(uuid,uuid,boolean,uuid)','EXECUTE')
  into v_workspace_objects;

  v_ready := coalesce(
    v_status_contract
    and v_append_compatibility
    and v_materialization_objects
    and v_workspace_objects,
    false
  );

  return jsonb_build_object(
    'ready', v_ready,
    'schema_version', case when v_ready then 1 else null end,
    'checks', jsonb_build_object(
      'status_contract_transitional', coalesce(v_status_contract, false),
      'append_compatibility', coalesce(v_append_compatibility, false),
      'materialization_objects', coalesce(v_materialization_objects, false),
      'workspace_objects', coalesce(v_workspace_objects, false)
    )
  );
end;
$$;

do $$
declare signature text;
begin
  foreach signature in array array[
    'public.create_account_landing_page_v1(uuid,text,text,uuid)',
    'public.handoff_account_landing_page_onboarding_v1(uuid,uuid,bigint,uuid)',
    'public.save_account_landing_page_configuration_v1(uuid,uuid,jsonb,jsonb,bigint,bigint,uuid)',
    'public.approve_account_landing_page_materialization_v1(uuid,uuid,uuid,uuid)',
    'public.set_account_landing_page_archived_v1(uuid,uuid,boolean,uuid)',
    'public.e19_5_landing_page_workspace_readiness()'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', signature);
    if to_regrole('ai_readonly') is not null then
      execute format('revoke all on function %s from ai_readonly', signature);
    end if;
    execute format('grant execute on function %s to service_role', signature);
  end loop;
end;
$$;

comment on table public.account_landing_page_shared_configurations is
  'Configuracao operacional compartilhada E19.5 para valores nao autoritativos de account/business.';
comment on table public.account_landing_page_configurations is
  'Configuracao operacional E19.5 por landing page para offer/campaign/landing_page.';
comment on column public.account_landing_pages.approved_materialization_id is
  'Revisao materializada aprovada explicitamente por humano; nullable e tenant-safe.';

commit;
