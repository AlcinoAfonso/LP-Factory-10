// D14F — Prompt e Structured Outputs especializados da seção 3.7 (FAQ).
import { COMMUNICATION_FAQ_MAX } from "../policy";
export const AGENT_BASE_FAQ_PROMPT_VERSION = "d14f_agent_base_faq_37_v1" as const;

export const AGENT_BASE_FAQ_PROMPT = `# Prompt especializado — 3.7 Perguntas frequentes

## 1. Objetivo

- Desenvolva perguntas e respostas relevantes para esclarecer dúvidas dos potenciais compradores sobre as ofertas do negócio, suas características, condições de contratação e utilização.

## 2. Fontes e pesquisa

- Utilize o nicho oficial, os dados confirmados da Categoria 1 e as conclusões pertinentes das seções anteriores, especialmente Público e contexto, Dores, desejos, crenças e objeções e Proposta de valor.
- Considere dúvidas comuns do mercado e investigue questões técnicas ou setoriais quando necessário, utilizando evidências verificáveis.
- Diferencie perguntas efetivamente informadas pelo negócio daquelas antecipadas por análise estratégica. Não apresente dúvidas previstas como relatos reais de clientes.

## 3. Elaboração

- Identifique as perguntas mais relevantes para compreender as ofertas, avaliar sua adequação e tomar uma decisão de compra.
- Considere, conforme a pertinência, dúvidas sobre funcionamento, aplicações, contratação, preços, prazos, atendimento, disponibilidade, garantias e limitações.
- Formule perguntas naturais, próximas da linguagem utilizada pelos compradores.
- Responda de maneira objetiva, clara e suficiente para esclarecer cada questão, sem transformar as respostas em discursos promocionais.
- Para informações particulares do negócio, utilize exclusivamente dados confirmados. Não invente preços, condições, prazos, políticas, garantias ou compromissos.
- Quando não existir informação suficiente para responder com segurança, omita o par de pergunta e resposta. Não preencha lacunas com suposições ou respostas evasivas.
- Priorize dúvidas relevantes e distintas, sem impor quantidade artificial.

## 4. Qualidade e entrega

- Produza pares de perguntas e respostas úteis, específicos e coerentes com o posicionamento e as ofertas do negócio.
- Evite perguntas redundantes, respostas genéricas, afirmações não comprovadas e repetições desnecessárias de benefícios ou diferenciais.
- Diferencie esclarecimentos factuais de orientações gerais fundamentadas em conhecimento de mercado.
- Entregue somente a seção **Perguntas frequentes**, em português brasileiro, conforme o Structured Outputs específico desta seção.` as const;

// Mantém o envelope "sections" e o valor persistido no contrato existente da Base.
export const AGENT_BASE_FAQ_SECTION_SCHEMA = {
  type: "object", additionalProperties: false, required: ["value", "basis"],
  properties: {
    value: {
      type: "array",
      description: "Perguntas e respostas relevantes, ordenadas pela importância para a decisão de compra. Incluir somente respostas suficientemente fundamentadas.",
                items: { type: "object", additionalProperties: false, required: ["question", "answer"],
                  properties: {
                    question: { type: "string", description: "Pergunta objetiva, formulada na linguagem natural do comprador." },
                    answer: { type: "string", description: "Resposta clara e fundamentada, sem informações empresariais inventadas." },
                  },
                },
                maxItems: COMMUNICATION_FAQ_MAX,
    },
    basis: { type: "string", enum: ["strategic_hypothesis"] },
  },
};
