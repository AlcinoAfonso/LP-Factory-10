// D14F — Prompt e contrato de saída especializados da seção 3.4 (Proposta de valor).
export const AGENT_BASE_VALUE_PROPOSITION_PROMPT_VERSION = "d14f_agent_base_value_proposition_34_v1" as const;

export const AGENT_BASE_VALUE_PROPOSITION_PROMPT = `# Prompt especializado — 3.4 Proposta de valor

## 1. Objetivo

- Desenvolva uma proposta de valor clara, específica e convincente, demonstrando por que as ofertas do negócio são relevantes para seus compradores prioritários e qual valor podem proporcionar.

## 2. Fontes e pesquisa

- Utilize o nicho oficial, os dados confirmados da Categoria 1 e as conclusões pertinentes das seções 3.2 (Público e contexto) e 3.3 (Dores, desejos, crenças e objeções).
- Considere evidências de mercado e alternativas disponíveis, aprofundando a pesquisa quando necessário para identificar oportunidades de posicionamento.
- Diferencie características confirmadas do negócio de interpretações e hipóteses estratégicas.

## 3. Elaboração

- Identifique as necessidades mais relevantes dos públicos prioritários e relacione-as às ofertas efetivamente disponíveis.
- Articule quatro elementos: **para quem a oferta é relevante, qual necessidade atende, como contribui para resolvê-la e qual transformação pode proporcionar**.
- Priorize o valor percebido pelo comprador, e não a simples descrição dos produtos ou serviços.
- Considere diferenças relevantes entre públicos e ofertas, preservando uma proposta central coerente, sem fragmentação artificial.
- Evidencie uma Proposta Única de Valor (PUV) somente quando existir fundamento para uma distinção real perante as alternativas.

## 4. Qualidade e entrega

- Produza um texto estratégico coeso, específico, persuasivo e reutilizável em diferentes canais.
- Evite generalidades, slogans publicitários, promessas sem comprovação e listas extensas de benefícios ou diferenciais, reservados às respectivas seções.
- Quando as informações forem insuficientes, preserve os limites do conhecimento disponível, sem inventar vantagens ou resultados.
- Entregue somente a **Proposta de valor**, em português brasileiro, conforme o Structured Outputs específico desta seção.` as const;

// Integra o envelope "sections" já consumido pelo parser e pela Base, sem alterar seu formato persistido.
export const AGENT_BASE_VALUE_PROPOSITION_SECTION_SCHEMA = {
  type: "object", additionalProperties: false, required: ["value", "basis"],
  properties: {
    value: { type: "string", description: "Texto final da proposta de valor, pronto para leitura e edição na Base de Comunicação." },
    basis: { type: "string", enum: ["strategic_hypothesis"] },
  },
};
