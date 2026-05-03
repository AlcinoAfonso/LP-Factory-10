# Prompt — Identificação de nicho/taxon

## Objetivo

Identificar o taxon cadastrado, definir o público da pesquisa e registrar os `research_blocks` que serão pesquisados.

## Entrada

Peça ao humano:

- Nome do nicho/taxon:
- Público da pesquisa: `business_buyer` ou `end_customer`
- `research_blocks` e ordem:
  - `strategic_core`
  - `lp_overview`
  - `lp_sections`
  - `seo`

Aceite apenas um público por pesquisa.

Aceite apenas `research_blocks` da lista acima.

## Ação

Use o snippet:

`supabase/snippets/e10_5_4_nicho_identificacao_taxon_lookup.sql`

Peça ao humano para executar o SQL no Supabase com o nome informado e colar o resultado no chat.

Ao receber o resultado:

- apresente os taxons encontrados
- peça confirmação do taxon correto
- se houver mais de um resultado possível, peça ao humano para escolher
- se não houver resultado, pare e oriente cadastrar o taxon antes da pesquisa
- se `is_active = false`, peça confirmação explícita antes de continuar

## Entrega final

Após a confirmação humana, entregue exatamente este bloco:

```md
# Relatório-instrução para pesquisa profunda

## 1. Entrada confirmada

taxon_id:
taxon_name:
taxon_slug:
taxon_level:
parent_id:
parent_name:
is_active:

audience_scope:

research_blocks_order:
1.
2.
3.
4.

## 2. Instrução para a IA de pesquisa

Acesse no repositório o arquivo:

`docs/prompt-nicho-pesquisa.md`

Execute esse prompt usando a entrada confirmada acima como contexto obrigatório.

Use os dados confirmados como fonte de verdade para a pesquisa.

Não refaça a identificação do taxon.

Pesquise os `research_blocks` na ordem definida em `research_blocks_order`.

Pesquise apenas um `research_block` por vez.

Após entregar cada bloco, pare e aguarde comando humano para continuar.

Após todos os blocos serem pesquisados, aguarde comando humano para consolidar.

Após a consolidação, aguarde comando humano para gerar SQL de carregamento.

Após o carregamento, gere SQL de verificação.
```

## Parada

Depois de entregar a entrada confirmada para pesquisa profunda, pare.
