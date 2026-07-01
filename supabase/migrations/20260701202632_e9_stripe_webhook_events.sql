begin;

create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  event_type text not null,
  provider text not null default 'stripe',
  processing_status text not null,
  account_id uuid null,
  entitlement_id uuid null,
  external_reference text null,
  error_code text null,
  metadata_json jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stripe_webhook_events_event_id_uidx unique (event_id),
  constraint stripe_webhook_events_provider_chk
    check (provider = 'stripe'),
  constraint stripe_webhook_events_status_chk
    check (processing_status in ('processing', 'processed', 'ignored', 'failed')),
  constraint stripe_webhook_events_event_id_nonempty_chk
    check (length(btrim(event_id)) > 0),
  constraint stripe_webhook_events_event_type_nonempty_chk
    check (length(btrim(event_type)) > 0),
  constraint stripe_webhook_events_external_reference_nonempty_chk
    check (external_reference is null or length(btrim(external_reference)) > 0),
  constraint stripe_webhook_events_error_code_nonempty_chk
    check (error_code is null or length(btrim(error_code)) > 0),
  constraint stripe_webhook_events_metadata_json_object_chk
    check (jsonb_typeof(metadata_json) = 'object'),
  constraint stripe_webhook_events_account_id_fkey
    foreign key (account_id)
    references public.accounts(id)
    on update cascade
    on delete set null,
  constraint stripe_webhook_events_entitlement_id_fkey
    foreign key (entitlement_id)
    references public.account_commercial_entitlements(id)
    on update cascade
    on delete set null
);

create index if not exists stripe_webhook_events_event_type_idx
  on public.stripe_webhook_events (event_type);

create index if not exists stripe_webhook_events_processing_status_idx
  on public.stripe_webhook_events (processing_status);

create index if not exists stripe_webhook_events_account_id_idx
  on public.stripe_webhook_events (account_id);

create index if not exists stripe_webhook_events_external_reference_idx
  on public.stripe_webhook_events (external_reference)
  where external_reference is not null;

drop trigger if exists stripe_webhook_events_set_updated_at
  on public.stripe_webhook_events;
create trigger stripe_webhook_events_set_updated_at
  before update on public.stripe_webhook_events
  for each row
  execute function public.tg_set_updated_at();

alter table public.stripe_webhook_events enable row level security;

revoke all on table public.stripe_webhook_events from public, anon, authenticated;
grant select, insert, update on table public.stripe_webhook_events to service_role;

comment on table public.stripe_webhook_events
  is 'Registro minimo de eventos Stripe para idempotencia/auditoria operacional. Nao armazena payload bruto, secrets, dados de cartao ou PII.';

comment on column public.stripe_webhook_events.metadata_json
  is 'Metadados operacionais minimos e nao sensiveis do processamento; payload bruto Stripe e PII sao proibidos.';

commit;
