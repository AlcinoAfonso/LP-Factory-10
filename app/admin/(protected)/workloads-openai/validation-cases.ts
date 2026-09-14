import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { listOpenAiWorkloadInventory, resolveOpenAiProductWorkload } from "@/openai-workloads";
import { runOpenAiCandidateProofCore } from "./proofCore";

async function main() {
const inventory = listOpenAiWorkloadInventory();
assert.deepEqual(inventory.map((item) => item.id), [
  "niche_resolution",
  "commercial_activation_draft_generation",
  "taxon_input_catalog_sufficiency_evaluation",
  "supabase_inspect",
]);
assert.ok(!inventory.some((item) => item.id === ("landing_page_dynamic_market_research" as string)));

const factual = await resolveOpenAiProductWorkload("taxon_input_catalog_sufficiency_evaluation", "development");
assert.ok(factual.ok);
assert.equal(factual.value.model, "gpt-5.6-terra");
assert.equal(factual.value.reasoningEffort, "low");
assert.equal(factual.value.webSearch?.maxToolCalls, 2);
const removed = await resolveOpenAiProductWorkload("landing_page_dynamic_market_research", "development");
assert.ok(!removed.ok);

let called = "";
const proof = await runOpenAiCandidateProofCore(factual.value, "preview", "synthetic-key", "request-1", {
  niche: async () => ({ ok: false, code: "configuration" }),
  commercial: async () => ({ ok: false, code: "configuration" }),
  inputCatalogEvaluation: async () => { called = "factual"; return { ok: true, providerRequestId: "resp-1", latencyMs: 10 }; },
});
assert.ok(proof.ok);
assert.equal(called, "factual");

const actions = readFileSync(new URL("./actions.ts", import.meta.url), "utf8");
const proofCore = readFileSync(new URL("./proofCore.ts", import.meta.url), "utf8");
assert.doesNotMatch(actions, /landing_page_dynamic_market_research|dynamicMarketResearch/);
assert.doesNotMatch(proofCore, /landing_page_dynamic_market_research|dynamicMarketResearch/);

console.log("ok - OpenAI Admin exposes only current workloads and preserves the E20.8 factual proof path");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
