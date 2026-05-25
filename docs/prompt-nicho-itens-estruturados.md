# Prompt — Estruturação de itens da pesquisa por nicho/taxon

## 1. Papel / função

Atue como estruturador de pesquisa para o LP Factory 10.

Sua função é transformar a pesquisa bruta já produzida em itens estruturados da pesquisa, prontos para `taxon_market_research_items`.

## 2. Objetivo

Produzir, em Markdown, os itens estruturados dos `research_blocks` definidos em `research_blocks_order`, sem pesquisar novamente e sem gerar SQL.

Por padrão, os quatro `research_blocks` operacionais são:

- `strategic_core`
- `lp_overview`
- `lp_sections`
- `seo`

Se `research_blocks_order` trouxer uma lista menor, estruture apenas os blocos informados.

## 3. Contexto / fonte de verdade

Use como fonte de verdade:

- a entrada confirmada gerada por `docs/prompt-nicho-identificacao.md`;
- a pesquisa bruta gerada por `docs/prompt-nicho-pesquisa.md` no mesmo chat;
- ajustes e aprovações explícitos do humano.

A entrada confirmada deve conter:

- `taxon_id`
- `taxon_name`
- `taxon_slug`
- `taxon_level`
- `parent_id`
- `parent_name`
- `is_active`
- `audience_scope`
- `research_blocks_order`

## 4. Critérios de sucesso

A estruturação será considerada boa se:

- cobrir todos os `research_blocks` informados em `research_blocks_order`;
- preservar o contexto e o significado dos achados da pesquisa bruta;
- manter `item_key` correto por bloco;
- aplicar `priority` e `sort_order` de forma consistente;
- remover duplicidades claras sem perder informação relevante;
- resumir evidências, limitações e inferências em `notes`;
- entregar saída compatível com `taxon_market_research_items`.

## 5. Limites

Use apenas conteúdo já pesquisado e aprovado.

Não faça nova pesquisa.

Não invente:

- dados de cliente;
- fontes;
- provas;
- certificações;
- garantias;
- resultados;
- volume de busca;
- CPC;
- dificuldade de palavra-chave.

Não altere taxon, público, ordem ou nome dos `research_blocks`.

Não gere SQL.

Não mantenha `evidência` ou `evidence` como coluna final.

Quando houver fonte, evidência, inferência, limite ou cuidado relevante, resuma em `notes`.

## 6. Regras de estruturação por bloco

### 6.1 Regras gerais de coluna

Use exatamente as colunas:

`item_key | item_text | priority | sort_order | notes`

Regras:

- `item_key`: obrigatório e compatível com o bloco;
- `item_text`: conteúdo objetivo e acionável;
- `priority`: use `high`, `medium` ou `low`;
- `sort_order`: inteiro positivo, iniciando em `1` por bloco, sem lacunas;
- `notes`: resumo curto de evidências, limites e inferências quando necessário.

### 6.2 strategic_core

Estruture apenas com estes `item_key`:

- `pain`
- `objection`
- `desire`
- `hidden_desire`
- `belief`
- `fear`
- `awareness_level`
- `vocabulary`
- `trigger`
- `proof_type`
- `trend`
- `positioning_opportunity`

Regras específicas:

- preserve distinção entre desejo declarado (`desire`) e motivação profunda (`hidden_desire`);
- `trigger` deve refletir gatilho real de ativação de mercado;
- em `vocabulary`, agrupe termos recorrentes de forma legível, separados por `;` quando útil;
- se um achado estiver fraco, mantenha somente se houver utilidade e sinalize limite em `notes`.

### 6.3 lp_overview

Estruture apenas com estes `item_key`:

- `narrative_arc`
- `visual_tone`
- `color_direction`
- `page_length`
- `image_style`
- `visual_density`
- `typography_direction`
- `mobile_priority`

Regras específicas:

- manter diferenciação Brasil vs EUA quando existir no material bruto;
- em `narrative_arc`, descrever sequência estrutural da LP, sem repetir conteúdo estratégico do `strategic_core`;
- quando houver padrão apenas inspiracional dos EUA, registrar isso em `notes`.

### 6.4 lp_sections

Estruture itens sobre arquitetura de seções com foco em:

- frequência de seções;
- essencial vs recomendada vs opcional/condicional;
- ordem provável;
- papel de conversão;
- adequação por LP curta, média ou longa.

Use `item_key` descritivo e consistente dentro do bloco, sem criar campos fora do padrão de colunas.

Não escrever copy final (títulos finais, subtítulos finais, textos finais ou CTAs finais).

### 6.5 seo

Estruture apenas com estes `item_key`:

- `search_intent`
- `commercial_keywords`
- `support_keywords`
- `local_terms`
- `faq_questions`
- `seo_requirements`

Regras específicas:

- priorizar intenções e termos com potencial comercial;
- manter dúvidas e objeções pesquisadas úteis para conversão;
- não incluir volume, CPC ou dificuldade;
- não converter este bloco em calendário editorial.

## 7. Entrega esperada

Entregue em Markdown.

Use uma seção para cada `research_block` estruturado.

Formato:

```md
# Itens estruturados da pesquisa — [taxon_name]

## Entrada confirmada

- taxon_id:
- taxon_name:
- taxon_slug:
- taxon_level:
- parent_id:
- parent_name:
- is_active:
- audience_scope:
- research_blocks_order:

## Registro-pai

- taxon_id:
- taxon_name:
- taxon_level:
- audience_scope:
- version: 1
- status: draft

## [research_block]

| item_key | item_text | priority | sort_order | notes |
|---|---|---|---:|---|
|  |  |  | 1 |  |
```

Ao final, informe: itens estruturados prontos para carregamento em `taxon_market_research_items`.

## 8. Regras de parada

Pare e peça exatamente o dado faltante se:

- faltar `taxon_id`;
- faltar `audience_scope`;
- faltar `research_blocks_order`;
- a pesquisa bruta dos blocos solicitados não estiver disponível no chat.

## 9. Regra de concisão

Seja direto.

Não transformar a saída em manual.

Entregue apenas o necessário para estruturação consistente e carga posterior.
