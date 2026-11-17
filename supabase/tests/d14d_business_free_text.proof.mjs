// node supabase/tests/d14d_business_free_text.proof.mjs <absolute @electric-sql/pglite directory>
// Disposable PostgreSQL only; never connects to the hosted project.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const { PGlite } = await import(pathToFileURL(resolve(process.argv[2], "dist/index.js")).href);
const read = name => readFileSync(new URL(name, import.meta.url), "utf8");
const catalog = read("../migrations/20261010202505_e25_3_communication_resources.sql").split("-- Serializes global reorders;")[0];
const bases = read("../migrations/20260927145500_e25_1_account_communication_bases.sql").split("comment on table")[0];
const migration = read("../migrations/20261104120538_d14d_business_free_text.sql");
const account = "a041aa68-02b3-443b-bd12-9ab96109a3ff";
const other = "00000000-0000-4000-8000-000000000001";
const offers = {format:"items",origin:"user_confirmed",value:["Manutenção periódica de jardins","Poda leve e limpeza de canteiros"]};
for (const scenario of ["authorized", "empty", "already-text", "changed", "other-account", "new-proof", "null-value"]) {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create role ai_readonly; create table public.accounts(id uuid primary key);");
    await db.exec(bases + "commit;");
    await db.exec(catalog + "commit;");
    const sections = {business_name:{format:"text",value:"Preservar",origin:"user_confirmed"},faq:{format:"faq",origin:"user_reviewed",value:[{question:"Pergunta",answer:"Resposta"}]}};
    if (!["empty","already-text"].includes(scenario)) sections.offers = structuredClone(offers);
    if (scenario === "already-text") sections.offers = {format:"text",origin:"user_confirmed",value:"Texto novo\n\n- Lista"};
    if (scenario === "changed") sections.offers.value.push("Novo conteúdo não autorizado");
    if (scenario === "new-proof") sections.proof = {format:"items",origin:"user_confirmed",value:[]};
    if (scenario === "null-value") sections.proof = null;
    const id = scenario === "other-account" ? other : account;
    await db.query("insert into public.accounts values ($1)",[id]);
    await db.query("insert into public.account_communication_bases(account_id,sections_json,version) values ($1,$2,16)",[id,JSON.stringify(sections)]);
    const beforeCatalog = (await db.query("select * from public.communication_base_sections order by section_key")).rows;
    const beforeBase = (await db.query("select * from public.account_communication_bases")).rows;
    if (["changed","other-account","new-proof","null-value"].includes(scenario)) {
      await assert.rejects(db.exec(migration), /authorized QA inventory/);
      await db.exec("rollback");
      assert.deepEqual((await db.query("select * from public.communication_base_sections order by section_key")).rows,beforeCatalog);
      assert.deepEqual((await db.query("select * from public.account_communication_bases")).rows,beforeBase);
    } else {
      await db.exec(migration);
      const afterCatalog = (await db.query("select * from public.communication_base_sections order by section_key")).rows;
      const afterBase = (await db.query("select * from public.account_communication_bases")).rows;
      for (let i=0;i<beforeCatalog.length;i++) {
        const old = beforeCatalog[i], now = afterCatalog[i];
        const targeted = ["offers","proof","materials"].includes(old.section_key);
        assert.equal(now.format,targeted ? "text" : old.format);
        for (const key of Object.keys(old).filter(key=>!targeted || !["format","updated_at"].includes(key))) assert.deepEqual(now[key],old[key]);
      }
      if (scenario === "authorized") {
        const expected = structuredClone(sections); delete expected.offers;
        assert.deepEqual(afterBase[0].sections_json,expected);
        assert.equal(afterBase[0].version,17);
        for (const key of ["account_id","created_at"]) assert.deepEqual(afterBase[0][key],beforeBase[0][key]);
      } else assert.deepEqual(afterBase,beforeBase);
      await db.exec(migration);
      assert.deepEqual((await db.query("select * from public.communication_base_sections order by section_key")).rows,afterCatalog);
      assert.deepEqual((await db.query("select * from public.account_communication_bases")).rows,afterBase);
      assert.equal((await db.query("select has_column_privilege('service_role','public.communication_base_sections','format','update') as allowed")).rows[0].allowed,false);
    }
    console.log("D14D SQL:",scenario,"passed");
  } finally { await db.close(); }
}
