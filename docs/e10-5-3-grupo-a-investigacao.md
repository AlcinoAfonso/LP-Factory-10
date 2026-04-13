# E10.5.3 — Grupo A — Guia operacional de investigação, proposta, carga e validação

## 1. Objetivo

Este documento padroniza o processo manual do Grupo A para evitar drift entre chats.

O Grupo A cobre apenas:

- `business_taxons`
- `business_taxon_aliases`

Este guia existe para orientar:

1. investigação anti-duplicidade
2. proposta de novos taxons e aliases
3. formatação canônica da saída aprovada
4. carga via SQL canônico
5. validação pós-carga

## 2. Fora do escopo

Não entram neste processo:

- `account_taxonomy`
- templates comerciais
- base estratégica por taxon
- classificação automática do nicho
- runtime do E10.5
- migrations
- mudanças estruturais de BD

## 3. Arquivos operacionais da etapa

### 3.1 Guia humano

- `docs/e10-5-3-grupo-a-investigacao.md`

### 3.2 Snippet read-only

- `supabase/snippets/e10_5_3_grupo_a_investigacao_validacao.sql`

### 3.3 Snippet de carga

- `supabase/snippets/e10_5_3_grupo_a_carga.sql`

## 4. Fluxo operacional obrigatório

1. Ler este guia.
2. Rodar o snippet read-only de investigação.
3. Verificar o que já existe em `business_taxons` e `business_taxon_aliases`.
4. Só depois disso montar a proposta.
5. Submeter a proposta em formato canônico.
6. Aguardar aprovação humana.
7. Só após aprovação preencher e rodar o SQL de carga.
8. Rodar a validação pós-carga.
9. Confirmar se o lote carregado bate com o lote aprovado.

## 5. Regras fixas do processo

1. Nenhum novo taxon deve ser proposto sem investigação prévia.
2. Nenhum alias deve ser proposto sem verificar colisões e duplicidades.
3. O SQL final de carga deve sair apenas do lote aprovado.
4. O SQL de carga deve ser idempotente.
5. O processo deve preservar a hierarquia pai-filho por `parent_slug`.
6. O slug é a chave operacional estável do taxon neste processo.
7. O vínculo de alias deve apontar para o `slug` aprovado do taxon-alvo.

## 6. Prompt de investigação anti-duplicidade

Use o texto abaixo em outro chat operacional quando precisar investigar antes da proposta:

```text
Você vai investigar o Grupo A do E10.5.3.

Escopo:
- business_taxons
- business_taxon_aliases

Objetivo:
- identificar o que já existe
- evitar duplicidade de taxons
- evitar colisão de slug
- evitar alias redundante
- evitar propor hierarquia incoerente

Tarefas:
1. leia a saída do SQL read-only de investigação
2. liste taxons já existentes que podem conflitar com a proposta
3. liste aliases já existentes que podem conflitar com a proposta
4. aponte possíveis duplicidades por:
   4.1 nome muito próximo
   4.2 slug igual
   4.3 alias_text_normalized igual
   4.4 mesma ideia distribuída em taxons diferentes
5. proponha apenas o que realmente parece faltar
6. não gere SQL
7. entregue apenas análise e proposta preliminar
```

## 7. Prompt de proposta

Use o texto abaixo no chat que vai preparar novos dados:

```text
Você vai propor novos dados do Grupo A do E10.5.3.

Escopo:
- business_taxons
- business_taxon_aliases

Regras:
1. use a investigação prévia como base
2. não repita taxons já existentes
3. não repita aliases já existentes
4. respeite a hierarquia:
   4.1 segment
   4.2 niche
   4.3 ultra_niche
5. use slug estável e legível
6. não gere SQL
7. entregue exatamente no template canônico pedido

Saída esperada:
- taxons propostos
- aliases propostos
- justificativas curtas
- observações de risco ou ambiguidade
```

## 8. Template canônico de saída

Copiar e preencher exatamente neste formato:

```md
## Taxons propostos

| level | name | slug | parent_slug | justificativa_curta |
|---|---|---|---|---|
| segment |  |  |  |  |
| niche |  |  |  |  |
| ultra_niche |  |  |  |  |

## Aliases propostos

| target_slug | alias_text | justificativa_curta |
|---|---|---|
|  |  |  |

## Observações

- [listar ambiguidades, riscos ou dependências]
```

## 9. Checklist de validação pós-carga

Após rodar a carga, conferir:

1. os taxons esperados existem
2. os níveis estão corretos
3. os `parent_slug` esperados batem com a hierarquia real
4. os aliases esperados existem
5. não houve duplicidade operacional inesperada
6. o lote carregado corresponde ao lote aprovado
7. não entrou item fora do lote aprovado por engano
8. o processo continua reaplicável sem drift

## 10. Resultado esperado da etapa

Ao final, este caso deve deixar:

1. um guia humano único em `docs/`
2. um snippet read-only para investigar e validar
3. um snippet SQL canônico para carga idempotente
