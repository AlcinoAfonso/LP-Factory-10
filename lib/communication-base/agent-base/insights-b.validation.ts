import assert from "node:assert/strict";

import {
  AGENT_BASE_INSIGHTS_B_PROMPT_VERSION,
  buildAgentBaseInsightsBPrompt,
  parseAgentBaseInsightsBResponse,
} from "./insights-b";

const b2b = {
  businessName: "Sistema QA",
  officialNiche: "Software de gestão de contratos entre empresas",
  confirmedBusinessData: {
    business_name: "Sistema QA",
    business_context: "Oferece uma solução de gestão de contratos para equipes administrativas.",
    offers: "Assinatura de software B2B.",
  },
  fictionalTestScenario: true,
};
const prompt = buildAgentBaseInsightsBPrompt(b2b);
assert.ok(prompt);
assert.equal(AGENT_BASE_INSIGHTS_B_PROMPT_VERSION, "d14f_base_insights_33_b_v1");
assert.equal(prompt.schemaName, "agent_base_market_insights_33_b_v1");
assert.match(prompt.instructions, /Web Search/);
assert.match(prompt.instructions, /B2B, B2C/);
assert.match(prompt.instructions, /quatro listas/);
assert.match(prompt.instructions, /frase curta/);
assert.match(prompt.instructions, /não salve|Não salve/);
assert.doesNotMatch(prompt.instructions, /imóveis|corretores|financiamento|bairros\/municípios/i);
const input = JSON.parse(prompt.input);
assert.equal(input.experimental_case.official_niche, b2b.officialNiche);
assert.deepEqual(Object.keys(prompt.schema.properties.sections.properties), ["market_insights"]);
assert.deepEqual(prompt.schema.properties.sections.properties.market_insights.properties.value.required,
  ["dores", "desejos", "crencas", "objecoes"]);
assert.equal(buildAgentBaseInsightsBPrompt({ ...b2b, officialNiche: "" }), null);
assert.equal(buildAgentBaseInsightsBPrompt({
  ...b2b, confirmedBusinessData: { unsupported: "Dado não confirmado" },
}), null);
assert.ok(buildAgentBaseInsightsBPrompt({
  businessName: "João Imóveis QA",
  officialNiche: "Intermediação imobiliária residencial",
  confirmedBusinessData: { business_name: "João Imóveis QA", offers: "Intermediação de apartamentos e casas." },
  fictionalTestScenario: true,
}), "O prompt também deve aceitar nichos B2C sem customização.");

const fourGroups = {
  dores: ["Dificuldade para comparar processos.", "Demora na aprovação interna."],
  desejos: ["Visibilidade sobre contratos.", "Redução de trabalho manual."],
  crencas: ["Trocar o sistema pode interromper a operação.", "Integrações exigem planejamento."],
  objecoes: ["Custo da migração.", "Dúvidas sobre tempo de implantação."],
};
const envelope = (value: unknown, basis: string = "strategic_hypothesis") => ({
  sections: { market_insights: { value, basis } },
});
const payload = (value: unknown, withWeb = true) => ({
  output: [
    ...(withWeb ? [{ type: "web_search_call", status: "completed", action: {
      type: "search", sources: [{ title: "Fonte verificável", url: "https://example.org/pesquisa" }],
    } }] : []),
    { type: "message", content: [{ type: "output_text", text: JSON.stringify(value), annotations: [] }] },
  ],
});
const success = parseAgentBaseInsightsBResponse(payload(envelope(fourGroups)));
assert.equal(success.ok, true);
if (success.ok) {
  assert.deepEqual(success.value.sections.market_insights, [
    "Dor: Dificuldade para comparar processos.",
    "Dor: Demora na aprovação interna.",
    "Desejo: Visibilidade sobre contratos.",
    "Desejo: Redução de trabalho manual.",
    "Crença: Trocar o sistema pode interromper a operação.",
    "Crença: Integrações exigem planejamento.",
    "Objeção: Custo da migração.",
    "Objeção: Dúvidas sobre tempo de implantação.",
  ]);
  assert.equal(success.value.sources.length, 1);
  assert.equal(success.value.webSearchCallCount, 1);
}
const reason = (value: unknown) => {
  const result = parseAgentBaseInsightsBResponse(payload(value));
  assert.equal(result.ok, false);
  return result.ok ? null : result.reason;
};
assert.equal(parseAgentBaseInsightsBResponse(payload(envelope(fourGroups), false)).ok, false,
  "Não aceitar resposta sem Web Search.");
assert.equal(reason({ sections: { audience: { value: "Extra" }, market_insights: {
  value: fourGroups, basis: "strategic_hypothesis",
} } }), "insights_b_structure_invalid");
assert.equal(reason(envelope(fourGroups, "confirmed_business_fact")), "insights_b_structure_invalid");
assert.equal(reason(envelope({ ...fourGroups, crencas: undefined })), "insights_b_structure_invalid");
assert.equal(reason(envelope({ ...fourGroups, crencas: [] })), "insights_b_group_invalid");
assert.equal(reason(envelope({ ...fourGroups, dores: [null] })), "insights_b_group_invalid");
assert.equal(reason(envelope({ ...fourGroups, desejos: ["  "] })), "insights_b_group_invalid");
assert.equal(reason(envelope({
  ...fourGroups, dores: Array.from({ length: 18 }, (_, n) => `Dor número ${n}`),
})), "insights_b_too_many");

const minimal = { dores: ["x"], desejos: ["x"], crencas: ["x"], objecoes: ["x"] };
const prefixLengths = ["Dor: ", "Desejo: ", "Crença: ", "Objeção: "]
  .reduce((sum, prefix) => sum + prefix.length, 0);
const exact = { ...minimal, dores: ["x".repeat(30_000 - prefixLengths - 3)] };
assert.equal(parseAgentBaseInsightsBResponse(payload(envelope(exact))).ok, true,
  "Contrato da Categoria 3 aceita 30.000 caracteres somados.");
assert.equal(reason(envelope({ ...exact, dores: [exact.dores[0] + "x"] })),
  "insights_b_section_invalid", "Rejeitar 30.001 sem truncar.");
console.log("Agente Base — Modelo B (seção 3.3): PASS");
