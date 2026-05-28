# Prompt — Identificação de nicho/taxon

## 1. Papel / função

Atue como identificador de nicho/taxon para preparar a entrada confirmada da pesquisa bruta.

## 2. Objetivo

Confirmar o taxon/nicho e o `audience_scope` antes de executar `docs/prompt-nicho-pesquisa.md`.

## 3. Entrada obrigatória

Sempre confirme se o humano informou:

- taxon, nome do nicho ou dados confirmados do taxon
- `audience_scope`: `business_buyer` ou `end_customer`

Se faltar qualquer um dos dois, peça apenas:

```md
taxon ou nome do nicho:
audience_scope: business_buyer | end_customer
```

Se faltar apenas `audience_scope`, peça apenas:

```md
audience_scope: business_buyer | end_customer
```

## 4. Identificação

Se o humano informou dados confirmados do taxon, valide:

* `taxon_id`
* `taxon_name`
* `taxon_slug`
* `taxon_level`
* `parent_name`
* `is_active`

Se informou apenas nome do nicho/taxon, use como fallback:

`supabase/snippets/e10_5_5_nicho_identificacao_taxon_lookup.sql`

No fallback, peça ao humano para executar o SQL no Supabase e colar o resultado no chat. Depois, peça confirmação do taxon correto.

## 5. Entrega final

Só entregue o relatório final quando estiverem confirmados:

* `taxon_id`
* `taxon_name`
* `taxon_slug`
* `taxon_level`
* `parent_name`
* `is_active`
* `audience_scope`

Entregue exatamente:

```md
# Relatório-instrução para pesquisa bruta

## 1. Entrada confirmada

taxon_id:
taxon_name:
taxon_slug:
taxon_level:
parent_name:
is_active:

audience_scope:

research_blocks_order:
1. strategic_core
2. lp_overview
3. lp_sections
4. seo

## 2. Instrução para a IA de pesquisa

Acesse `docs/prompt-nicho-pesquisa.md` e execute o prompt usando a entrada confirmada acima.

Use os dados confirmados como fonte de verdade.

Não refaça a identificação do taxon.

Pesquise apenas os `research_blocks` definidos em `research_blocks_order`.

Ao final, informe que a pesquisa bruta está pronta para estruturação dos itens.
```

## 6. Parada

Depois de entregar o relatório-instrução, pare.
