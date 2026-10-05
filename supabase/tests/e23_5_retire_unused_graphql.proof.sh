#!/usr/bin/env bash
# Existing isolated SQL facilitator only; no hosted connection or credential.
set -euo pipefail
db_container="$1"
case "$db_container" in supabase_db_*) ;; *) exit 1 ;; esac
log_root="$RUNNER_TEMP/e23-5-sql"
mkdir -p "$log_root"
migration=supabase/migrations/20261005170954_e23_5_retire_unused_graphql.sql
sql() { docker exec -i "$db_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 "$@"; }
run_file() {
  sql < "$1" > "$log_root/$2.log" 2>&1 || { tail -n 60 "$log_root/$2.log"; exit 1; }
}
test "$(sql -Atc "select count(*)=2 and count(*) filter(where version in('20260926145500','20260926171100','20261005170954'))=0 from supabase_migrations.schema_migrations")" = t
run_file supabase/tests/e23_5_retire_unused_graphql.fixture.sql fixture
sql -At < supabase/tests/e23_5_retire_unused_graphql.snapshot.sql > "$log_root/before"

# An external dependency must abort the unchanged migration atomically.
sql -c "create view public.e23_5_hidden_consumer as select graphql.resolve('{ __typename }') as result;" > "$log_root/dependency-setup.log"
if sql < "$migration" > "$log_root/dependency-blocked.log" 2>&1; then
  echo 'E23.5 unexpectedly removed a real dependency'; exit 1
fi
grep -q 'because other objects depend on it' "$log_root/dependency-blocked.log"
test "$(sql -Atc "select exists(select 1 from pg_extension where extname='pg_graphql') and to_regclass('public.e23_5_hidden_consumer') is not null and has_schema_privilege('anon','graphql_public','USAGE')")" = t
sql -c 'drop view public.e23_5_hidden_consumer;' > "$log_root/dependency-reset.log"
sql -At < supabase/tests/e23_5_retire_unused_graphql.snapshot.sql > "$log_root/after-negative"
cmp "$log_root/before" "$log_root/after-negative"

run_file "$migration" complete-migration
grep -qx COMMIT "$log_root/complete-migration.log"
sql -At < supabase/tests/e23_5_retire_unused_graphql.snapshot.sql > "$log_root/after"
cmp "$log_root/before" "$log_root/after"
run_file supabase/tests/e23_5_retire_unused_graphql.test.sql positive-negative-cases
grep -qx ROLLBACK "$log_root/positive-negative-cases.log"
run_file "$migration" idempotent-resume
sql -At < supabase/tests/e23_5_retire_unused_graphql.snapshot.sql > "$log_root/after-resume"
cmp "$log_root/before" "$log_root/after-resume"
test "$(sql -Atc "select count(*)=2 and count(*) filter(where version in('20260926145500','20260926171100'))=0 from supabase_migrations.schema_migrations")" = t
echo 'E23.5: PostgreSQL 17 / pg_graphql 1.5.11 initial state reproduced; external dependency blocked; complete unchanged migration and idempotent resume accepted; anon/authenticated GraphQL denied, REST/RLS/Auth preserved; non-GraphQL metadata identical; cases rolled back; no E10.10.' >> "$GITHUB_STEP_SUMMARY"
