import assert from "node:assert/strict";

import { translateOperationalConfigurationRows } from "./adapters/operationalConfigurationAdapterCore";
import { listOpenAiWorkloadInventory, resolveOpenAiProductWorkload } from "./index";

async function main() {
const inventory = listOpenAiWorkloadInventory();
assert.equal(inventory.length, 4);
assert.deepEqual(inventory.map((item) => item.id), ["niche_resolution", "commercial_activation_draft_generation", "taxon_input_catalog_sufficiency_evaluation", "supabase_inspect"]);
assert.ok(!inventory.some((item) => item.id === ("landing_page_dynamic_market_research" as string)));

const factual = await resolveOpenAiProductWorkload("taxon_input_catalog_sufficiency_evaluation", "development");
assert.ok(factual.ok);
assert.equal(factual.value.model, "gpt-5.6-terra");
assert.equal(factual.value.reasoningEffort, "low");
assert.deepEqual(factual.value.webSearch, { externalWebAccess: true, searchContextSize: "medium", maxToolCalls: 2, contextWindowTokenBudget: 128000 });

const dynamic = await resolveOpenAiProductWorkload("landing_page_dynamic_market_research", "development");
assert.ok(!dynamic.ok);
assert.equal(dynamic.error.code, "UNKNOWN_WORKLOAD");

const operational = translateOperationalConfigurationRows(
  { environment: "preview", workload: "taxon_input_catalog_sufficiency_evaluation" },
  { data: [{ environment: "preview", workload: "taxon_input_catalog_sufficiency_evaluation", modality: "responses_text", active_revision_id: "r1" }], error: null },
  { data: [{ id: "r1", environment: "preview", workload: "taxon_input_catalog_sufficiency_evaluation", modality: "responses_text", model: "gpt-5.6-terra", reasoning_effort: "low", quality: null, revision_number: 1 }], error: null },
);
assert.ok(operational.ok);
assert.equal(operational.value.workload, "taxon_input_catalog_sufficiency_evaluation");
const removedOperational = translateOperationalConfigurationRows(
  { environment: "preview", workload: "landing_page_dynamic_market_research" as never },
  { data: [{ environment: "preview", workload: "landing_page_dynamic_market_research", modality: "responses_text", active_revision_id: "r2" }], error: null },
  { data: [{ id: "r2", environment: "preview", workload: "landing_page_dynamic_market_research", modality: "responses_text", model: "gpt-5.6-terra", reasoning_effort: "low", quality: null, revision_number: 2 }], error: null },
);
assert.ok(!removedOperational.ok);

console.log("ok - OpenAI current registry excludes E20.7 while the factual workload stays effective");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
