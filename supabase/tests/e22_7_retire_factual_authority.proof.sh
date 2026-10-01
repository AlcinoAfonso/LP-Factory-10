#!/usr/bin/env bash
# Focal case for the existing isolated SQL facilitator; never targets hosted Postgres.
set -euo pipefail
db_container="$1"
log_root="$RUNNER_TEMP/e22-7-sql"
mkdir -p "$log_root"
case "$db_container" in supabase_db_*) ;; *) exit 1 ;; esac
migration=supabase/migrations/20261001030000_e22_7_retire_factual_authority.sql
sql() { docker exec -i "$db_container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 "$@"; }
run_file() {
  local file="$1" name="$2"
  sql < "$file" > "$log_root/$name.log" 2>&1 || { tail -n 70 "$log_root/$name.log"; exit 1; }
}
expect_drift() {
  local name="$1"
  if sql < "$migration" > "$log_root/$name.log" 2>&1; then
    echo "E22.7 unexpectedly accepted $name"; exit 1
  fi
  grep -q 'E22_7_MUTABLE_CONFIGURATION_DRIFT' "$log_root/$name.log"
  test "$(sql -Atc "select count(*) = 2 from public.openai_workload_operational_configurations where workload = 'taxon_input_catalog_sufficiency_evaluation'")" = t
  test "$(sql -Atc "select exists(select 1 from pg_constraint where conrelid='public.taxon_factual_fields'::regclass and conname='taxon_factual_fields_taxon_id_fkey') and has_table_privilege('service_role','public.taxon_factual_fields','SELECT')")" = t
}

test "$(sql -Atc "select count(*) = 4 and count(*) filter(where version in ('20260926145500','20260926171100','20261001030000')) = 0 from supabase_migrations.schema_migrations")" = t
sql -c 'create role ai_readonly nologin;' > "$log_root/role.log"

# Reuse exact canonical DDL; historical data-gated manifests are deliberately excluded.
# These fixture operations are not recorded as applied historical migrations.
sed -n '/^create or replace function public.e20_8_factual_field_definition_is_valid/,/^with manifest/{ /^with manifest/!p; }' \
  supabase/migrations/20260914132000_e20_8_factual_fields_greenfield.sql > "$log_root/factual-ddl.sql"
grep -q '^create table public.taxon_factual_fields' "$log_root/factual-ddl.sql"
run_file "$log_root/factual-ddl.sql" factual-ddl
run_file supabase/migrations/20260915160741_e20_8_factual_definition_fail_closed.sql factual-check-function
sed -n '/^alter table public.openai_workload_configuration_revisions/,/^alter table public.openai_cost_executions/{ /^alter table public.openai_cost_executions/!p; }' \
  supabase/migrations/20260927163500_e21_2_communication_base_workloads.sql > "$log_root/e25-aggregate-ddl.sql"
grep -q 'communication_base_stage2_intelligence' "$log_root/e25-aggregate-ddl.sql"
run_file "$log_root/e25-aggregate-ddl.sql" e25-aggregate-ddl
# The hosted E21.2.5 shape supports the inspected luna/xhigh candidate and Base models.
# Reuse its exact constraint DDL, without catalog seed data or a historical ledger claim.
sed -n '/^alter table public.openai_workload_configuration_revisions/,/^create or replace function public.add_openai_model_catalog_model_v1/{ /^create or replace function/!p; }' \
  supabase/migrations/20260823144334_e21_2_5_openai_model_catalog.sql > "$log_root/e21-current-shape-ddl.sql"
grep -q 'openai_workload_operational_configurations_candidate_completeness_chk' "$log_root/e21-current-shape-ddl.sql"
run_file "$log_root/e21-current-shape-ddl.sql" e21-current-shape-ddl
run_file supabase/tests/e22_7_retire_factual_authority.fixture.sql fixture

# Optimistic version drift must abort before any ACL/FK/configuration retirement.
sql -c "update public.openai_workload_operational_configurations set configuration_version=11 where workload='taxon_input_catalog_sufficiency_evaluation' and environment='preview';" > "$log_root/version-drift-setup.log"
expect_drift version-drift
sql -c "update public.openai_workload_operational_configurations set configuration_version=10 where workload='taxon_input_catalog_sufficiency_evaluation' and environment='preview';" > "$log_root/version-drift-reset.log"

# A validated revision pending activation remains a hard stop.
sql -c "update public.openai_workload_operational_configurations c set pending_revision_id=r.id, candidate_model=null, candidate_reasoning_effort=null, candidate_quality=null, candidate_saved_by=null, candidate_saved_at=null from public.openai_workload_configuration_revisions r where c.workload='taxon_input_catalog_sufficiency_evaluation' and c.environment='preview' and r.workload=c.workload and r.environment=c.environment and r.revision_number=1;" > "$log_root/pending-setup.log"
expect_drift pending-revision
sql -c "update public.openai_workload_operational_configurations set pending_revision_id=null, candidate_model='gpt-5.6-luna', candidate_reasoning_effort='xhigh', candidate_saved_by='ce899cd2-5360-478e-817e-ee3690aabecd', candidate_saved_at='2026-09-16T00:16:37.179443+00:00' where workload='taxon_input_catalog_sufficiency_evaluation' and environment='preview';" > "$log_root/pending-reset.log"

# A second session holds the mutable row while the complete migration waits.
sql > "$log_root/concurrent-writer.log" 2>&1 <<'SQL' &
begin;
update public.openai_workload_operational_configurations set configuration_version=11
  where workload='taxon_input_catalog_sufficiency_evaluation' and environment='preview';
select pg_advisory_xact_lock(227007);
select pg_sleep(4);
commit;
SQL
writer_pid=$!
locked=false
for attempt in {1..20}; do
  if [ "$(sql -Atc "select exists(select 1 from pg_locks where locktype='advisory' and objid=227007 and granted)")" = t ]; then locked=true; break; fi
  sleep 0.1
done
test "$locked" = true
expect_drift concurrent-writer
wait "$writer_pid"
sql -c "update public.openai_workload_operational_configurations set configuration_version=10 where workload='taxon_input_catalog_sufficiency_evaluation' and environment='preview';" > "$log_root/concurrent-reset.log"

# Apply the entire new migration, unchanged, with a saved candidate and no pending revision.
run_file "$migration" complete-migration
grep -qx COMMIT "$log_root/complete-migration.log"
run_file supabase/tests/e22_7_retire_factual_authority.test.sql positive-negative-cases
grep -qx ROLLBACK "$log_root/positive-negative-cases.log"
echo 'E22.7 complete migration accepted: version drift, pending revision and concurrent writer aborted; terminal positive/negative cases passed and rolled back.' >> "$GITHUB_STEP_SUMMARY"
