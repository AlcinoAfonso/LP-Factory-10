import assert from "node:assert/strict";

import { buildAgentBaseResearchPrompt, parseAgentBaseResearchResponse } from "./research";

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
