import assert from "node:assert/strict";

import {
  AGENT_BASE_TWO_SECTIONS_PROMPT_VERSION,
  buildAgentBaseTwoSectionsPrompt,
  parseAgentBaseTwoSectionsResponse,
} from "./sections";
import { parseAgentBaseResearchResponse } from "./research";

const sample = {
  businessName: "João Imóveis QA",
  officialNiche: "Corretor Imóveis",
  confirmedBusinessData: {
    business_name: "João Imóveis QA",
    business_context: "Atende famílias e proprietários na Tijuca, Vila Isabel e Grajaú.",
    offers: "Intermediação residencial fictícia de apartamentos e casas.",
  },
  fictionalTestScenario: true,
};
assert.equal(AGENT_BASE_TWO_SECTIONS_PROMPT_VERSION, "d14f_base_sections_32_33_v2");
const prompt = buildAgentBaseTwoSectionsPrompt(sample);
assert.ok(prompt);
assert.match(prompt.instructions, /Público e contexto/);
assert.match(prompt.instructions, /Dores, desejos, crenças e objeções/);
assert.match(prompt.instructions, /Web Search/);
assert.match(prompt.instructions, /nem altere ou salve a Base/);
const expected = JSON.parse(prompt.input);
assert.deepEqual(expected.target_sections.map((section: { key: string }) => section.key), [
  "audience", "market_insights",
]);
assert.equal(expected.experimental_case.official_niche, "Corretor Imóveis");
assert.equal(expected.experimental_case.fictional_test_scenario, true);
assert.deepEqual(prompt.schema.properties.sections.required, ["audience", "market_insights"]);
assert.equal(buildAgentBaseTwoSectionsPrompt({ ...sample, officialNiche: "" }), null);
assert.equal(buildAgentBaseTwoSectionsPrompt({
  ...sample, confirmedBusinessData: { invalid_key: "Dado injetado" },
}), null);

const insights = [
  "Dor: Incerteza sobre o custo total pode atrasar a decisão de compra.",
  "Dor: Muitas visitas sem filtro consomem o tempo dos interessados.",
  "Desejo: Comparar bairros conforme a rotina e as necessidades da família.",
  "Desejo: Encontrar imóveis compatíveis com o orçamento real.",
  "Crença: Anúncios semelhantes podem ocultar diferenças de condomínio.",
  "Objeção: Receio de comprometer a renda sem entender despesas extras.",
];
const makePayload = (sections: unknown, web = true, withAnnotations = true) => ({
  output: [
    ...(web ? [{
      type: "web_search_call",
      status: "completed",
      action: {
        type: "search",
        sources: [{ title: "Indicadores locais", url: "https://example.org/mercado" }],
      },
    }] : []),
    {
      type: "message",
      content: [{
        type: "output_text",
        text: JSON.stringify(sections),
        annotations: withAnnotations ? [{ type: "url_citation", title: "Indicadores locais", url: "https://example.org/mercado" }] : [],
      }],
    },
  ],
});
const valid = { sections: {
  audience: {
    value: "Famílias que buscam moradia e proprietários que avaliam venda na Grande Tijuca. Segmentos com decisões diferentes.",
    basis: "strategic_hypothesis",
  },
  market_insights: { value: insights, basis: "strategic_hypothesis" },
} };
const result = parseAgentBaseTwoSectionsResponse(makePayload(valid));
assert.equal(result.ok, true);
if (result.ok) {
  assert.equal(result.value.sections.audience, valid.sections.audience.value);
  assert.deepEqual(result.value.sections.market_insights, insights);
  assert.equal(result.value.sources.length, 1);
  assert.equal(result.value.webSearchCallCount, 1);
}
// As quatro categorias precisam existir; 6–12 itens é alvo qualitativo, não
// limitação do formato da Categoria 3 que descarte uma entrega útil.
const fourCategories = [
  "Dor: Incerteza sobre custos.",
  "Desejo: Encontrar opção compatível.",
  "Crença: Anúncios podem não refletir o total de despesas.",
  "Objeção: Preciso entender o financiamento antes de visitar.",
];
assert.equal(parseAgentBaseTwoSectionsResponse(makePayload({
  sections: { ...valid.sections, market_insights: {
    value: fourCategories, basis: "strategic_hypothesis",
  } },
})).ok, true, "Aceitar quatro categorias válidas no formato existente.");
assert.equal(parseAgentBaseTwoSectionsResponse(makePayload({
  sections: { ...valid.sections, market_insights: {
    value: [
      "**Dores:** Processo confuso.",
      "**Desejos:** Comparar alternativas.",
      "**Crenças:** Valor anunciado não é o custo total.",
      "**Objeções:** Tenho receio de iniciar a negociação.",
    ],
    basis: "strategic_hypothesis",
  } },
})).ok, true, "Aceitar variações tipográficas sem alterar o conteúdo.");
assert.equal(parseAgentBaseTwoSectionsResponse(makePayload(valid, true, false)).ok, true,
  "Fontes de Web Search no action.sources bastam sem anotações no JSON estruturado.");

