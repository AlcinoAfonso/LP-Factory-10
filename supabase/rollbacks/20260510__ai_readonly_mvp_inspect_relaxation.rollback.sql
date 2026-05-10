-- 20260510__ai_readonly_mvp_inspect_relaxation.rollback.sql
-- Rollback do afrouxamento temporário do ai_readonly para Supabase Inspect MVP.
-- Mantém os grants básicos originais de leitura definidos em 0005__ai_readonly.sql.

begin;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'ai_readonly') then
    execute 'alter role ai_readonly nobypassrls';
  end if;
end
$$;

revoke execute on all functions in schema public from ai_readonly;

alter default privileges in schema public
revoke execute on functions from ai_readonly;

comment on role ai_readonly is
  'Read-only automation role. Password must be set per environment (not stored in migrations).';

commit;
