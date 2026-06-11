-- 0013__e10_5_6_ai_structured_outputs.sql
-- E10.5.6 / 20.8 — colunas IA / Structured Outputs em account_niche_resolutions
-- Objetivo:
-- - persistir a saída IA estruturada na resolução operacional da conta
-- - manter account_niche_resolutions como registro operacional atual
-- - não criar tabela nova
-- - não alterar account_taxonomy
-- - não criar taxon automaticamente
-- - não criar alias automaticamente
-- - não alterar RLS/policies
-- - não apagar dados

begin;

alter table public.account_niche_resolutions
  add column if not exists ai_status text null;

alter table public.account_niche_resolutions
  add column if not exists ai_error_code text null;

alter table public.account_niche_resolutions
  add column if not exists ai_model text null;

alter table public.account_niche_resolutions
  add column if not exists ai_schema_version text null;

alter table public.account_niche_resolutions
  add column if not exists ai_result_json jsonb null;

alter table public.account_niche_resolutions
  add column if not exists ai_ux_mode text null;

alter table public.account_niche_resolutions
  add column if not exists ai_suggested_taxon_id uuid null;

alter table public.account_niche_resolutions
  add column if not exists ai_suggested_new_taxon_label text null;

alter table public.account_niche_resolutions
  add column if not exists ai_needs_user_confirmation boolean not null default false;

alter table public.account_niche_resolutions
  add column if not exists ai_needs_admin_review boolean not null default false;

alter table public.account_niche_resolutions
  add column if not exists ai_reason text null;

alter table public.account_niche_resolutions
  add column if not exists ai_processed_at timestamptz null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'account_niche_resolutions_ai_status_chk'
      and conrelid = 'public.account_niche_resolutions'::regclass
  ) then
    alter table public.account_niche_resolutions
      add constraint account_niche_resolutions_ai_status_chk
      check (
        ai_status is null
        or ai_status in (
          'skipped',
          'resolved',
          'failed'
        )
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'account_niche_resolutions_ai_result_json_chk'
      and conrelid = 'public.account_niche_resolutions'::regclass
  ) then
    alter table public.account_niche_resolutions
      add constraint account_niche_resolutions_ai_result_json_chk
      check (
        ai_result_json is null
        or jsonb_typeof(ai_result_json) = 'object'
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'account_niche_resolutions_ai_ux_mode_chk'
      and conrelid = 'public.account_niche_resolutions'::regclass
  ) then
    alter table public.account_niche_resolutions
      add constraint account_niche_resolutions_ai_ux_mode_chk
      check (
        ai_ux_mode is null
        or ai_ux_mode in (
          'none',
          'confirm_single',
          'choose_from_options',
          'fallback_review'
        )
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'account_niche_resolutions_ai_suggested_taxon_id_fkey'
      and conrelid = 'public.account_niche_resolutions'::regclass
  ) then
    alter table public.account_niche_resolutions
      add constraint account_niche_resolutions_ai_suggested_taxon_id_fkey
      foreign key (ai_suggested_taxon_id)
      references public.business_taxons(id)
      on update cascade
      on delete set null;
  end if;
end;
$$;

create index if not exists account_niche_resolutions_ai_suggested_taxon_id_idx
  on public.account_niche_resolutions using btree (ai_suggested_taxon_id);

commit;
