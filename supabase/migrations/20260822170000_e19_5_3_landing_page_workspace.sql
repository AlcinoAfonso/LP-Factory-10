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

create or replace function public.e19_5_configuration_values_have_scopes(
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
      where jsonb_typeof(entry.value) <> 'object'
        or not (entry.value ?& array['scope', 'value'])
        or entry.value - 'scope' - 'value' <> '{}'::jsonb
        or jsonb_typeof(entry.value -> 'scope') <> 'string'
        or not ((entry.value ->> 'scope') = any(p_allowed_scopes))
    );
$$;

revoke all on function public.e19_5_configuration_values_have_scopes(jsonb, text[])
  from public, anon, authenticated, service_role;

grant execute on function public.e19_5_actor_can_manage(uuid, uuid)
  to service_role;
grant execute on function public.e19_5_configuration_values_have_scopes(jsonb, text[])
  to service_role;

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
    check (catalog_version > 0),
  constraint account_landing_page_shared_configurations_revision_chk
    check (revision > 0),
  constraint account_landing_page_shared_configurations_values_chk
    check (public.e19_5_configuration_values_have_scopes(values, array['account', 'business']))
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
    check (catalog_version > 0),
  constraint account_landing_page_configurations_revision_chk
    check (revision > 0),
  constraint account_landing_page_configurations_values_chk
    check (public.e19_5_configuration_values_have_scopes(values, array['offer', 'campaign', 'landing_page']))
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

grant select, insert, update on table public.account_landing_page_shared_configurations
  to service_role;
grant select, insert, update on table public.account_landing_page_configurations
  to service_role;

create or replace function public.save_account_landing_page_configuration_v1(
  p_account_id uuid,
  p_landing_page_id uuid,
  p_shared_values jsonb,
  p_landing_page_values jsonb,
  p_expected_shared_revision bigint,
  p_expected_landing_page_revision bigint,
  p_catalog_version integer,
  p_actor_user_id uuid
)
returns table(shared_revision bigint, landing_page_revision bigint)
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_shared_exists boolean := false;
  v_landing_exists boolean := false;
  v_shared_revision bigint;
  v_landing_revision bigint;
  v_shared_values jsonb;
  v_landing_values jsonb;
  v_shared_catalog integer;
  v_landing_catalog integer;
begin
  if p_catalog_version is distinct from 5 then
    raise exception using errcode = '22023', message = 'catalog_version_not_authorized';
  end if;
  if not public.e19_5_actor_can_manage(p_account_id, p_actor_user_id) then
    raise exception using errcode = '42501', message = 'actor_not_authorized';
  end if;
  perform 1
  from public.account_landing_pages
  where id = p_landing_page_id
    and account_id = p_account_id
    and status in ('draft', 'active')
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'landing_page_not_operational';
  end if;
  if not public.e19_5_configuration_values_have_scopes(
       p_shared_values, array['account', 'business']
     )
     or not public.e19_5_configuration_values_have_scopes(
       p_landing_page_values, array['offer', 'campaign', 'landing_page']
     ) then
    raise exception using errcode = '22023', message = 'configuration_values_invalid';
  end if;

  select values, revision, catalog_version
  into v_shared_values, v_shared_revision, v_shared_catalog
  from public.account_landing_page_shared_configurations
  where account_id = p_account_id
  for update;
  v_shared_exists := found;
  if v_shared_exists then
    if p_expected_shared_revision is null
       or v_shared_revision <> p_expected_shared_revision then
      raise exception using errcode = '40001', message = 'shared_revision_conflict';
    end if;
    if v_shared_values is distinct from p_shared_values
       or v_shared_catalog is distinct from p_catalog_version then
      update public.account_landing_page_shared_configurations
      set values = p_shared_values,
          catalog_version = p_catalog_version,
          revision = revision + 1,
          updated_by = p_actor_user_id
      where account_id = p_account_id
      returning revision into v_shared_revision;
    end if;
  else
    if p_expected_shared_revision is not null then
      raise exception using errcode = '40001', message = 'shared_revision_conflict';
    end if;
    if p_shared_values <> '{}'::jsonb then
      insert into public.account_landing_page_shared_configurations (
        account_id, catalog_version, values, revision, created_by, updated_by
      ) values (
        p_account_id, p_catalog_version, p_shared_values, 1,
        p_actor_user_id, p_actor_user_id
      )
      returning revision into v_shared_revision;
    else
      v_shared_revision := null;
    end if;
  end if;

  select values, revision, catalog_version
  into v_landing_values, v_landing_revision, v_landing_catalog
  from public.account_landing_page_configurations
  where landing_page_id = p_landing_page_id
    and account_id = p_account_id
  for update;
  v_landing_exists := found;
  if v_landing_exists then
    if p_expected_landing_page_revision is null
       or v_landing_revision <> p_expected_landing_page_revision then
      raise exception using errcode = '40001', message = 'landing_page_revision_conflict';
    end if;
    if v_landing_values is distinct from p_landing_page_values
       or v_landing_catalog is distinct from p_catalog_version then
      update public.account_landing_page_configurations
      set values = p_landing_page_values,
          catalog_version = p_catalog_version,
          revision = revision + 1,
          updated_by = p_actor_user_id
      where landing_page_id = p_landing_page_id
        and account_id = p_account_id
      returning revision into v_landing_revision;
    end if;
  else
    if p_expected_landing_page_revision is not null then
      raise exception using errcode = '40001', message = 'landing_page_revision_conflict';
    end if;
    insert into public.account_landing_page_configurations (
      landing_page_id, account_id, catalog_version, values, revision,
      created_by, updated_by
    ) values (
      p_landing_page_id, p_account_id, p_catalog_version,
      p_landing_page_values, 1, p_actor_user_id, p_actor_user_id
    )
    returning revision into v_landing_revision;
  end if;

  return query select v_shared_revision, v_landing_revision;
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
declare
  v_current uuid;
