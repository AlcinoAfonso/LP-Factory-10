// Run against a disposable PostgreSQL 17 instance in memory.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

assert.ok(process.argv[2], "Pass the installed @electric-sql/pglite directory.");
const { PGlite } = await import(pathToFileURL(resolve(process.argv[2], "dist/index.js")).href);
const db = new PGlite();
const id = n => "c3000000-0000-4000-8000-" + String(n).padStart(12, "0");
const account = id(1);
const stages = ["2026-11-20T23:58:00Z", "2026-11-21T00:02:00Z"];
const readSignature = "(timestamptz,timestamptz,timestamptz,uuid,integer,integer)";
const startSignature = "(uuid,text,text,text,text,text,uuid,text,uuid,uuid,uuid,text,text,timestamptz)";
const readMigration = path => readFileSync(new URL("../migrations/" + path, import.meta.url), "utf8");
const start = (version, executionId, eventId, timestamp, workload = "communication_base_stage2_intelligence", origin = "runtime",
  kind = "category_3_generation") => db.query(
  "select public.start_openai_cost_execution_" + version +
  "($1,$2,'preview',$3,'client','attributed',$4,$5,$6,null,null,null,null,$7)",
  [executionId, workload, origin, account, kind, eventId, timestamp],
);
try {
  assert.match((await db.query("show server_version")).rows[0].server_version, /^17\./);
  await db.exec(`
    create role anon; create role authenticated; create role ai_readonly; create role service_role bypassrls;
    create table public.accounts (id uuid primary key, name text not null);
    create table public.account_landing_pages (id uuid, account_id uuid, name text, primary key(id, account_id));
    create table public.business_taxons (id uuid primary key, name text not null);
    grant select on public.accounts, public.account_landing_pages, public.business_taxons to service_role;
    insert into public.accounts values ('${account}', 'Conta de teste');
  `);
  for (const path of [
    "20260911150000_e21_5_3_openai_active_cost_tracking.sql",
    "20260911190000_e21_5_4_openai_cost_calculation_read_model.sql",
    "20260912190000_e21_5_lossless_active_cost_read_model.sql",
    "20260912215000_e21_5_6_openai_cost_event_correlation.sql",
  ]) await db.exec(readMigration(path));
  // Reproduce the workload allowlist delta already applied in E25.1.
  const workloadsMigration = readMigration("20260927163500_e21_2_communication_base_workloads.sql");
  await db.exec(workloadsMigration.slice(workloadsMigration.indexOf("alter table public.openai_cost_executions"),
    workloadsMigration.indexOf("alter table public.openai_cost_coverage")));
  await start("v2", id(10), id(20), stages[0], "niche_resolution", "runtime", "niche_resolution");
  await assert.rejects(() => start("v2", id(11), id(21), stages[0]), { code: "23514" });
  const before = (await db.query("select * from public.openai_cost_executions")).rows;
  await db.exec(readMigration("20261120174450_d10_category_3_generation.sql"));
  assert.deepEqual((await db.query("select * from public.openai_cost_executions")).rows, before);

  for (const role of ["anon", "authenticated", "ai_readonly", "service_role"]) {
    for (const procedure of ["read_openai_active_cost_rows_v2" + readSignature, "read_openai_active_cost_rows_v3" + readSignature,
      "start_openai_cost_execution_v3" + startSignature]) {
      assert.equal((await db.query("select has_function_privilege($1,$2,'EXECUTE') as allowed", [role, "public." + procedure])).rows[0].allowed,
        role === "service_role");
    }
  }
  await db.exec("set role service_role");
  await start("v3", id(11), id(21), stages[0]);
  await start("v3", id(11), id(21), stages[0]);
  await start("v3", id(12), id(21), stages[1]);
  await start("v3", id(13), id(22), stages[1]);
  await assert.rejects(() => start("v3", id(11), id(22), stages[0]), { code: "23505" });
  await assert.rejects(() => start("v3", id(14), id(14), stages[0]), { code: "23514" });
  await assert.rejects(() => start("v3", id(15), id(21), stages[0], "niche_resolution"), { code: "23514" });
  await assert.rejects(() => start("v3", id(15), id(21), stages[0], undefined, "administrative_proof"), { code: "23514" });
  await db.query(`insert into public.openai_cost_operations
    (id,execution_id,sequence,model,reasoning_effort,configuration_source,configuration_revision,
     started_at,finished_at,result,cost_status,cost_unavailable_reason,cost_usd,pricing_version,pricing_effective_at,pricing_snapshot)
    values ($1,$2,1,'gpt-6.2-sol','medium','supabase_operational','fixture',$3,$3,'success','calculated',null,0.123456789123,'fixture',$3,'{}')`,
  [id(50), id(12), stages[1]]);
  const from = "2026-11-20T00:00:00Z", to = "2026-11-22T00:00:00Z";
  const read = async version => (await db.query("select * from public.read_openai_active_cost_rows_" + version + "($1,$2)", [from, to])).rows;
  const old = await read("v2");
  const current = await read("v3");
  assert.deepEqual(current.map(row => row.economic_event_id), [id(20), id(21), id(21), id(22)]);
  assert.deepEqual(old, current.map(row => row.economic_event_kind === "category_3_generation"
    ? { ...row, economic_event_kind: null, economic_event_id: null } : row));
  assert.equal(current[2].cost_usd, "0.123456789123");
  const next = await db.query("select * from public.read_openai_active_cost_rows_v2($1,$2,$3,$4,$5,1)",
    [from, to, current[1].cursor_started_at, id(11), 0]);
  assert.equal(next.rows[0].execution_id, id(12));
  assert.equal((await db.query("select count(*)::int n from public.openai_cost_executions where economic_event_id = $1 and account_id = $2", [id(21), account])).rows[0].n, 2);
  console.log("PASS PostgreSQL 17 Category 3 full migration, type constraints, replay, historical rows, period paging, decimal values and v2/v3 ACL");
} finally {
  await db.close();
}
