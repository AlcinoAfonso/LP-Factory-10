begin;

create table if not exists public.account_commercial_entitlements (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  plan_key text not null,
  plan_name_snapshot text not null,
  origin text not null,
  status text not null,
  starts_at timestamptz null,
  confirmed_at timestamptz null,
  expires_at timestamptz null,
  canceled_at timestamptz null,
  external_provider text null,
  external_reference text null,
  idempotency_key text null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_commercial_entitlements_account_id_fkey
    foreign key (account_id)
    references public.accounts(id)
    on update cascade
    on delete cascade,
  constraint account_commercial_entitlements_plan_key_chk
    check (plan_key in ('starter', 'lite', 'pro', 'ultra')),
  constraint account_commercial_entitlements_plan_name_snapshot_nonempty_chk
    check (length(btrim(plan_name_snapshot)) > 0),
  constraint account_commercial_entitlements_origin_chk
    check (origin in ('plano_pago_confirmado', 'trial', 'liberacao_manual')),
  constraint account_commercial_entitlements_status_chk
    check (status in ('pendente_confirmacao', 'ativo', 'expirado', 'cancelado')),
  constraint account_commercial_entitlements_metadata_json_object_chk
    check (jsonb_typeof(metadata_json) = 'object'),
  constraint account_commercial_entitlements_vigencia_chk
    check (starts_at is null or expires_at is null or expires_at > starts_at),
  constraint account_commercial_entitlements_canceled_at_chk
    check (canceled_at is null or status = 'cancelado'),
  constraint account_commercial_entitlements_external_provider_nonempty_chk
    check (external_provider is null or length(btrim(external_provider)) > 0),
  constraint account_commercial_entitlements_external_reference_nonempty_chk
    check (external_reference is null or length(btrim(external_reference)) > 0),
  constraint account_commercial_entitlements_idempotency_key_nonempty_chk
    check (idempotency_key is null or length(btrim(idempotency_key)) > 0)
);

create index if not exists account_commercial_entitlements_account_id_idx
  on public.account_commercial_entitlements (account_id);

create index if not exists account_commercial_entitlements_status_idx
  on public.account_commercial_entitlements (status);

create index if not exists account_commercial_entitlements_expires_at_idx
  on public.account_commercial_entitlements (expires_at);

create index if not exists account_commercial_entitlements_effective_lookup_idx
  on public.account_commercial_entitlements (account_id, status, starts_at, expires_at)
  where status = 'ativo';

create unique index if not exists account_commercial_entitlements_idempotency_key_uidx
  on public.account_commercial_entitlements (idempotency_key)
  where idempotency_key is not null;

drop trigger if exists account_commercial_entitlements_set_updated_at
  on public.account_commercial_entitlements;
create trigger account_commercial_entitlements_set_updated_at
  before update on public.account_commercial_entitlements
  for each row
  execute function public.tg_set_updated_at();

alter table public.account_commercial_entitlements enable row level security;

revoke all on table public.account_commercial_entitlements from public, anon, authenticated;
grant select on table public.account_commercial_entitlements to authenticated;
grant select, insert, update, delete on table public.account_commercial_entitlements to service_role;

drop policy if exists account_commercial_entitlements_select_member_or_platform
  on public.account_commercial_entitlements;
create policy account_commercial_entitlements_select_member_or_platform
  on public.account_commercial_entitlements
  for select
  to authenticated
  using (
    coalesce(public.is_platform_admin(), false)
    or exists (
      select 1
      from public.account_users au
      where au.account_id = account_commercial_entitlements.account_id
        and au.user_id = auth.uid()
        and au.status = 'active'
    )
  );

create or replace view public.v_account_commercial_entitlement_effective
with (security_invoker = true)
as
with entitlement_candidates as (
  select
    entitlements.id,
    entitlements.account_id,
    entitlements.plan_key,
    entitlements.plan_name_snapshot,
    entitlements.origin,
    entitlements.status as persisted_status,
    case
      when entitlements.status = 'ativo'
        and entitlements.canceled_at is not null
        then 'cancelado'
      when entitlements.status = 'ativo'
        and entitlements.expires_at is not null
        and entitlements.expires_at <= now()
        then 'expirado'
      when entitlements.status = 'ativo'
        and entitlements.starts_at is not null
        and entitlements.starts_at > now()
        then 'pendente_confirmacao'
      else entitlements.status
    end as effective_status,
    entitlements.starts_at,
    entitlements.confirmed_at,
    entitlements.expires_at,
    entitlements.canceled_at,
    (
      entitlements.status = 'ativo'
      and entitlements.canceled_at is null
      and (entitlements.starts_at is null or entitlements.starts_at <= now())
      and (entitlements.expires_at is null or entitlements.expires_at > now())
    ) as is_commercially_eligible,
    entitlements.created_at,
    entitlements.updated_at
  from public.account_commercial_entitlements entitlements
),
ranked_entitlements as (
  select
    entitlement_candidates.*,
    row_number() over (
      partition by entitlement_candidates.account_id
      order by
        entitlement_candidates.is_commercially_eligible desc,
        entitlement_candidates.confirmed_at desc nulls last,
        entitlement_candidates.created_at desc,
        entitlement_candidates.id desc
    ) as effective_rank
  from entitlement_candidates
)
select
  id,
  account_id,
  plan_key,
  plan_name_snapshot,
  origin,
  persisted_status,
  effective_status,
  starts_at,
  confirmed_at,
  expires_at,
  canceled_at,
  is_commercially_eligible,
  created_at,
  updated_at
from ranked_entitlements
where effective_rank = 1;

revoke all on table public.v_account_commercial_entitlement_effective
  from public, anon, authenticated;
grant select on table public.v_account_commercial_entitlement_effective
  to authenticated;
grant select on table public.v_account_commercial_entitlement_effective
  to service_role;

comment on table public.account_commercial_entitlements
  is 'Fonte minima de entitlement comercial por conta. Nao armazena payload bruto, dados de cartao, secrets ou PII sensivel.';

comment on view public.v_account_commercial_entitlement_effective
  is 'Leitura efetiva read-only do entitlement comercial por conta para consumo server-side futuro.';

commit;
