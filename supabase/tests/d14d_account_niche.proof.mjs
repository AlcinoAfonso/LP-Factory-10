// Isolated local PostgreSQL 17 only. Pass the directory containing the pg package and a local port.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const { default: pg } = await import(pathToFileURL(resolve(process.argv[2], "pg/lib/index.js")).href);
const port = Number(process.argv[3]);
assert.ok(Number.isInteger(port) && port > 1024);
const settings = { host: "127.0.0.1", port, user: "postgres", database: "postgres" };
const admin = new pg.Client(settings);
await admin.connect();
const database = `d14d_niche_proof_${Date.now()}`;
const connections = [];
const connect = async () => { const c = new pg.Client({ ...settings, database }); await c.connect(); connections.push(c); return c; };
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const account = id(1), actor = id(2), segment = id(3), niche = id(4), ultra = id(5), other = id(6), outsider = id(7);
try {
  await admin.query(`create database ${database}`);
  const db = await connect();
  assert.match((await db.query("show server_version")).rows[0].server_version, /^17\./);
  for (const role of ["anon", "authenticated", "service_role"]) {
    if (!(await admin.query("select 1 from pg_roles where rolname=$1", [role])).rowCount) await admin.query(`create role ${role} ${role === "service_role" ? "bypassrls" : ""}`);
  }
  // Focused physical contract from Schema 1.1/1.2/1.9/1.11/1.13; no hosted data.
  await db.query(`
    create table public.accounts(id uuid primary key,status text not null);
    create table public.account_users(account_id uuid references public.accounts(id),user_id uuid,role text,status text,primary key(account_id,user_id));
    create table public.business_taxons(id uuid primary key,parent_id uuid references public.business_taxons(id),level text check(level in ('segment','niche','ultra_niche')),is_active boolean,name text,slug text);
    create table public.account_taxonomy(id uuid primary key default gen_random_uuid(),account_id uuid references public.accounts(id),taxon_id uuid references public.business_taxons(id),is_primary boolean not null default false,status text check(status in ('active','inactive')),source_type text check(source_type in ('manual','taxonomy_match','user_confirmed_ai')),created_at timestamptz default now(),updated_at timestamptz default now(),unique(account_id,taxon_id));
    create unique index account_taxonomy_one_active_primary_idx on public.account_taxonomy(account_id) where is_primary and status='active';
    create table public.account_landing_pages(id uuid primary key default gen_random_uuid(),account_id uuid not null references public.accounts(id) on update cascade on delete cascade,status text not null default 'draft');
    create table public.account_communication_bases(account_id uuid primary key,sections_json jsonb);
    create table public.account_niche_resolutions(account_id uuid primary key,raw_input text);
    grant select,update on public.accounts to service_role;
    grant select on public.account_users,public.business_taxons,public.account_landing_pages to service_role;
    grant update(name,slug,is_active) on public.business_taxons to service_role;
    grant select,insert,update on public.account_taxonomy to service_role;
    alter table public.account_taxonomy enable row level security;
  `);
  await db.query("insert into accounts values($1,'active')", [account]);
  await db.query("insert into account_users values($1,$2,'owner','active')", [account, actor]);
  await db.query("insert into business_taxons values($1,null,'segment',true,'Serviços','servicos'),($2,$1,'niche',true,'Jardinagem','jardinagem'),($3,$2,'ultra_niche',true,'Jardins','jardins'),($4,null,'segment',true,'Outro','outro')", [segment,niche,ultra,other]);
  await db.query("insert into account_communication_bases values($1,$2);", [account, JSON.stringify({ business_context: { value: "Preservar categoria 1\n\nParágrafo" }, testimonials: { value: ["Preservar materiais"] }, audience: { value: "Revisão humana pendente" } })]);
  await db.query("insert into account_niche_resolutions values($1,'Histórico preservado')", [account]);
  const snapshot = async () => JSON.stringify((await db.query("select (select sections_json from account_communication_bases) as base,(select raw_input from account_niche_resolutions) as history")).rows);
  const before = await snapshot();
  const migration = readFileSync(new URL("../migrations/20261106145723_d14d_account_niche_confirmation.sql", import.meta.url), "utf8");
  await db.query(migration);
  const call = (client, target, expected, confirmed=true, user=actor) => client.query("select public.confirm_account_niche_v1($1,$2,$3,$4,$5)", [account,user,target,expected,confirmed]);
  const primary = async () => (await db.query("select * from account_taxonomy where account_id=$1 and is_primary and status='active'", [account])).rows;
  await db.query("set role service_role");
  await assert.rejects(call(db,niche,null,false), e => e.message === "niche_confirmation_required");
  await assert.rejects(call(db,niche,null,true,outsider), e => e.code === "42501");
  await call(db,niche,null);
  assert.equal((await primary())[0].source_type, "manual");
  assert.ok((await primary())[0].user_confirmed_at);
  const once = JSON.stringify(await primary());
  await call(db,niche,niche);
  assert.equal(JSON.stringify(await primary()), once, "confirming twice is idempotent");
  await assert.rejects(call(db,other,null), e => e.message === "niche_changed");
  await call(db,ultra,niche);
  await call(db,segment,ultra);
  await db.query("reset role");
  assert.equal((await db.query("select count(*)::int as n from account_taxonomy where account_id=$1", [account])).rows[0].n, 3, "old links are retained");
  for (const status of ["draft","active","archived"]) {
    await db.query("insert into account_landing_pages(account_id,status) values($1,$2)", [account,status]);
    await db.query("set role service_role");
    await assert.rejects(call(db,other,segment), e => e.message === "niche_product_exists");
    assert.equal((await primary())[0].taxon_id,segment);
    await db.query("reset role; delete from account_landing_pages");
  }
  // Preserve original automatic provenance when adding a human confirmation.
  await db.query("update account_taxonomy set source_type='taxonomy_match',user_confirmed_at=null where taxon_id=$1", [segment]);
  await db.query("set role service_role");
  await call(db,segment,segment);
  assert.equal((await primary())[0].source_type,"taxonomy_match");
  assert.ok((await primary())[0].user_confirmed_at);
  await db.query("reset role; update business_taxons set is_active=false where level='segment'");
  await db.query("set role service_role");
  await assert.rejects(call(db,niche,segment), e => e.message === "niche_taxon_invalid");
  await assert.rejects(call(db,id(99),segment), e => e.message === "niche_taxon_invalid");
  await db.query("reset role; update business_taxons set is_active=true");
  for (const role of ["viewer","editor","admin"]) {
    await db.query("update account_users set role=$1 where user_id=$2", [role,actor]);
    await db.query("set role service_role");
    if (role === "viewer") await assert.rejects(call(db,segment,segment), e => e.code === "42501");
    else await call(db,segment,segment);
    await db.query("reset role");
  }
  await db.query("update accounts set status='pending_setup'");
  await assert.rejects(call(db,segment,segment), e => e.code === "42501");
  await db.query("update accounts set status='active'");
  for (const role of ["anon","authenticated"]) {
    await db.query(`set role ${role}`);
    await assert.rejects(call(db,niche,segment), e => e.code === "42501");
    await db.query("reset role");
  }
  const fn = (await db.query("select prosecdef,proconfig from pg_proc where oid='public.confirm_account_niche_v1(uuid,uuid,uuid,uuid,boolean)'::regprocedure")).rows[0];
  assert.equal(fn.prosecdef,false);
  assert.ok(fn.proconfig.some(item => item.startsWith("search_path=")));
  const first = await connect(), second = await connect();
  // Product committed first: the waiting redefinition must observe it and fail closed.
  await first.query("begin");
  await first.query("insert into account_landing_pages(account_id) values($1)",[account]);
  let done = false;
  const blocked = call(second,other,segment).then(() => { done=true; return null; }, e => { done=true; return e; });
  await new Promise(resolve => setTimeout(resolve,150));
  assert.equal(done,false,"product FK must serialize the concurrent redefinition");
  await first.query("commit");
  assert.equal((await blocked)?.message,"niche_product_exists");
  await db.query("delete from account_landing_pages");
  // Redefinition committed first: FK insertion waits until the new niche is committed.
  await first.query("begin");
  await call(first,other,segment);
  done=false;
  const insertion = second.query("insert into account_landing_pages(account_id) values($1)",[account]).then(() => { done=true; });
  await new Promise(resolve => setTimeout(resolve,150));
  assert.equal(done,false,"account lock must block the concurrent product insertion");
  await first.query("commit"); await insertion;
  assert.equal((await primary())[0].taxon_id,other);
  assert.equal(await snapshot(),before,"all Base categories and resolution history remain byte-equivalent");
  console.log("D14D PostgreSQL17: full migration, definition, 3 official levels, confirmation/provenance, CAS, roles/ACL, hierarchy, all product states, idempotence, both concurrency orders and Base/history preservation passed.");
} finally {
  await Promise.allSettled(connections.map(client => client.end()));
  await admin.query(`drop database if exists ${database} with (force)`);
  await admin.end();
}
