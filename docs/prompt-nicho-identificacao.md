# Prompt — Identificação de nicho/taxon

## Objetivo

## 1. Objetivo

Executar o fluxo de identificação de nicho/taxon para preparar a entrada da pesquisa profunda.

A partir do nicho informado pelo humano, localizar o taxon cadastrado no banco, confirmar o taxon correto, receber `audience_scope` e `research_blocks_order`, e entregar o relatório-instrução para uso com `docs/prompt-nicho-pesquisa.md`.

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

`supabase/snippets/e10_5_5_nicho_identificacao_taxon_lookup.sql`

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

Pesquise apenas o primeiro `research_block` pendente da ordem definida.

Não pesquise mais de um `research_block` na mesma execução.

Após entregar o bloco pesquisado, pare e aguarde comando humano para continuar.

Quando o humano mandar continuar, execute apenas o próximo `research_block` pendente da ordem definida.
```

## Parada

Depois de entregar a entrada confirmada para pesquisa profunda, pare.
