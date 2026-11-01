// node supabase/tests/d14d_section_titles.proof.mjs <absolute @electric-sql/pglite directory>
// Isolated PostgreSQL only. No hosted access, schema changes or product dependency.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const { PGlite } = await import(pathToFileURL(resolve(process.argv[2], "dist/index.js")).href);
const read = (name) => readFileSync(new URL(name, import.meta.url), "utf8");
const baseline = read("../migrations/20261010202505_e25_3_communication_resources.sql").split("-- Serializes global reorders;")[0];
const migration = read("../migrations/20261101141410_d14d_section_titles.sql");
for (const customized of [false, true]) {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create role ai_readonly;");
    // Exact catalog table/constraints, seeds, grants, RLS and timestamp trigger.
    await db.exec(baseline + "\ncommit;");
    if (customized) await db.exec("update public.communication_base_sections set label='Cadastro personalizado',sort_order=7 where section_key='business_name'; update public.communication_base_sections set label='Referências próprias',sort_order=2 where section_key='materials';");
    const before = (await db.query("select * from public.communication_base_sections order by section_key")).rows;
    await db.exec(migration);
    const after = (await db.query("select * from public.communication_base_sections order by section_key")).rows;
    assert.equal(after.length, 17);
    for (let i = 0; i < before.length; i++) {
      const previous = before[i], current = after[i];
      const title = customized ? previous.label : ({ business_name:"Identificação do negócio", materials:"Referências institucionais" }[previous.section_key] ?? previous.label);
      assert.equal(current.label, title);
      for (const key of Object.keys(previous).filter(key => key !== "label" && key !== "updated_at")) assert.deepEqual(current[key], previous[key], key);
      if (title === previous.label) assert.deepEqual(current, previous, "unaffected rows remain identical");
    }
    await db.exec(migration);
    assert.deepEqual((await db.query("select * from public.communication_base_sections order by section_key")).rows, after, "replay is idempotent");
    await db.exec("set role authenticated");
    await assert.rejects(db.query("select * from public.communication_base_sections"), error => error.code === "42501");
    await assert.rejects(db.query("update public.communication_base_sections set label='Forbidden'"), error => error.code === "42501");
    await db.exec("reset role");
    assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.communication_base_sections'::regclass")).rows[0].relrowsecurity, true);
    console.log("D14D PostgreSQL " + (await db.query("show server_version")).rows[0].server_version + ": " + (customized ? "Admin labels/order preserved" : "approved initial titles") + ", identities/formats/categories, replay and ACL passed.");
  } finally { await db.close(); }
}