begin
  if not public.e19_5_actor_can_manage(p_account_id, p_actor_user_id) then
    raise exception using errcode = '42501', message = 'actor_not_authorized';
  end if;
  select approved_materialization_id
  into v_current
  from public.account_landing_pages
  where id = p_landing_page_id
    and account_id = p_account_id
    and status in ('draft', 'active')
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'landing_page_not_operational';
  end if;
  if not exists (
    select 1
    from public.account_landing_page_materializations
    where id = p_materialization_id
      and landing_page_id = p_landing_page_id
      and account_id = p_account_id
  ) then
    raise exception using errcode = '23503', message = 'materialization_not_found';
  end if;
  if v_current is distinct from p_materialization_id then
    update public.account_landing_pages
    set approved_materialization_id = p_materialization_id
    where id = p_landing_page_id
      and account_id = p_account_id;
  end if;
  return p_materialization_id;
end;
$$;

alter function public.save_account_landing_page_configuration_v1(
  uuid, uuid, jsonb, jsonb, bigint, bigint, integer, uuid
) owner to postgres;
alter function public.approve_account_landing_page_materialization_v1(
  uuid, uuid, uuid, uuid
) owner to postgres;

revoke all on function public.save_account_landing_page_configuration_v1(
  uuid, uuid, jsonb, jsonb, bigint, bigint, integer, uuid
) from public, anon, authenticated;
revoke all on function public.approve_account_landing_page_materialization_v1(
  uuid, uuid, uuid, uuid
) from public, anon, authenticated;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.save_account_landing_page_configuration_v1(uuid, uuid, jsonb, jsonb, bigint, bigint, integer, uuid) from ai_readonly';
    execute 'revoke all on function public.approve_account_landing_page_materialization_v1(uuid, uuid, uuid, uuid) from ai_readonly';
  end if;
end;
$$;

grant execute on function public.save_account_landing_page_configuration_v1(
  uuid, uuid, jsonb, jsonb, bigint, bigint, integer, uuid
) to service_role;
grant execute on function public.approve_account_landing_page_materialization_v1(
  uuid, uuid, uuid, uuid
) to service_role;

comment on table public.account_landing_page_shared_configurations
  is 'Configuracao operacional compartilhada account/business, criada somente quando o fluxo da LP a necessita.';
comment on table public.account_landing_page_configurations
  is 'Configuracao operacional especifica por LP, parcial e criada de forma lazy no primeiro save.';
comment on column public.account_landing_pages.approved_materialization_id
  is 'Revisao explicitamente aprovada; independente da revisao mais recente e de publicacao futura.';

commit;
