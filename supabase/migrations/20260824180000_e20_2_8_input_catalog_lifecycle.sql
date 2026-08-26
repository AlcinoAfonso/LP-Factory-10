begin;

create table public.landing_page_input_catalog_drafts (
  singleton boolean primary key default true,
  base_version integer not null,
  target_version integer not null,
  catalog_json jsonb not null,
  content_fingerprint text not null,
  revision bigint not null default 1,
  validation_fingerprint text,
  validation_context_fingerprint text,
  validated_at timestamptz,
  publication_fingerprint text,
  publication_context_fingerprint text,
  publication_prepared_at timestamptz,
  taxon_review_evidence jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on update cascade on delete restrict,
  updated_by uuid not null references auth.users(id) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landing_page_input_catalog_drafts_singleton_chk
    check (singleton),
  constraint landing_page_input_catalog_drafts_versions_chk
    check (base_version > 0 and target_version = base_version + 1),
  constraint landing_page_input_catalog_drafts_catalog_chk
    check (jsonb_typeof(catalog_json) = 'object'),
  constraint landing_page_input_catalog_drafts_content_fingerprint_chk
    check (content_fingerprint ~ '^[0-9a-f]{64}$'),
  constraint landing_page_input_catalog_drafts_revision_chk
    check (revision > 0),
  constraint landing_page_input_catalog_drafts_validation_pair_chk
    check (
      (
        (validation_fingerprint is null and validated_at is null)
        or (
          validation_fingerprint ~ '^[0-9a-f]{64}$'
          and validation_context_fingerprint ~ '^[0-9a-f]{64}$'
          and validated_at is not null
        )
      )
      and ((validation_fingerprint is null) = (validation_context_fingerprint is null))
    ),
  constraint landing_page_input_catalog_drafts_publication_pair_chk
    check (
      (
        (publication_fingerprint is null and publication_prepared_at is null)
        or (
          publication_fingerprint ~ '^[0-9a-f]{64}$'
          and publication_context_fingerprint ~ '^[0-9a-f]{64}$'
          and publication_prepared_at is not null
          and validation_fingerprint = publication_fingerprint
          and validation_context_fingerprint = publication_context_fingerprint
        )
      )
      and ((publication_fingerprint is null) = (publication_context_fingerprint is null))
    ),
  constraint landing_page_input_catalog_drafts_taxon_review_evidence_chk
    check (jsonb_typeof(taxon_review_evidence) = 'object')
);

alter table public.landing_page_input_catalog_drafts enable row level security;

revoke all on table public.landing_page_input_catalog_drafts
  from public, anon, authenticated;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on table public.landing_page_input_catalog_drafts from ai_readonly';
  end if;
end;
$$;

grant select, insert, update, delete
  on table public.landing_page_input_catalog_drafts
  to service_role;

create trigger landing_page_input_catalog_drafts_set_updated_at
before update on public.landing_page_input_catalog_drafts
for each row execute function public.tg_set_updated_at();

comment on table public.landing_page_input_catalog_drafts is
  'E20.2.8: singleton draft administrativo, mutavel e nao operacional. Nunca e autoridade de versoes publicadas nem da versao atual repo-only.';
comment on column public.landing_page_input_catalog_drafts.catalog_json is
  'Snapshot candidato da unica proxima versao. Nao replica nem migra as versoes publicadas v1-v5.';
comment on column public.landing_page_input_catalog_drafts.publication_fingerprint is
  'Identidade congelada para o handoff repo-only; nao significa publicacao nem ativacao operacional.';
comment on column public.landing_page_input_catalog_drafts.publication_context_fingerprint is
  'Identidade da colecao operacional completa revalidada no handoff; drift torna a preparacao stale.';
comment on column public.landing_page_input_catalog_drafts.taxon_review_evidence is
  'Decisoes humanas pre-publicacao vinculadas ao fingerprint exato do draft; nao atualizam reviewed_input_catalog_version.';

create or replace function public.save_account_landing_page_configuration_v1(
  p_account_id uuid,
  p_landing_page_id uuid,
  p_shared_values jsonb,
  p_landing_page_values jsonb,
  p_expected_shared_revision bigint,
  p_expected_landing_page_revision bigint,
  p_catalog_version integer,
  p_actor_user_id uuid,
  p_expected_latest_materialization_id uuid
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
  v_latest_materialization_id uuid;
begin
  if p_catalog_version is null or p_catalog_version <= 0 then
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
  select materialization.id
  into v_latest_materialization_id
  from public.account_landing_page_materializations materialization
  where materialization.account_id = p_account_id
    and materialization.landing_page_id = p_landing_page_id
  order by materialization.revision_number desc
  limit 1;
  if v_latest_materialization_id is distinct from p_expected_latest_materialization_id then
    raise exception using errcode = '40001', message = 'materialization_baseline_conflict';
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

comment on function public.save_account_landing_page_configuration_v1(
  uuid, uuid, jsonb, jsonb, bigint, bigint, integer, uuid, uuid
) is
  'E19.5/E20.2.8: persiste a versao efetiva C positiva, fornecida e validada pelo boundary repo-only antes da chamada; o banco nao deriva current/latest.';

commit;
