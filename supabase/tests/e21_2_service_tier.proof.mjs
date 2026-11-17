// Run with node and the absolute path to an externally installed @electric-sql/pglite.
// This manual SQL proof creates only an in-memory PostgreSQL database; no hosted access.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const { PGlite } = await import(pathToFileURL(resolve(process.argv[2], "dist/index.js")).href);
const db = new PGlite();
const read = (name) => readFileSync(new URL(name, import.meta.url), "utf8");
try {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create role ai_readonly; create schema auth; create table auth.users(id uuid primary key);");
  for (const name of [
    "20260820190422_e21_2_3_openai_workload_operational_configurations.sql",
    "20260820213900_e21_2_taxon_input_catalog_sufficiency_workload.sql",
    "20260823144334_e21_2_5_openai_model_catalog.sql",
    "20260829171107_e20_7_4_dynamic_market_research_workload.sql",
  ]) await db.exec(read("../migrations/" + name));
  // Exact shared conflict helper; the rest of that migration patches unrelated consumers.
  await db.exec(read("../migrations/20260827203000_postgrest_safe_application_conflicts.sql").split("do $migration$\ndeclare")[0]);
  // Existing pending revision before the candidate migration must remain unchanged.
  await db.exec(`insert into auth.users values('10000000-0000-4000-8000-000000000001');
    select public.save_openai_workload_configuration_candidate_v1('production','commercial_activation_draft_generation','gpt-5.4-mini','none',null,'10000000-0000-4000-8000-000000000001',1);
    select * from public.promote_openai_workload_configuration_candidate_v1('production','commercial_activation_draft_generation',
    '{"schema_version":1,"proof_kind":"operational","proof_result":"approved","source":"openai_api"}','10000000-0000-4000-8000-000000000001',2);
    create temp table e21_before as select environment,workload,to_jsonb(u) as snapshot from public.openai_workload_operational_configurations u;`);
  await db.exec(read("../migrations/20261023124919_e21_2_service_tier.sql"));
  await db.exec(read("./e21_2_service_tier.test.sql"));
  console.log("E21.2 PostgreSQL " + (await db.query("show server_version")).rows[0].server_version +
    ": full migration, legacy pending, eligibility, proof/downgrade, lifecycle, version, ACL, append-only and rollback passed.");
} catch (error) { console.error({ code: error.code, message: error.message, detail: error.detail, where: error.where }); process.exitCode = 1; } finally { await db.close(); }
