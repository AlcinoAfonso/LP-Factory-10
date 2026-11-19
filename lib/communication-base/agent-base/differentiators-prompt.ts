// D14F — Prompt e Structured Outputs especializados da seção 3.6 (Diferenciais).
import { COMMUNICATION_ITEMS_MAX } from "../policy";
export const AGENT_BASE_DIFFERENTIATORS_PROMPT_VERSION = "d14f_agent_base_differentiators_36_v1" as const;

export const AGENT_BASE_DIFFERENTIATORS_PROMPT = `# Prompt especializado — 3.6 Diferenciais

## 1. Objetivo

- Identifique e desenvolva os diferenciais competitivos mais relevantes do negócio, demonstrando quais características de sua atuação podem distingui-lo das alternativas disponíveis e influenciar a decisão dos compradores.

## 2. Fontes e pesquisa

- Utilize o nicho oficial, os dados confirmados da Categoria 1 e as conclusões pertinentes das seções 3.2 a 3.5.
- Investigue alternativas e práticas do mercado quando necessário para avaliar a relevância e a singularidade dos possíveis diferenciais.
- Distinga características confirmadas do negócio, diferenças sustentadas por evidências e oportunidades de diferenciação ainda hipotéticas.

## 3. Elaboração

- Examine aspectos como especialização, método de trabalho, experiência, tecnologia, qualidade, atendimento, conveniência e características das ofertas, conforme sua pertinência ao negócio.
- Identifique quais características apresentam diferenças relevantes em relação às alternativas consideradas, explicando sua importância para a escolha do comprador.
- Priorize diferenciais valorizados pelos públicos identificados e coerentes com a Proposta de valor.
- Considere diferenças entre ofertas ou públicos quando necessárias, sem fragmentar artificialmente o posicionamento.
- Não confunda diferenciais com benefícios: diferenciais descrevem características distintivas da oferta ou do negócio; benefícios representam ganhos para o comprador.
- Não apresente características comuns do setor como exclusivas. Diferenciais potenciais sem comprovação comparativa devem ser identificados como hipóteses, nunca como superioridade demonstrada.

## 4. Qualidade e entrega

- Produza uma lista objetiva e priorizada de diferenciais relevantes, específicos e úteis para orientar a comunicação comercial.
- Cada item deve expressar uma característica distintiva e sua relevância para a decisão do comprador, sem explicações extensas.
- Evite afirmações como "o melhor", "o único", "líder" ou outras alegações de superioridade sem evidências verificáveis.
- Não imponha quantidade artificial de diferenciais nem invente vantagens para completar a lista.
- Entregue somente a seção **Diferenciais**, em português brasileiro, conforme o Structured Outputs específico desta seção.` as const;

// Mantém o envelope "sections" e o valor persistido no contrato existente da Base.
export const AGENT_BASE_DIFFERENTIATORS_SECTION_SCHEMA = {
  type: "object", additionalProperties: false, required: ["value", "basis"],
  properties: {
    value: {
      type: "array",
      description: "Diferenciais específicos, relevantes e sustentáveis, ordenados por importância competitiva. Identificar hipóteses não comprovadas no próprio texto.",
                items: { type: "string" },
                maxItems: COMMUNICATION_ITEMS_MAX,
    },
    basis: { type: "string", enum: ["strategic_hypothesis"] },
  },
};