assert.equal(parseAgentBaseResearchResponse(makePayload(valid)).ok, true,
  "A capacidade de pesquisa do primeiro experimento deve continuar funcional.");
assert.equal(parseAgentBaseTwoSectionsResponse(makePayload(valid, false)).ok, false,
  "Web Search é obrigatório.");
assert.equal(parseAgentBaseTwoSectionsResponse(makePayload({ sections: {
  audience: valid.sections.audience,
} })).ok, false, "Ambas as seções são exigidas.");
assert.equal(parseAgentBaseTwoSectionsResponse(makePayload({ sections: {
  ...valid.sections,
  faq: { value: [], basis: "strategic_hypothesis" },
} })).ok, false, "Outras seções não podem ser geradas.");
assert.equal(parseAgentBaseTwoSectionsResponse(makePayload({ sections: {
  ...valid.sections,
  market_insights: { value: insights, basis: "confirmed_business_fact" },
} })).ok, false, "Não atribuir estatuto factual a hipóteses.");
assert.equal(parseAgentBaseTwoSectionsResponse(makePayload({ sections: {
  ...valid.sections,
  market_insights: { value: insights.slice(0, 4), basis: "strategic_hypothesis" },
} })).ok, false, "Exigir variedade e profundidade mínima.");
assert.equal(parseAgentBaseTwoSectionsResponse(makePayload({ sections: {
  ...valid.sections,
  market_insights: { value: [
    "Dor: A", "Dor: B", "Desejo: A", "Desejo: B", "Crença: A", "Crença: B",
  ], basis: "strategic_hypothesis" },
} })).ok, false, "Objeções não podem ser omitidas.");
assert.equal(parseAgentBaseTwoSectionsResponse(makePayload({ sections: {
  ...valid.sections,
  audience: { value: "a".repeat(4001), basis: "strategic_hypothesis" },
} })).ok, false, "Respeitar o limite atual da seção 3.2.");

// Regressões: expor somente o motivo de violação do contrato, sem guardar texto bruto.
const invalidCase = (sections: unknown): string | null => {
  const result = parseAgentBaseTwoSectionsResponse(makePayload({ sections }));
  assert.equal(result.ok, false);
  return result.ok ? null : result.reason;
};
assert.equal(invalidCase({
  ...valid.sections,
  audience: { value: "a".repeat(4001), basis: "strategic_hypothesis" },
}), "audience_too_long");
assert.equal(invalidCase({
  ...valid.sections,
  market_insights: { value: [...insights, "Dor: " + "x".repeat(401)], basis: "strategic_hypothesis" },
}), "market_insights_item_too_long");
assert.equal(invalidCase({
  ...valid.sections,
  market_insights: { value: ["Dor: A", "Desejo: B", "Crença: C"], basis: "strategic_hypothesis" },
}), "market_insights_too_few");
assert.equal(invalidCase({
  ...valid.sections,
  market_insights: { value: Array.from({ length: 21 }, (_, i) =>
    [ "Dor: A", "Desejo: B", "Crença: C", "Objeção: D" ][i % 4]!), basis: "strategic_hypothesis" },
}), "market_insights_too_many");
assert.equal(parseAgentBaseTwoSectionsResponse(makePayload({ sections: {
  ...valid.sections,
  market_insights: { value: [ ...insights, ...insights, "Dor: Outro contexto"], basis: "strategic_hypothesis" },
} })).ok, true, "Mais de 12 itens válidos não devem falhar fora do limite técnico de 20.");

console.log("Agente Base — seções 3.2 e 3.3, pesquisa e contrato: PASS");
