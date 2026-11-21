// node supabase/tests/d10d_occurrence_lifecycle.proof.mjs <directory containing pg> <disposable PostgreSQL 17 port>
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout as pause } from "node:timers/promises";
import { pathToFileURL } from "node:url";

const port = Number(process.argv[3]);
assert.ok(process.argv[2] && Number.isInteger(port) && port > 1024 && port < 65536);
const { default: pg } = await import(pathToFileURL(resolve(process.argv[2], "pg/lib/index.js")).href);
const connection = { host: "127.0.0.1", port, user: "postgres", database: "postgres", statement_timeout: 12_000 };
const observer = new pg.Client(connection);
const admission = new pg.Client(connection);
const closer = new pg.Client(connection);
const id = n => "d3000000-0000-4000-8000-" + String(n).padStart(12, "0");
const time = "2026-11-21T12:00:00Z";
const account = id(1);
const workload = "niche_resolution";
const otherWorkload = "commercial_activation_draft_generation";

async function apply(name) {
  await observer.query(readFileSync(new URL("../migrations/" + name, import.meta.url), "utf8"));
}

async function start(execution, occurrence, selectedWorkload = workload) {
  return admission.query(`
    select public.start_openai_cost_execution_v3($1,$2,'preview','runtime','client','attributed',
      $3,null,null,null,null,null,null,$4,$5)
  `, [id(execution), selectedWorkload, account, time, id(occurrence)]);
}

async function admit(operation, execution, { sequence = 1, retry = null, selectedWorkload = workload } = {}) {
  const { rows } = await admission.query(`
    select public.admit_openai_cost_operation_v2($1,$2,$3,$4,'gpt-5.4-mini','none','repo_catalog',
      'v2',null,null,null,$5,'preview',$6) as admitted
  `, [id(operation), id(execution), sequence, retry === null ? null : id(retry), time, selectedWorkload]);
  return rows[0].admitted;
}

async function close(occurrence, scope = {}, connection = closer) {
  const { environment = "preview", origin = "runtime", universe = "client", accountId = account } = scope;
  const { rows } = await connection.query(`
    select public.close_openai_cost_occurrence_v1($1,$2,$3,$4,$5)::text as closed_at
  `, [id(occurrence), environment, origin, universe, accountId]);
  return rows[0].closed_at;
}

async function assertBlockedBy(waiter, holder) {
  for (let i = 0; i < 100; i++) {
    const { rows } = await observer.query(
      "select $2::integer = any(pg_blocking_pids($1)) as blocked", [waiter.processID, holder.processID],
    );
    if (rows[0].blocked) return;
    await pause(20);
  }
  assert.fail("Expected PostgreSQL to report the other transaction as a blocker");
}

const closed = { code: "55000", message: "openai_cost_occurrence_closed" };

