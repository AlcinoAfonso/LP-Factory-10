// D14F — Prompt especializado 3.3 (Dores, desejos, crenças e objeções), aprovado para integração futura.
// Não altera a geração nem os testes experimentais existentes.
export const AGENT_BASE_MARKET_INSIGHTS_PROMPT_VERSION = "d14f_agent_base_market_insights_33_v1" as const;

export const AGENT_BASE_MARKET_INSIGHTS_PROMPT = `# Prompt especializado — 3.3 Dores, desejos, crenças e objeções

## 1. Objetivo

- Identifique e analise as principais dores, desejos, crenças e objeções dos potenciais compradores do negócio, revelando fatores que influenciam suas decisões de compra e podem orientar a comunicação comercial.

## 2. Fontes e pesquisa

- Utilize o nicho oficial, os dados confirmados da Categoria 1, os públicos-alvo identificados na seção 3.2 e as evidências de mercado pertinentes.
- Investigue com profundidade proporcional às particularidades dos compradores, das ofertas e do mercado. Aproveite pesquisas anteriores e aprofunde a investigação quando necessário.
- Diferencie evidências verificáveis de interpretações e hipóteses estratégicas. Não atribua automaticamente aos clientes da empresa comportamentos observados no mercado.

## 3. Elaboração

- Organize as descobertas em quatro categorias:
  - **Dores:** problemas, dificuldades, frustrações e necessidades não atendidas que podem motivar uma compra.
  - **Desejos:** resultados, benefícios e transformações que os compradores procuram alcançar.
  - **Crenças:** percepções, pressupostos e convicções que influenciam suas escolhas, inclusive concepções equivocadas que precisam ser compreendidas, não endossadas.
  - **Objeções:** dúvidas, receios e barreiras que podem levar à hesitação, ao adiamento ou à recusa da compra.
- Identifique o público-alvo associado a cada descoberta quando essa distinção for relevante. Considere diferenças entre segmentos e situações de compra, sem presumir que todos compartilham as mesmas características.
- Priorize descobertas específicas, comercialmente relevantes e sustentadas nas informações disponíveis. Evite repetições entre categorias e não imponha quantidade artificial de itens.

## 4. Qualidade e entrega

- Produza itens objetivos, claros e suficientemente específicos para orientar decisões futuras de comunicação. Cada item deve expressar uma descoberta relevante, sem explicações extensas, generalidades ou recomendações de campanhas.
- Mantenha as quatro categorias conceitualmente distintas. Não apresente hipóteses como fatos comprovados nem invente informações para preencher categorias.
- Entregue somente a seção **Dores, desejos, crenças e objeções**, em português brasileiro, respeitando o formato de itens e o contrato de saída correspondente. Sinalize lacunas relevantes separadamente, quando houver campo apropriado.` as const;
