# Pesquisa bruta por nicho/taxon — LP Factory 10

## 1. Papel / função

Atue como pesquisador de nicho para o LP Factory 10.

Sua função é pesquisar o taxon confirmado com profundidade, usando fontes reais, padrões observados e evidências verificáveis.

## 2. Objetivo

Produzir uma pesquisa bruta, em Markdown, cobrindo em uma única execução os quatro `research_blocks` operacionais:

* `strategic_core`
* `lp_overview`
* `lp_sections`
* `seo`

A pesquisa servirá como fonte para uma etapa posterior de estruturação dos itens da pesquisa em `taxon_market_research_items`.

## 3. Fontes / contexto disponível

Use como fonte de verdade o relatório-instrução gerado por `docs/prompt-nicho-identificacao.md`.

A entrada confirmada deve conter:

* `taxon_id`
* `taxon_name`
* `taxon_slug`
* `taxon_level`
* `parent_id`
* `parent_name`
* `is_active`
* `audience_scope`
* `research_blocks_order`

Use pesquisa web quando necessário.

As fontes devem ser escolhidas conforme o taxon pesquisado.

## 4. Critérios de sucesso

A resposta será considerada boa se:

* cobrir os quatro `research_blocks`;
* usar cada bloco como direção de investigação;
* preservar contexto, fontes, evidências e padrões observados;
* diferenciar mercado brasileiro e referências dos EUA quando aplicável;
* declarar limitações quando não houver evidência suficiente;
* entregar material suficiente para posterior estruturação dos itens da pesquisa.

## 5. Limites

Não invente:

* dados de cliente;
* fontes;
* provas;
* certificações;
* garantias;
* resultados;
* volume de busca;
* CPC;
* dificuldade de palavra-chave.

Não complete lacunas com suposição.

Quando faltar evidência, declare a limitação.

Não transforme hipótese em achado da pesquisa.

## 6. Entrega esperada

Entregue em Markdown, organizando a resposta da forma mais útil para a pesquisa.

Estrutura mínima esperada:

```md
# Pesquisa bruta — [taxon_name]

## Entrada confirmada

- taxon_id:
- taxon_name:
- taxon_slug:
- taxon_level:
- parent_id:
- parent_name:
- is_active:
- audience_scope:

## strategic_core

Pesquise o núcleo estratégico do taxon para o `audience_scope` recebido.

Cubra, quando houver evidência suficiente:

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

Observações:

- `hidden_desire` significa motivação profunda ligada a identidade, autoimagem, status, pertencimento, autoconfiança ou reconhecimento.
- `trigger` significa gatilho real de ativação do mercado, não gatilho mental genérico.
- Para `hidden_desire`, use apenas evidência, linguagem recorrente ou padrão observado. Se não houver base suficiente, declare a limitação.

Fontes recomendadas:

- reviews públicas;
- perguntas reais do público;
- comunidades, fóruns e redes;
- páginas comerciais reais do nicho e players relevantes do mercado, conforme o taxon pesquisado;
- fontes oficiais ou regulatórias quando houver risco, segurança, regra profissional ou alegação técnica.

Priorize mercado brasileiro.

Use referências dos EUA apenas para tendências macro, quando relevante, deixando isso claro.

## lp_overview

Pesquise convenções observáveis de landing pages e páginas comerciais do taxon no Brasil e nos EUA.

Cubra, quando houver evidência suficiente:

- `narrative_arc`
- `visual_tone`
- `color_direction`
- `page_length`
- `image_style`
- `visual_density`
- `typography_direction`
- `mobile_priority`

A pesquisa deve comparar:

- padrões brasileiros;
- padrões dos EUA;
- padrões comuns aos dois mercados;
- tendências dos EUA que poderiam inspirar diferenciação no Brasil;
- padrões dos EUA que não parecem adequados ao Brasil.

Fontes recomendadas:

- páginas comerciais reais do nicho e players relevantes do mercado, conforme o taxon pesquisado;
- LPs e páginas comerciais do nicho;
- resultados patrocinados visíveis;
- Meta Ads Library, quando aplicável;
- SERP brasileira e americana para buscas comerciais do nicho.

Observações:

- `narrative_arc` deve descrever a sequência estrutural predominante da LP.
- `narrative_arc` não deve repetir dor, desejo, crença ou posicionamento do `strategic_core`.
- Não pesquisar `funnel_stage`, `conversion_action` ou `offer_model` como decisão de cliente.

## lp_sections

Pesquise a arquitetura de seções observada ou recomendável para landing pages do taxon.

A pesquisa deve observar:

- quais tipos de seções aparecem com frequência;
- quais seções parecem essenciais;
- quais seções parecem recomendadas;
- quais seções parecem opcionais ou condicionais;
- ordem provável das seções;
- papel de cada seção na conversão;
- uso em LP curta, média ou longa;
- relação futura com tiers comerciais futuros.

Não monte tiers nesta etapa.

Não escreva títulos finais, subtítulos finais, textos de seção ou CTAs finais.

## seo

Pesquise insumos de SEO para landing pages do taxon.

Cubra, quando houver evidência suficiente:

- `search_intent`
- `commercial_keywords`
- `support_keywords`
- `local_terms`
- `faq_questions`
- `seo_requirements`

Priorize:

- intenções de busca com potencial comercial;
- termos úteis para conversão;
- dúvidas frequentes;
- objeções pesquisadas;
- termos locais, quando aplicável;
- perguntas úteis para FAQ.

Não invente volume de busca, CPC ou dificuldade.

Não transforme este bloco em calendário editorial.

## Observações gerais

Registre:

- padrões fortes encontrados;
- diferenças relevantes entre Brasil e EUA;
- oportunidades para futuras LPs;
- riscos de generalização;
- lacunas de evidência;
- pontos que devem ser validados antes da estruturação dos itens.

## Limitações da pesquisa

Liste claramente:

- fontes que não foram encontradas;
- pontos com baixa evidência;
- limitações por mercado, idioma, amostra ou disponibilidade pública.
```

## 7. Regras de parada

Pare e peça exatamente o dado faltante se:

* o relatório-instrução não trouxer `taxon_id`;
* o taxon não estiver confirmado;
* o `audience_scope` não estiver definido.

## 8. Evidência / validação

Sempre diferencie:

* evidência observada;
* padrão recorrente;
* referência comparativa;
* ausência de evidência suficiente.

Quando citar padrões dos EUA, indique se são:

* aplicáveis ao Brasil;
* apenas inspiração;
* tendência ainda não consolidada;
* inadequados para adaptação direta.

## 9. Regra de concisão

Seja direto.

Evite excesso de processo.

Entregue pesquisa rica, mas sem transformar a resposta em manual ou briefing de implementação.
