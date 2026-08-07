begin;

alter table public.account_landing_pages
  add constraint account_landing_pages_id_account_id_key
  unique (id, account_id);

create table public.account_landing_page_onboarding_configurations (
  account_id uuid primary key,
  landing_page_id uuid null,
  catalog_version integer not null,
  values jsonb not null default '{}'::jsonb,
  revision bigint not null default 1,
  created_by uuid not null,
  updated_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_landing_page_onboarding_configurations_account_id_fkey
    foreign key (account_id)
    references public.accounts(id)
    on update cascade
    on delete cascade,
  constraint account_landing_page_onboarding_configurations_landing_page_fkey
    foreign key (landing_page_id, account_id)
    references public.account_landing_pages(id, account_id)
    on update cascade
    on delete restrict,
  constraint account_landing_page_onboarding_configurations_created_by_fkey
    foreign key (created_by)
    references auth.users(id)
    on update cascade
    on delete restrict,
  constraint account_landing_page_onboarding_configurations_updated_by_fkey
    foreign key (updated_by)
    references auth.users(id)
    on update cascade
    on delete restrict,
  constraint account_landing_page_onboarding_configurations_catalog_version_chk
    check (catalog_version > 0),
  constraint account_landing_page_onboarding_configurations_revision_chk
    check (revision > 0),
  constraint account_landing_page_onboarding_configurations_values_object_chk
    check (jsonb_typeof(values) = 'object')
);

create index account_landing_page_onboarding_configurations_landing_page_id_idx
  on public.account_landing_page_onboarding_configurations (landing_page_id)
  where landing_page_id is not null;

create or replace function public.prevent_account_landing_page_onboarding_rebind()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.landing_page_id is not null
    and new.landing_page_id is distinct from old.landing_page_id
  then
    raise exception using
      errcode = '23514',
      message = 'landing_page_id is write-once for onboarding configurations';
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_account_landing_page_onboarding_rebind()
  from public, anon, authenticated, service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.prevent_account_landing_page_onboarding_rebind() from ai_readonly';
  end if;
end;
$$;

create trigger account_landing_page_onboarding_configurations_prevent_rebind
  before update of landing_page_id
  on public.account_landing_page_onboarding_configurations
  for each row
  execute function public.prevent_account_landing_page_onboarding_rebind();

create trigger account_landing_page_onboarding_configurations_set_updated_at
  before update
  on public.account_landing_page_onboarding_configurations
  for each row
  execute function public.tg_set_updated_at();

alter table public.account_landing_page_onboarding_configurations
  enable row level security;

revoke all on table public.account_landing_page_onboarding_configurations
  from public, anon, authenticated, service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on table public.account_landing_page_onboarding_configurations from ai_readonly';
  end if;
end;
$$;

grant select, insert, update
  on table public.account_landing_page_onboarding_configurations
  to service_role;

comment on table public.account_landing_page_onboarding_configurations
  is 'Agregado versionado e retomavel da configuracao minima para a primeira landing page por conta.';

comment on column public.account_landing_page_onboarding_configurations.values
  is 'Objeto JSON indexado por fieldKey; cada entrada contem somente scope e value validados contra o catalogo E20.2.';

commit;
