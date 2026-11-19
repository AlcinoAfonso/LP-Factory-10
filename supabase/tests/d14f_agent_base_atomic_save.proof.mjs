// Isolated PostgreSQL proof. Invoke with the installed pg module directory and test DB port.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const port = Number(process.argv[3]);
assert.ok(process.argv[2] && Number.isInteger(port) && port > 1024);
const { default: pg } = await import(pathToFileURL(resolve(process.argv[2], "pg/lib/index.js")).href);
const admin = new pg.Client({ host: "127.0.0.1", port, user: "postgres", database: "postgres" });
const dbName = "d14f_atomic_" + Date.now();
let db, other;
const id = n => "10000000-0000-4000-8000-" + String(n).padStart(12, "0");
const account = id(1), taxonId = id(2);
const catalog = {
  business: [{ key: "business_name", label: "Nome", format: "text" }],
  targets: [{ key: "about", label: "Quem somos", format: "text" },
    { key: "audience", label: "Público", format: "text" }],
};
const official = { name: "Corretagem imobiliária", textRevision: 1, taxonId: null, legacyUpdatedAt: null };
const generated = {
  about: { format: "text", origin: "agent_generated", value: "Atuação confirmada" },
  audience: { format: "text", origin: "agent_generated", value: "Público e decisões" },
};
const callSql = "select * from public.commit_generated_communication_intelligence_v1($1,$2,$3::jsonb,$4::jsonb,$5::jsonb)";
const args = (version, targetCatalog = catalog, niche = official, sections = generated) =>
  [account, version, targetCatalog, niche, sections];
const errorCode = code => error => error?.code === code;

