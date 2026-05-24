# Prompt — Verificação de carregamento de pesquisa por nicho/taxon

## 1. Papel / função

Atuar como verificador técnico-operacional do carregamento da pesquisa por taxon.

## 2. Objetivo

Gerar SQL de verificação para confirmar se os registros da pesquisa consolidada foram carregados corretamente em:

- `taxon_market_research`
- `taxon_market_research_items`

## 3. Entrada obrigatória

Receba os dados usados no carregamento ou a pesquisa consolidada aprovada.

Use como fonte de verdade:

- `taxon_id`
- `research_block`
- `audience_scope`
- `version`
- `status` esperado, quando informado
- quantidade esperada de itens por `research_block`, quando disponível

## 4. Critérios de sucesso

O SQL de verificação deve permitir conferir:

- se o registro-pai existe em `taxon_market_research`
- se `taxon_id`, `research_block`, `audience_scope`, `version` e `status` estão corretos
- quantos itens foram carregados por `research_block`
- quantos itens estão ativos
- se existem itens sem `item_key`, `item_text`, `priority` ou `sort_order`
- a lista dos itens carregados, ordenada por `research_block`, `sort_order` e `item_key`

## 5. Limites

- Não faça nova pesquisa.
- Não gere SQL de carregamento.
- Não altere dados.
- Não gere migration.
- Não altere schema, RLS, policies, triggers, views ou funções.
- Se faltar `taxon_id`, `research_block`, `audience_scope` ou `version`, pare e peça o dado faltante.

## 6. Entrega esperada

Entregue apenas o SQL completo para execução no Supabase SQL Editor.

Use como base o snippet:

`supabase/snippets/e10_5_5_nicho_verificacao.sql`
