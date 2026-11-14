import assert from "node:assert/strict";

import { agentBaseQaConfiguration, buildAgentBaseResearchPrompt, parseAgentBaseResearchResponse } from "./research";
import type { ResolvedOpenAiProductWorkload } from "../../openai-workloads";

// Protege o par aprovado mesmo que a configuração E21 da Categoria 3 seja outra.
const active = {
  id: "communication_base_stage2_intelligence",
  displayName: "Inteligência da Base",
  classification: "product_runtime",
  configurationKind: "effective",
  apiKind: "responses_text",
  consumer: "Inteligência da Base",
  fallback: "Preservar a Base",
  model: "gpt-6-luna",
  reasoningEffort: "max",
  serviceTier: "fast",
  source: "supabase_operational",
  revision: "3",
  effectiveConfigurationVerified: true,
  webSearch: { externalWebAccess: true, searchContextSize: "medium", maxToolCalls: 2, contextWindowTokenBudget: 128000 },
} as const satisfies ResolvedOpenAiProductWorkload;
const snapshot = JSON.stringify(active);
const qaConfiguration = agentBaseQaConfiguration(active);
assert.equal(qaConfiguration.model, "gpt-6.1-sol");
assert.equal(qaConfiguration.reasoningEffort, "medium");
assert.equal(qaConfiguration.serviceTier, null);
assert.equal(qaConfiguration.id, "communication_base_stage2_intelligence");
assert.deepEqual(qaConfiguration.webSearch, active.webSearch);
assert.equal(JSON.stringify(active), snapshot, "A configuração E21 ativa deve permanecer imutável");

const sample = {
  businessName: "João Imóveis QA",
  officialNiche: "Corretor Imóveis",
  confirmedBusinessData: {
    business_context: "Corretor residencial para famílias na Tijuca, Vila Isabel e Grajaú.",
    offers: "Compra e venda de apartamentos e casas. Cenário fictício para teste.",
  },
  fictionalTestScenario: true,
};
const prompt = buildAgentBaseResearchPrompt(sample);
assert.ok(prompt);
const input = JSON.parse(prompt.input);
assert.equal(input.experimental_case.business_name, "João Imóveis QA");
assert.equal(input.experimental_case.official_niche, "Corretor Imóveis");
assert.equal(input.experimental_case.fictional_test_scenario, true);
assert.match(prompt.instructions, /Pesquise na web obrigatoriamente/);
assert.match(prompt.instructions, /Não produza as sete seções/);
assert.equal(buildAgentBaseResearchPrompt({ ...sample, officialNiche: "" }), null);
assert.equal(buildAgentBaseResearchPrompt({
  ...sample, confirmedBusinessData: { unexpected_key: "injetado" },
}), null);

const parsed = parseAgentBaseResearchResponse({
  output: [
    { type: "web_search_call", action: {
      type: "search", sources: [{ title: "Pesquisa", url: "https://example.org/mercado" }],
    } },
    { type: "message", content: [
      { type: "output_text", text: "Achado com fonte.", annotations: [
        { type: "url_citation", url: "https://example.org/mercado", title: "Pesquisa" },
      ] },
    ] },
  ],
});
assert.equal(parsed.ok, true);
if (parsed.ok) {
  assert.equal(parsed.value.sources.length, 1);
  assert.equal(parsed.telemetry.webSearchCallCount, 1);
}
assert.equal(parseAgentBaseResearchResponse({
  output: [{ type: "message", content: [{ type: "output_text", text: "Sem pesquisa" }] }],
}).ok, false);
assert.equal(parseAgentBaseResearchResponse({
  output: [
    { type: "web_search_call", action: { type: "search", sources: [] } },
    { type: "message", content: [{ type: "output_text", text: "Sem evidência" }] },
  ],
}).ok, false);

console.log("Agente Base — contrato de pesquisa experimental: PASS");
