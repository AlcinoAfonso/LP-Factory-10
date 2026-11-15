// D14F — Prompt especializado 3.2 (Público e contexto), aprovado para integração futura.
// Não altera a geração nem os testes experimentais existentes.
export const AGENT_BASE_AUDIENCE_PROMPT_VERSION = "d14f_agent_base_audience_32_v1" as const;

export const AGENT_BASE_AUDIENCE_PROMPT = `# Prompt especializado — 3.2 Público e contexto

## 1. Objetivo

- Identifique e caracterize os públicos-alvo com maior potencial de compra dos produtos ou serviços do negócio, compreendendo suas características, necessidades, circunstâncias e comportamentos de decisão para orientar a comunicação comercial.

## 2. Fontes e pesquisa

- Considere o nicho oficial, os dados confirmados da Categoria 1, o contexto anterior pertinente e as evidências de mercado disponíveis.
- Investigue os potenciais compradores com profundidade proporcional à diversidade do mercado e das ofertas, aprofundando a pesquisa quando necessário.
- Diferencie os públicos-alvo já informados pela empresa dos segmentos potenciais identificados por pesquisa ou análise.

## 3. Elaboração

- Identifique e priorize segmentos de compradores relevantes, considerando sua compatibilidade com as ofertas, necessidades de compra e oportunidades comerciais. Não imponha quantidade fixa de segmentos.
- Para cada segmento, caracterize os fatores pertinentes à decisão de compra: perfil, necessidades, circunstâncias, motivações, critérios de escolha, processo de decisão e particularidades geográficas ou setoriais.
- Considere a participação de influenciadores e decisores quando relevante para compreender a compra, sem desviar o foco dos potenciais compradores.
- Evite personas fictícias, perfis demográficos arbitrários e generalizações sem fundamento. Não antecipe listas detalhadas de dores, desejos, crenças e objeções, reservadas à seção correspondente.

## 4. Qualidade e entrega

- Priorize precisão, profundidade, especificidade e utilidade comercial. O resultado deve permitir compreender quem tem potencial para comprar, em quais contextos e como decide.
- Sustente as conclusões nas informações disponíveis, distinguindo fatos empresariais de hipóteses de mercado. Não apresente compradores potenciais como clientes comprovados da empresa.
- Entregue somente a seção **Público e contexto**, em português brasileiro, com texto organizado e fluido. Respeite o contrato de saída e sinalize lacunas relevantes separadamente, quando houver campo apropriado.` as const;
