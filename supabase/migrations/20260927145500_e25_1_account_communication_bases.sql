begin;

create table public.account_communication_bases (
  account_id uuid primary key references public.accounts (id) on delete cascade,
  sections_json jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_communication_bases_sections_object_chk
    check (jsonb_typeof(sections_json) = 'object'),
  constraint account_communication_bases_version_positive_chk
    check (version > 0)
);

comment on table public.account_communication_bases
  is 'Base de Comunicacao atual e unica por conta; sem vinculo persistente com fontes ou consumidores.';

alter table public.account_communication_bases enable row level security;

revoke all on table public.account_communication_bases
  from public, anon, authenticated, service_role;
grant select on table public.account_communication_bases to authenticated;
grant select, insert, update on table public.account_communication_bases to service_role;
do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on table public.account_communication_bases from ai_readonly';
  end if;
end;
$$;

create policy account_communication_bases_select_eligible_member
  on public.account_communication_bases
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.account_users au
      join public.accounts a on a.id = au.account_id
      where au.account_id = account_communication_bases.account_id
        and au.user_id = auth.uid()
        and au.status = 'active'
        and a.status = 'active'
    )
    and exists (
      select 1
      from public.v_account_commercial_entitlement_effective entitlement
      where entitlement.account_id = account_communication_bases.account_id
        and entitlement.is_commercially_eligible = true
    )
  );

commit;
