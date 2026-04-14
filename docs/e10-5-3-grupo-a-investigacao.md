# E10.5.3 — Grupo A — Guia operacional de investigação, proposta, carga e validação

## 1. Objetivo

Este documento padroniza o processo manual do Grupo A para evitar drift entre chats.

O Grupo A cobre apenas:

- `business_taxons`
- `business_taxon_aliases`

Este guia existe para orientar:

1. investigação anti-duplicidade com foco operacional no que já existe
2. proposta de novos taxons e aliases
3. formatação canônica da saída aprovada
4. carga via SQL canônico
5. validação pós-carga

Nesta rodada do Grupo A, a investigação inicial existe primeiro para:

1. ver o que já existe
2. não repropor o que já existe
3. evitar duplicidade evidente de slug
4. evitar duplicidade evidente de alias
5. evitar hierarquia claramente incoerente

Ela não precisa virar validação estrutural exaustiva antes da proposta e da aprovação humana.

Nesta etapa, a curadoria de aliases deve ser enxuta e pragmática:

1. evitar inflar aliases para cobrir microvariações meramente textuais
2. não transformar grafias muito próximas, singular/plural óbvio ou pequenas diferenças de escrita em lista extensa de aliases
3. priorizar aliases com valor semântico/comercial real (sigla, termo popular, sinônimo de mercado ou forma comercial realmente distinta)
4. manter coerência com a estratégia documentada de similaridade textual leve no caso de taxonomia (item 51 de `docs/supa-up.md`), sem presumir implementação atual de `pg_trgm`

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

### 3.2 Snippets read-only

- `supabase/snippets/e10_5_3_grupo_a_investigacao_taxons.sql`
- `supabase/snippets/e10_5_3_grupo_a_investigacao_aliases.sql`

### 3.3 Snippet de carga

- `supabase/snippets/e10_5_3_grupo_a_carga.sql`

## 4. Fluxo operacional obrigatório

1. Ler este guia.
2. Rodar `supabase/snippets/e10_5_3_grupo_a_investigacao_taxons.sql`.
3. Rodar `supabase/snippets/e10_5_3_grupo_a_investigacao_aliases.sql`.
4. Verificar de forma prática o que já existe em `business_taxons` e `business_taxon_aliases` (sem auditoria estrutural exaustiva nesta fase).
5. Só depois disso montar a proposta do que falta.
6. Submeter a proposta em formato canônico.
7. Aguardar aprovação humana.
8. Só após aprovação preencher e rodar o SQL de carga.

## 5. Regras fixas do processo

1. Nenhum novo taxon deve ser proposto sem investigação prévia.
2. Nenhum alias deve ser proposto sem verificar colisões e duplicidades evidentes.
3. O SQL final de carga deve sair apenas do lote aprovado.
4. O SQL de carga deve ser idempotente.
5. O processo deve preservar a hierarquia pai-filho por `parent_slug`, evitando incoerência clara.
6. O slug é a chave operacional estável do taxon neste processo.
7. O vínculo de alias deve apontar para o `slug` aprovado do taxon-alvo.
8. O processo deve evitar os dois extremos: permissividade excessiva e rigor excessivo que paralisa a proposta inicial.
9. `ultra_niche` é permitido quando fizer sentido, mas não é obrigatório nesta proposta inicial.
10. A lista de aliases desta rodada deve ser enxuta, priorizando cobertura semântica/comercial real.
11. Não inflar aliases para microvariações textuais (grafias muito próximas, singular/plural óbvio e pequenas diferenças de escrita).
12. O papel de similaridade textual leve documentado no item 51 de `docs/supa-up.md` é compatível com essa curadoria enxuta de aliases, sem afirmar adoção já implementada de `pg_trgm`.

## 6. Prompt de investigação anti-duplicidade

Use o texto abaixo em outro chat operacional quando precisar investigar antes da proposta:

```text
Você vai investigar o Grupo A do E10.5.3.

Escopo:
- business_taxons
- business_taxon_aliases

Objetivo:
- identificar o que já existe
- não repropor o que já existe
- evitar duplicidade evidente de taxons
- evitar colisão evidente de slug
- evitar alias evidentemente redundante
- evitar inflar alias por microvariação textual
- priorizar lacunas semânticas/comerciais reais na proposta de alias
- evitar propor hierarquia claramente incoerente
- apoiar proposta prática do que falta

Tarefas:
1. leia as saídas dos SQLs read-only de investigação (taxons primeiro, aliases depois)
2. liste taxons já existentes que podem conflitar com a proposta
3. liste aliases já existentes que podem conflitar com a proposta
4. aponte possíveis duplicidades por:
   4.1 nome muito próximo
   4.2 slug igual
   4.3 alias_text_normalized igual
   4.4 mesma ideia distribuída em taxons diferentes
5. ao analisar aliases faltantes, separe:
   5.1 aliases semânticos/comerciais relevantes (sigla, termo popular, sinônimo de mercado, forma comercial distinta)
   5.2 microvariações textuais que não justificam novo alias nesta rodada
6. proponha apenas o que realmente parece faltar nesta rodada
7. não gere SQL
8. não transforme esta etapa em auditoria estrutural exaustiva
9. entregue apenas análise e proposta preliminar para aprovação humana
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
6. proponha aliases em lista enxuta, priorizando valor semântico/comercial real
7. não crie alias só para microvariações textuais (grafia muito próxima, singular/plural óbvio, pequenas diferenças de escrita)
8. considere como prioritários aliases de sigla, termo popular, sinônimo de mercado e forma comercial realmente distinta
9. mantenha essa curadoria coerente com a estratégia de similaridade textual leve documentada para taxonomia, sem afirmar implementação atual de `pg_trgm`
10. não gere SQL
11. entregue exatamente no template canônico pedido

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

## 9. Resultado esperado da etapa

Ao final, este caso deve deixar:

1. um guia humano único em `docs/`
2. dois snippets read-only para investigação preliminar (taxons e aliases)
3. um snippet SQL canônico para carga idempotente
