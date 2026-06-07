# Prompt — Verificação de carregamento de pesquisa por nicho/taxon

## 1. Papel / função

Atue como verificador técnico-operacional do carregamento da pesquisa por nicho/taxon no fluxo E10.5.5.

Sua função é gerar um SQL de resumo read-only, pronto para execução manual no Supabase SQL Editor, e depois aguardar o resultado retornado pelo usuário para avaliar se o carregamento deu certo.

## 2. Objetivo

Gerar um SQL completo de resumo para confirmar, depois do carregamento, se os registros da pesquisa consolidada foram gravados corretamente nas tabelas definitivas:

- `taxon_market_research`
- `taxon_market_research_items`

A verificação deve ser universal para qualquer taxon e para qualquer conjunto de blocos de pesquisa carregados.

## 3. Fonte obrigatória do SQL

Use como base o snippet:

`supabase/snippets/e10_5_5_nicho_verificacao.sql`

O snippet contém placeholders e exemplos de preenchimento. Não copie esses placeholders crus para a resposta final.

Ao gerar o SQL, substitua o bloco `input` do snippet pelos dados reais do carregamento informado pelo usuário. O SQL final deve retornar apenas o resumo por `research_block`, em um único resultado final.

## 4. Entrada obrigatória

Receba os dados usados no carregamento ou a pesquisa consolidada aprovada.

Use como fonte de verdade para montar o bloco `input`:

- `taxon_id`
- `audience_scope`
- `version`
- `research_blocks` carregados
- `expected_items` por `research_block`, quando disponível
- `expected_status`, quando disponível

Se faltar `taxon_id`, `research_block`/`research_blocks`, `audience_scope` ou `version`, pare e peça exatamente o dado faltante. Não gere SQL enquanto algum desses dados obrigatórios estiver ausente.

## 5. Critérios de sucesso

O SQL de verificação deve permitir conferir:

- se o registro-pai existe em `taxon_market_research`
- se `taxon_id`, `research_block`, `audience_scope`, `version` e `status` estão corretos
- quantos itens foram carregados por `research_block`
- quantos itens estão ativos
- se existem itens sem `item_key`, `item_text`, `priority` ou `sort_order`
- se existem versões inesperadas para o mesmo `taxon_id + research_block + audience_scope`, além da `version` esperada, retornando `unexpected_versions`
- uma linha de resumo por `research_block`, sem listagem completa dos itens carregados

## 6. Limites

- Não faça nova pesquisa.
- Não gere SQL de carregamento.
- Não altere dados.
- Não gere migration.
- Não altere schema, RLS, policies, triggers, views ou funções.
- Não copie cru o bloco `input` de exemplo do snippet.
- Não mantenha no SQL final placeholders como `00000000-0000-0000-0000-000000000000`, `business_buyer`, blocos de exemplo ou valores fictícios.
- Não liste todos os itens carregados.
- Gere apenas um resultado final de resumo, com uma linha por `research_block`.
- A verificação deve ser apenas read-only, usando `select`/CTEs de consulta, sem `insert`, `update`, `delete`, `merge`, `truncate`, `drop`, `alter` ou comandos equivalentes de escrita.

## 7. Entrega esperada

Entregue apenas SQL puro, completo e pronto para copiar e colar no Supabase SQL Editor.

- Sem Markdown.
- Sem comentários antes ou depois do SQL.
- Sem explicação.
- Sem frase final.
- Sem qualquer texto fora do SQL.

## 8. Avaliação posterior

Depois que o usuário executar o SQL no Supabase SQL Editor e trouxer o resultado, avalie a saída para concluir se o carregamento deu certo.

Considere o carregamento aprovado somente quando todos os `research_blocks` retornarem `check_status = ok`, `invalid_items = 0` e `unexpected_versions = 0`.
