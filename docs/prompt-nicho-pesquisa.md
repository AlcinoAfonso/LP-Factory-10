# Pesquisa completa por nicho/taxon — LP Factory 10

## 1. Objetivo

Pesquisar o nicho/taxon informado para gerar uma base estratégica reutilizável.

## 2. Parâmetros da pesquisa

Informe o taxon/nicho a pesquisar:

- Taxon/nicho: [preencher]
- Nível do taxon: [segment | niche | ultra_niche]

Selecione o `audience_scope` da pesquisa:

- [ ] `business_buyer`
- [ ] `end_customer`

Selecione os blocos a pesquisar:

- [ ] `strategic_core`
- [ ] `lp_overview`
- [ ] `lp_sections`
- [ ] `seo`

Regra:
- se faltar taxon, nível do taxon, `audience_scope` ou bloco selecionado, pare e peça o dado faltante antes de pesquisar
- se o nível for `segment`, pesquise achados transversais do segmento, sem assumir subnicho, ultra-nicho ou tipo de oferta específico
- se o nível for `niche` ou `ultra_niche`, pesquise achados específicos do recorte informado
- não resolva ambiguidade escolhendo sozinho um submercado, subnicho ou modelo de oferta

## 3. strategic_core

Entregue uma tabela sobre o núcleo estratégico do taxon para o público selecionado.

Antes da tabela, informe: Taxon, `research_block = strategic_core` e `audience_scope`.

Preencha: `pain`, `objection`, `desire`, `hidden_desire`, `belief`, `fear`, `awareness_level`, `vocabulary`, `trigger`, `proof_type`, `trend`, `positioning_opportunity`.

Observação: `hidden_desire` significa motivação profunda ligada a identidade, autoimagem, status, pertencimento, autoconfiança ou reconhecimento; não é o desejo declarado.

Observação: `trigger` significa gatilho de ativação real do mercado, não gatilho mental genérico.

Para `hidden_desire`, não use clichê genérico; ancore o achado em evidência, linguagem recorrente ou inferência marcada em `notes`/`evidência`.

Para cada `item_key`, entregue até 3 achados relevantes quando houver variação real. 3 é teto, não meta; não complete volume artificialmente. Para `vocabulary`, cada achado pode reunir de 3 a 8 termos relacionados no `item_text`, separados por ponto e vírgula.

Use exatamente estas colunas, nesta ordem: `item_key | item_text | priority | sort_order | notes | evidência`.

Atenção: em `priority`, número maior = maior força; em `sort_order`, número menor = posição mais alta.

Para cada linha: `item_key` = um dos itens acima; `item_text` = achado específico e útil; `priority` = força do achado (`3` forte, `2` relevante, `1` secundário/condicional); `sort_order` = ordem de relevância dentro do mesmo `item_key` e reinicia em cada `item_key`; `notes` = contexto, nuance, limite ou cuidado; `evidência` = fonte, padrão observado ou inferência marcada.

Use web, SERP, páginas reais do nicho, concorrentes e avaliações públicas do mercado brasileiro.

Limites: não incluir dados locais de cliente, não escrever copy final, não misturar públicos no mesmo resultado, não criar `item_key` fora da lista acima e não inventar quando faltar fonte.
