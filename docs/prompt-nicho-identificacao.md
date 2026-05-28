# Prompt — Identificação de nicho/taxon

## Objetivo

## 1. Objetivo

Executar o fluxo de identificação de nicho/taxon para preparar a entrada confirmada da pesquisa bruta.

A identificação pode partir de taxon já confirmado no Admin Dashboard ou de nome de nicho/taxon informado pelo humano.

## 2. Entrada

Priorize entrada vinda do Admin Dashboard.

Considere suficientes os seguintes dados do taxon:

- `taxon_id`
- `taxon_name`
- `taxon_slug`
- `taxon_level`
- `parent_name`
- `is_active`

Se faltar, peça apenas:

- `audience_scope`: `business_buyer` ou `end_customer`

## 3. Fallback de lookup

Use lookup por snippet **somente como fallback** quando o humano informar apenas o nome do nicho/taxon sem `taxon_id`.

Snippet de fallback:

`supabase/snippets/e10_5_5_nicho_identificacao_taxon_lookup.sql`

No fallback:

- peça ao humano para executar o SQL no Supabase e colar o resultado no chat;
- apresente os taxons encontrados;
- peça confirmação do taxon correto;
- se houver mais de um resultado possível, peça ao humano para escolher;
- se não houver resultado, pare e oriente cadastrar o taxon antes da pesquisa;
- se `is_active = false`, peça confirmação explícita antes de continuar.

## 4. Entrega final

Após a confirmação humana, entregue exatamente este bloco:

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

Acesse no repositório o arquivo:

`docs/prompt-nicho-pesquisa.md`

Execute esse prompt usando a entrada confirmada acima como contexto obrigatório.

Use os dados confirmados como fonte de verdade para a pesquisa.

Não refaça a identificação do taxon.

Pesquise apenas os `research_blocks` definidos em `research_blocks_order`.

Respeite exatamente a ordem definida em `research_blocks_order`.

Entregue cada `research_block` em uma seção separada.

Não gere itens estruturados.

Não gere SQL de carregamento.

Ao final, informe que a pesquisa bruta está pronta para estruturação dos itens.
```

## 5. Parada

Depois de entregar a entrada confirmada para pesquisa bruta, pare.
