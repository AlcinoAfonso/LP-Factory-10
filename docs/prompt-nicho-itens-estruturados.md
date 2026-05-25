# Prompt — Estruturação de itens da pesquisa por nicho/taxon

## 1. Objetivo

Transformar a pesquisa bruta, no mesmo chat da pesquisa profunda, em itens estruturados da pesquisa prontos para `taxon_market_research_items`.

## 2. Contexto disponível

Use como fonte de verdade:

- a entrada confirmada gerada por `docs/prompt-nicho-identificacao.md`
- os resultados da pesquisa bruta já pesquisada neste chat
- as aprovações ou ajustes informados pelo humano durante a pesquisa

## 3. Critérios de sucesso

A estruturação deve:

- manter o mesmo `taxon_id`, `taxon_name`, `taxon_level` e `audience_scope`
- separar os dados por `research_block`
- manter apenas achados aprovados e úteis
- remover duplicidades claras
- entregar dados compatíveis com futura carga
- usar `version = 1`, salvo se houver outra versão informada
- usar `status = draft`, salvo se houver outro status informado

## 4. Limites

Use apenas conteúdo já pesquisado e aprovado neste chat.

Não faça nova pesquisa web.

Não altere taxon, público, ordem ou nome dos `research_blocks`.

Não gere SQL.

Não mantenha `evidência` ou `evidence` como campo final dos itens estruturados.

Quando houver fonte, evidência, inferência, limite ou cuidado relevante, resuma dentro de `notes`.

## 5. Entrega esperada

Entregue uma seção para cada `research_block` consolidado.

Use este formato:

```md
# Itens estruturados da pesquisa

## Registro-pai

taxon_id:
taxon_name:
taxon_level:
research_block:
audience_scope:
version: 1
status: draft

## Itens estruturados

| item_key | item_text | priority | sort_order | notes |
|---|---|---:|---:|---|
|  |  |  |  |  |
```

Itens estruturados prontos para carregamento em `taxon_market_research_items`. Aguarde comando humano para gerar SQL.
