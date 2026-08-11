begin;

create table public.account_landing_page_materializations (
  landing_page_id uuid primary key,
  account_id uuid not null,
  content_json jsonb not null,
  generation_context_snapshot_json jsonb not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  constraint account_landing_page_materializations_landing_page_fkey
    foreign key (landing_page_id, account_id)
    references public.account_landing_pages(id, account_id)
    on update restrict
    on delete cascade,
  constraint account_landing_page_materializations_account_id_fkey
    foreign key (account_id)
    references public.accounts(id)
    on update restrict
    on delete cascade,
  constraint account_landing_page_materializations_created_by_fkey
    foreign key (created_by)
    references auth.users(id)
    on update restrict
    on delete restrict,
  constraint account_landing_page_materializations_content_object_chk
    check (jsonb_typeof(content_json) = 'object'),
  constraint account_landing_page_materializations_snapshot_object_chk
    check (jsonb_typeof(generation_context_snapshot_json) = 'object')
);

create index account_landing_page_materializations_account_id_idx
  on public.account_landing_page_materializations (account_id);

create index account_landing_page_materializations_created_by_idx
  on public.account_landing_page_materializations (created_by);

alter table public.account_landing_page_materializations
  enable row level security;

revoke all on table public.account_landing_page_materializations
  from public, anon, authenticated, service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on table public.account_landing_page_materializations from ai_readonly';
  end if;
end;
$$;

grant select, insert
  on table public.account_landing_page_materializations
  to service_role;

comment on table public.account_landing_page_materializations
  is 'Materializacao inicial 1:1 e write-once da landing page em draft, com conteudo renderizavel e snapshot geracional atomicos.';

commit;
