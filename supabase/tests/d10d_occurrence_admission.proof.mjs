// Pass an external @electric-sql/pglite installation. No hosted connection.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

assert.ok(process.argv[2], "Pass the @electric-sql/pglite directory.");
const { PGlite } = await import(pathToFileURL(resolve(process.argv[2], "dist/index.js")).href);
const db = new PGlite();
const id = n => "d1000000-0000-4000-8000-" + String(n).padStart(12, "0");
const time = "2026-11-21T12:00:00Z";
const apply = name => db.exec(readFileSync(new URL("../migrations/" + name, import.meta.url), "utf8"));
const start = async (execution, occurrence, { account = id(1), environment = "preview", workload = "niche_resolution" } = {}) =>
  (await db.query(`
    select public.start_openai_cost_execution_v3($1,$2,$3,'runtime','client','attributed',$4,
      null,null,null,null,null,null,$5,$6) as receipt
  `, [execution, workload, environment, account, time, occurrence])).rows[0].receipt;
const admit = async (operation, execution, { sequence = 1, retryOf = null, environment = "preview", workload = "niche_resolution" } = {}) =>
  (await db.query(`
    select public.admit_openai_cost_operation_v2($1,$2,$3,$4,'gpt-5.4-mini','none','repo_catalog',
      'v2',null,null,null,$5,$6,$7) as admitted
  `, [operation, execution, sequence, retryOf, time, environment, workload])).rows[0].admitted;

try {
  const version = (await db.query("show server_version")).rows[0].server_version;
  assert.match(version, /^17\./);
  await db.exec(`
    create role anon; create role authenticated; create role ai_readonly; create role service_role bypassrls;
    create table public.accounts (id uuid primary key, name text not null);
    create table public.account_landing_pages (id uuid, account_id uuid, name text, primary key(id, account_id));
    create table public.business_taxons (id uuid primary key, name text not null);
    grant select on public.accounts, public.account_landing_pages, public.business_taxons to service_role;
  `);
  await db.query("insert into public.accounts values ($1,'Test A'),($2,'Test B')", [id(1), id(2)]);
  for (const path of [
    "20260911150000_e21_5_3_openai_active_cost_tracking.sql",
    "20260911190000_e21_5_4_openai_cost_calculation_read_model.sql",
    "20260912190000_e21_5_lossless_active_cost_read_model.sql",
    "20260912215000_e21_5_6_openai_cost_event_correlation.sql",
  ]) await apply(path);
  await db.query("select public.start_openai_cost_execution_v2($1,'niche_resolution','preview','runtime','client','attributed',$2,null,null,null,null,null,null,$3)", [id(9), id(1), time]);
  const row = (await db.query("select to_jsonb(e) as snapshot from public.openai_cost_executions e")).rows[0].snapshot;
  await apply("20261121120000_d10d_occurrence_admission.sql");
  const legacy = (await db.query("select to_jsonb(e) as snapshot from public.openai_cost_executions e")).rows[0].snapshot;
  assert.deepEqual(legacy, { ...row, occurrence_id: null });

  for (const role of ["anon", "authenticated", "ai_readonly"]) {
    await db.exec("set role " + role);
    await assert.rejects(() => start(id(10), id(20)), { code: "42501" });
    await assert.rejects(() => admit(id(30), id(10)), { code: "42501" });
    await db.exec("reset role");
  }
  await db.exec("set role service_role");
  assert.equal(await start(id(10), id(20)), id(10));
  assert.equal(await start(id(10), id(20)), id(10));
  assert.equal(await start(id(11), id(20), { workload: "commercial_activation_draft_generation" }), id(11));
  assert.equal(await start(id(12), id(21)), id(12));
  await assert.rejects(() => start(id(13), id(20), { account: id(2) }), { code: "23505" });
  await assert.rejects(() => start(id(13), id(20), { environment: "production" }), { code: "23505" });
  await assert.rejects(() => start(id(10), id(21)), { code: "23505" });
  await assert.rejects(() => admit(id(30), id(9)), { code: "23503" });
  await assert.rejects(() => admit(id(30), id(10), { environment: "production" }), { code: "23503" });
  await assert.rejects(() => admit(id(30), id(11)), { code: "23503" });
  assert.deepEqual(await Promise.all([admit(id(30), id(10)), admit(id(30), id(10))]), [true, false]);
  assert.equal(await admit(id(31), id(10), { sequence: 2, retryOf: id(30) }), true);
  await assert.rejects(() => admit(id(32), id(12), { sequence: 2, retryOf: id(30) }), { code: "23503" });
  await assert.rejects(() => admit(id(30), id(12)), { code: "23505" });
  await db.query("select public.finish_openai_cost_execution_v1($1,'success',null,$2)", [id(10), time]);
  assert.equal((await db.query("select count(*)::int as n from public.openai_cost_operations")).rows[0].n, 2);
  await db.exec("reset role");
  await assert.rejects(() => db.query("update public.openai_cost_executions set occurrence_id=$1,finished_at=$2,result='success' where id=$3", [id(25), time, id(11)]), { code: "55000" });
  console.log("PostgreSQL " + version + " | occurrence scope, legacy rows, ACL, one-use admission, retry and terminal preservation passed");
} finally {
  await db.close();
}
