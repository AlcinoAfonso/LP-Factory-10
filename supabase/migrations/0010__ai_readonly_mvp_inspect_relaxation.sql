-- 0010__ai_readonly_mvp_inspect_relaxation.sql
-- Supabase Inspect MVP — afrouxamento temporário do role ai_readonly
-- Idempotente.
-- Objetivo: acelerar inspeções read-only no MVP sem usar service_role e sem conceder escrita direta.
-- Revisar antes de liberar acesso do workflow para equipe/funcionários.

begin;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'ai_readonly') then
    execute 'create role ai_readonly login';
  end if;

  execute 'alter role ai_readonly login';
  execute 'alter role ai_readonly nocreatedb nocreaterole noreplication';
  execute 'alter role ai_readonly set statement_timeout = ''5s''';
  execute 'alter role ai_readonly bypassrls';
end
$$;

grant usage on schema public to ai_readonly;
grant select on all tables in schema public to ai_readonly;
grant execute on all functions in schema public to ai_readonly;
grant usage on schema extensions to ai_readonly;
grant execute on all functions in schema extensions to ai_readonly;

alter default privileges in schema public
grant select on tables to ai_readonly;

alter default privileges in schema public
grant execute on functions to ai_readonly;

alter default privileges in schema extensions
grant execute on functions to ai_readonly;

comment on role ai_readonly is
  'MVP read-only inspection role for Supabase Inspect. Temporarily uses BYPASSRLS and EXECUTE on public/extensions functions; no service_role/no write grants. Review before team access.';

commit;