await admin.connect();
try {
  for (const role of ["anon", "authenticated", "service_role", "ai_readonly"]) {
    const exists = await admin.query("select 1 from pg_roles where rolname=$1", [role]);
    if (!exists.rowCount) await admin.query("create role " + role);
  }
  await admin.query("create database " + dbName);
  const connection = { host: "127.0.0.1", port, user: "postgres", database: dbName };
  db = new pg.Client(connection);
  await db.connect();
  await db.query([
    "create table public.accounts(id uuid primary key,status text not null);",
    "create table public.account_official_niches(account_id uuid primary key,description text,revision bigint);",
    "create table public.account_taxonomy(account_id uuid,taxon_id uuid,is_primary boolean,status text,updated_at timestamptz);",
    "create table public.business_taxons(id uuid primary key,name text,is_active boolean);",
    "create table public.communication_base_sections(section_key text primary key,category text,format text,label text,sort_order integer);",
    "create table public.account_communication_bases(account_id uuid primary key,sections_json jsonb,version integer,created_at timestamptz default now(),updated_at timestamptz default now());",
    "grant usage on schema public to service_role;",
    "grant select,update on all tables in schema public to service_role;",
  ].join("\n"));
  const migration = readFileSync(new URL("../migrations/20261119111600_d14f_agent_base_atomic_save.sql", import.meta.url), "utf8");
  await db.query(migration);
  assert.equal((await db.query("select has_function_privilege('service_role','public.commit_generated_communication_intelligence_v1(uuid,integer,jsonb,jsonb,jsonb)','EXECUTE') as allowed")).rows[0].allowed, true);
  assert.equal((await db.query("select has_function_privilege('authenticated','public.commit_generated_communication_intelligence_v1(uuid,integer,jsonb,jsonb,jsonb)','EXECUTE') as allowed")).rows[0].allowed, false);
  assert.equal((await db.query("select has_function_privilege('ai_readonly','public.commit_generated_communication_intelligence_v1(uuid,integer,jsonb,jsonb,jsonb)','EXECUTE') as allowed")).rows[0].allowed, false);

  await db.query("insert into accounts values($1,'active')", [account]);
  await db.query("insert into account_official_niches values($1,$2,1)", [account, official.name]);
  await db.query("insert into communication_base_sections values('business_name','business','text','Nome',1),('about','intelligence','text','Quem somos',1),('audience','intelligence','text','Público',2)");
  const original = {
    business_name: { format: "text", value: "Empresa", origin: "user_confirmed" },
    media_library: { format: "material_items", value: [], origin: "user_confirmed" },
    audience: { format: "text", value: "Texto manual anterior", origin: "user_reviewed" },
    future_category: { value: "Preservar" },
  };
  await db.query("insert into account_communication_bases(account_id,sections_json,version) values($1,$2,1)", [account, original]);

  await db.query("set role service_role");
  const saved = await db.query(callSql, args(1));
  assert.equal(saved.rowCount, 1);
  assert.equal(saved.rows[0].version, 2);
  assert.deepEqual(saved.rows[0].sections_json.business_name, original.business_name);
  assert.deepEqual(saved.rows[0].sections_json.media_library, original.media_library);
  assert.deepEqual(saved.rows[0].sections_json.future_category, original.future_category);
  assert.equal(saved.rows[0].sections_json.audience.origin, "agent_generated");
  await assert.rejects(db.query(callSql, args(1)), errorCode("40001"), "stale Base version");
  await assert.rejects(db.query(callSql, args(2, catalog, official, { about: generated.about })),
    errorCode("22023"), "partial replacement");

  await db.query("reset role");
  await db.query("update communication_base_sections set label='Novo público' where section_key='audience'");
  await db.query("set role service_role");
  await assert.rejects(db.query(callSql, args(2)), errorCode("40001"), "catalog change");
  await db.query("reset role");
  await db.query("update communication_base_sections set label='Público' where section_key='audience'");
  await db.query("update account_official_niches set revision=2 where account_id=$1", [account]);
  await db.query("set role service_role");
  await assert.rejects(db.query(callSql, args(2)), errorCode("40001"), "niche change");
  await db.query("reset role");
  await db.query("update account_official_niches set revision=1 where account_id=$1", [account]);

  const legacyStamp = "2026-11-19T11:00:00Z";
  await db.query("delete from account_official_niches where account_id=$1", [account]);
  await db.query("insert into business_taxons values($1,'Jardinagem',true)", [taxonId]);
  await db.query("insert into account_taxonomy values($1,$2,true,'active',$3)", [account, taxonId, legacyStamp]);
  const legacy = { name: "Jardinagem", textRevision: 0, taxonId, legacyUpdatedAt: legacyStamp };
  await db.query("set role service_role");
  const legacySaved = await db.query(callSql, args(2, catalog, legacy));
  assert.equal(legacySaved.rows[0].version, 3, "legacy niche remains supported");
  await db.query("reset role");
  await db.query("update account_taxonomy set updated_at=updated_at+interval '1 second'");
  await db.query("set role service_role");
  await assert.rejects(db.query(callSql, args(3, catalog, legacy)), errorCode("40001"), "stale legacy niche");
  await db.query("reset role");

  const before = await db.query("select sections_json,version from account_communication_bases where account_id=$1", [account]);
  assert.equal(before.rows[0].version, 3, "all rejected writes left the Base unchanged");

  // Prove that the RPC cannot overtake the official-niche account lock.
  other = new pg.Client(connection);
  await other.connect();
  await other.query("set lock_timeout='150ms'");
  await db.query("begin");
  await db.query("select id from accounts where id=$1 for update", [account]);
  await assert.rejects(other.query(callSql, args(3, catalog, {
    ...legacy, legacyUpdatedAt: "2026-11-19T11:00:01Z",
  })), errorCode("55P03"));
  await db.query("rollback");

  // Catalog administrative edits use this same advisory lock.
  await db.query("begin");
  await db.query("select pg_advisory_xact_lock(253,1)");
  await assert.rejects(other.query(callSql, args(3, catalog, {
    ...legacy, legacyUpdatedAt: "2026-11-19T11:00:01Z",
  })), errorCode("55P03"));
  await db.query("rollback");
  console.log("D14F atomic intelligence RPC: contract, permissions, conflict and locks PASS");
} finally {
  if (other) await other.end().catch(() => {});
  if (db) await db.end().catch(() => {});
  await admin.query("drop database if exists " + dbName + " with (force)").catch(() => {});
  await admin.end();
}
