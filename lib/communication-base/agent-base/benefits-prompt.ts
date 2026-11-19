// D14F — Prompt e Structured Outputs especializados da seção 3.5 (Benefícios).
import { COMMUNICATION_ITEMS_MAX } from "../policy";
export const AGENT_BASE_BENEFITS_PROMPT_VERSION = "d14f_agent_base_benefits_35_v1" as const;

export const AGENT_BASE_BENEFITS_PROMPT = `# Prompt especializado — 3.5 Benefícios

## 1. Objetivo

- Identifique e desenvolva os principais benefícios que as ofertas do negócio podem proporcionar aos compradores prioritários, evidenciando ganhos concretos, melhorias e resultados relevantes para suas necessidades.

## 2. Fontes e pesquisa

- Utilize o nicho oficial, os dados confirmados da Categoria 1 e as conclusões pertinentes das seções 3.2 (Público e contexto), 3.3 (Dores, desejos, crenças e objeções) e 3.4 (Proposta de valor).
- Aproveite evidências de mercado disponíveis e aprofunde a pesquisa quando necessário para compreender quais ganhos são valorizados pelos compradores.
- Diferencie benefícios fundamentados nas características confirmadas das ofertas daqueles que representam possibilidades ou hipóteses estratégicas.

## 3. Elaboração

- Relacione as características e capacidades das ofertas às melhorias que podem proporcionar na vida, no trabalho ou nos resultados dos compradores.
- Considere benefícios funcionais, práticos, econômicos e emocionais conforme sua relevância e sustentação.
- Explicite o ganho percebido pelo comprador, em vez de simplesmente descrever características dos produtos ou serviços.
- Priorize benefícios associados às necessidades, motivações e dificuldades mais relevantes dos públicos identificados.
- Considere diferenças entre públicos e ofertas quando necessárias para tornar os benefícios específicos e úteis.
- Evite benefícios redundantes, genéricos ou artificialmente numerosos. Não imponha uma quantidade fixa.

## 4. Qualidade e entrega

- Produza uma lista de benefícios objetivos, claros e comercialmente relevantes. Cada item deve comunicar um ganho distinto, com especificidade suficiente para orientar futuras ações de comunicação.
- Evite promessas de resultados garantidos, afirmações quantitativas sem comprovação e benefícios que dependam de capacidades não confirmadas do negócio.
- Não confunda benefícios com diferenciais competitivos nem repita a formulação central da Proposta de valor.
- Entregue somente a seção **Benefícios**, em português brasileiro, conforme o Structured Outputs específico desta seção.` as const;

// Mantém o envelope "sections" e o valor persistido no contrato existente da Base.
export const AGENT_BASE_BENEFITS_SECTION_SCHEMA = {
  type: "object", additionalProperties: false, required: ["value", "basis"],
  properties: {
    value: {
      type: "array",
      description: "Benefícios distintos, específicos e relevantes para os compradores, ordenados por importância comercial.",
                items: { type: "string" },
                maxItems: COMMUNICATION_ITEMS_MAX,
    },
    basis: { type: "string", enum: ["strategic_hypothesis"] },
  },
};