try {
  await Promise.all([observer.connect(), admission.connect(), closer.connect()]);
  assert.match((await observer.query("show server_version")).rows[0].server_version, /^17\./);
  await observer.query(`
    create role anon; create role authenticated; create role ai_readonly; create role service_role bypassrls;
    create table public.accounts (id uuid primary key, name text not null);
    create table public.account_landing_pages (id uuid, account_id uuid, name text, primary key(id, account_id));
    create table public.business_taxons (id uuid primary key, name text not null);
    grant select on public.accounts, public.account_landing_pages, public.business_taxons to service_role;
  `);
  await observer.query("insert into public.accounts values ($1, 'A'), ($2, 'B')", [account, id(2)]);
  for (const name of [
    "20260911150000_e21_5_3_openai_active_cost_tracking.sql",
    "20260911190000_e21_5_4_openai_cost_calculation_read_model.sql",
    "20260912190000_e21_5_lossless_active_cost_read_model.sql",
    "20260912215000_e21_5_6_openai_cost_event_correlation.sql",
    "20261121162900_d10d_occurrence_admission.sql",
  ]) await apply(name);
  await admission.query("set role service_role");
  await closer.query("set role service_role");
  await admission.query(`
    select public.start_openai_cost_execution_v1($1,'niche_resolution','preview','runtime','client','attributed',
      $2,null,null,$3)
  `, [id(9), account, time]);
  await admission.query("select public.finish_openai_cost_execution_v1($1,'success',null,$2)", [id(9), time]);
  await start(10, 20);
  await start(11, 20, otherWorkload);
  assert.equal(await admit(29, 11, { selectedWorkload: otherWorkload }), true);
  const executionsBefore = (await observer.query("select * from public.openai_cost_executions order by id")).rows;
  const operationsBefore = (await observer.query("select * from public.openai_cost_operations order by id")).rows;

  await apply("20261121185700_d10d_occurrence_lifecycle.sql");
  assert.deepEqual((await observer.query("select * from public.openai_cost_executions order by id")).rows, executionsBefore);
  assert.deepEqual((await observer.query("select * from public.openai_cost_operations order by id")).rows, operationsBefore);
  assert.equal((await observer.query("select count(*)::int as count from public.openai_cost_occurrence_lifecycle")).rows[0].count, 0);
  for (const role of ["anon", "authenticated", "ai_readonly"]) {
    await observer.query("set role " + role);
    await assert.rejects(() => close(20, {}, observer), { code: "42501" });
    await assert.rejects(() => observer.query("select * from public.openai_cost_occurrence_lifecycle"), { code: "42501" });
    await observer.query("reset role");
  }
  for (const scope of [{ accountId: id(2) }, { environment: "production" }, { origin: "admin_candidate_proof" },
    { universe: "lp_factory", accountId: null }]) {
    await assert.rejects(() => close(20, scope), { code: "23503" });
  }
  await assert.rejects(() => close(999), { code: "23503" });

  // Admission commits first, including creation of the lock row for an existing occurrence.
  await admission.query("begin");
  assert.equal(await admit(30, 10), true);
  await admission.query("select public.finish_openai_cost_execution_v1($1,'success',null,$2)", [id(10), time]);
  const executionBeforeClose = (await admission.query("select * from public.openai_cost_executions where id = $1", [id(10)])).rows[0];
  const waitingClose = close(20);
  void waitingClose.catch(() => undefined);
  await assertBlockedBy(closer, admission);
  await admission.query("commit");
  const closedAt = await waitingClose;
  assert.ok(closedAt);
  assert.deepEqual((await observer.query("select * from public.openai_cost_executions where id = $1", [id(10)])).rows[0], executionBeforeClose);
  assert.deepEqual((await observer.query("select * from public.openai_cost_operations where id = $1", [id(29)])).rows, operationsBefore);
  assert.equal(await close(20), closedAt);
  assert.equal(await admit(30, 10), false);
  await assert.rejects(() => admit(30, 10, { sequence: 2 }), { code: "23505" });
  await assert.rejects(() => admit(31, 10, { sequence: 2, retry: 30 }), closed);
  await assert.rejects(() => admit(31, 11, { sequence: 2, selectedWorkload: otherWorkload }), closed);
  const legacyAdmission = `
    select public.start_openai_cost_operation_v1($1,$2,1,null,'gpt-5.4-mini','none',
      'repo_catalog','v2',null,null,null,$3)
  `;
  await assert.rejects(() => admission.query(legacyAdmission, [id(31), id(11), time]), closed);
  await admission.query(legacyAdmission, [id(32), id(9), time]);
  await assert.rejects(() => closer.query("update public.openai_cost_occurrence_lifecycle set closed_at = null"), { code: "55000" });
  await assert.rejects(() => closer.query("delete from public.openai_cost_occurrence_lifecycle"), { code: "42501" });

  const pending = await observer.query("select finished_at from public.openai_cost_operations where id = $1", [id(30)]);
  assert.equal(pending.rows[0].finished_at, null);
  const terminal = `
    select public.finish_openai_cost_operation_v2($1,'success',null,200,null,null,null,null,
      10,0,0,3,0,13,0,null,null,'test-price',$2,'{}'::jsonb,'calculated',null,0.0001,$3) as operation
  `;
  const terminalArgs = [id(30), time, new Date().toISOString()];
  assert.equal((await admission.query(terminal, terminalArgs)).rows[0].operation, id(30));
  assert.equal((await admission.query(terminal, terminalArgs)).rows[0].operation, id(30));
  assert.equal(await close(20), closedAt);

  // Closure commits first. The concurrently attempted operation never obtains a receipt.
  await start(12, 21);
  await closer.query("begin");
  assert.ok(await close(21));
  const waitingAdmission = assert.rejects(() => admit(33, 12), closed);
  void waitingAdmission.catch(() => undefined);
  await assertBlockedBy(admission, closer);
  await closer.query("commit");
  await waitingAdmission;
  assert.equal((await observer.query("select id from public.openai_cost_operations where id = $1", [id(33)])).rowCount, 0);

  // An older repeatable-read snapshot cannot authorize a new operation after a close commits.
  await start(13, 22);
  assert.equal(await admit(34, 13), true);
  await admission.query("begin isolation level repeatable read");
  assert.equal((await admission.query("select closed_at from public.openai_cost_occurrence_lifecycle where occurrence_id = $1", [id(22)])).rows[0].closed_at, null);
  assert.ok(await close(22));
  await assert.rejects(() => admit(35, 13, { sequence: 2 }), { code: "40001" });
  await admission.query("rollback");
  assert.equal((await observer.query("select id from public.openai_cost_operations where id = $1", [id(35)])).rowCount, 0);
  console.log("D10D occurrence lifecycle: both lock orders, stale snapshot, replay, scope, ACL and late terminal passed");
} finally {
  await Promise.allSettled([admission.end(), closer.end(), observer.end()]);
}
