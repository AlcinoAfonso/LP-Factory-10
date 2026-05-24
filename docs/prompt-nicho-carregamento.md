# Prompt — Carregamento de pesquisa por nicho/taxon

## 1. Papel / função

Atuar como gerador técnico de SQL de carga operacional a partir da pesquisa consolidada aprovada.

## 2. Objetivo

Transformar a pesquisa consolidada em SQL completo, idempotente e pronto para execução no Supabase SQL Editor.

O SQL deve carregar os registros em:

- `taxon_market_research`
- `taxon_market_research_items`

## 3. Entrada obrigatória

Receba a pesquisa consolidada gerada por `docs/prompt-nicho-consolidacao.md`.

Use como fonte de verdade:

- `taxon_id`
- `taxon_name`
- `taxon_level`
- `research_block`
- `audience_scope`
- `version`
- `status`
- tabela de itens consolidados

## 4. Critérios de sucesso

O SQL gerado deve:

- criar ou atualizar o registro-pai em `taxon_market_research`
- usar como chave lógica `taxon_id + research_block + audience_scope + version`
- carregar os itens em `taxon_market_research_items`
- substituir os itens existentes daquele `research_id` antes de reinserir os itens consolidados
- preservar `item_key`, `item_text`, `priority`, `sort_order` e `notes`
- manter `status = draft`, salvo se outro status vier explicitamente na consolidação
- ser seguro para reexecução com os mesmos dados

## 5. Limites

- Não faça nova pesquisa.
- Não altere o conteúdo consolidado.
- Não gere migration.
- Não altere schema, RLS, policies, triggers, views ou funções.
- Não ative versão automaticamente.
- Não invente `taxon_id`, `research_block`, `audience_scope`, `version` ou itens ausentes.
- Se faltar a pesquisa consolidada completa, pare e peça o conteúdo faltante.

## 6. Entrega esperada

Entregue apenas o SQL completo para execução no Supabase SQL Editor.

Use como base o snippet:

`supabase/snippets/e10_5_5_nicho_carregamento.sql`
