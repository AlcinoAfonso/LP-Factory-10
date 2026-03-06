-- 0005__ai_readonly.sql
-- Role read-only `ai_readonly` (public + statement_timeout=5s)
-- Idempotente. Não define senha (senha deve ser aplicada por ambiente, fora do Git).

begin;

-- 1) Criar/garantir role ai_readonly (LOGIN) + hardening básico + timeout
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'ai_readonly') then
    execute 'create role ai_readonly login';
  end if;

  -- garantir propriedades mesmo se o role já existir
  execute 'alter role ai_readonly login';
  execute 'alter role ai_readonly nocreatedb nocreaterole noreplication';
  execute 'alter role ai_readonly set statement_timeout = ''5s''';
end
$$;

comment on role ai_readonly is
  'Read-only automation role. Password must be set per environment (not stored in migrations).';

-- 2) Grants read-only no schema public
grant usage on schema public to ai_readonly;
grant select on all tables in schema public to ai_readonly;

-- 3) Default privileges (para novos objetos criados pelo role que executa migrations)
alter default privileges in schema public
grant select on tables to ai_readonly;

commit;
