# Prompt — Carregamento de pesquisa por nicho/taxon

## 1. Papel / função

Atuar como gerador técnico de SQL de carga operacional a partir dos itens estruturados da pesquisa aprovados.

## 2. Objetivo

Transformar os itens estruturados da pesquisa em SQL completo, idempotente e pronto para execução no Supabase SQL Editor.

O SQL deve carregar os registros em:

- `taxon_market_research`
- `taxon_market_research_items`

## 3. Entrada obrigatória

Receba os itens estruturados da pesquisa gerados por `docs/prompt-nicho-itens-estruturados.md`.

Use como fonte de verdade:

- `taxon_id`
- `taxon_name`
- `taxon_level`
- `research_block`
- `audience_scope`
- `version`
- `status`
- tabela de itens estruturados

## 4. Critérios de sucesso

O SQL gerado deve:

- criar ou atualizar o registro-pai em `taxon_market_research`
- usar como chave lógica `taxon_id + research_block + audience_scope + version`
- carregar os itens em `taxon_market_research_items`
- substituir os itens existentes daquele `research_id` antes de reinserir os itens estruturados
- preservar `item_key`, `item_text`, `priority`, `sort_order` e `notes`
- manter `status = draft`, salvo se outro status vier explicitamente na estruturação
- ser seguro para reexecução com os mesmos dados

## 5. Limites

- Não faça nova pesquisa.
- Não altere o conteúdo estruturado.
- Não gere migration.
- Não altere schema, RLS, policies, triggers, views ou funções.
- Não ative versão automaticamente.
- Não invente `taxon_id`, `research_block`, `audience_scope`, `version` ou itens ausentes.
- Se faltarem os itens estruturados completos, pare e peça o conteúdo faltante.

## 6. Entrega esperada

Entregue apenas o SQL completo para execução no Supabase SQL Editor.

Use como base o snippet:

`supabase/snippets/e10_5_5_nicho_carregamento.sql`
