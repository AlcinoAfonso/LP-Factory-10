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
# Entrada confirmada para pesquisa profunda

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

modo_de_execucao:
- pesquisar um `research_block` por vez
- entregar o resultado de cada bloco separadamente
- aguardar comando humano antes de seguir para o próximo bloco
- após todos os blocos, aguardar comando humano para consolidar
- após a consolidação, aguardar comando humano para gerar SQL de carregamento
- após o carregamento, gerar SQL de verificação
```

## Parada

Depois de entregar a entrada confirmada para pesquisa profunda, pare.
