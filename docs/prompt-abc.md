# docs/prompt-abc.md vs1

PROMPT ABC

ENTRADA

* REPO (GitHub): LP-Factory-10
* REF (GitHub): [main | branch | commit] (se não informado, main)
* DOC_ALVO: [docs/base-tecnica.md | docs/schema.md | docs/roadmap.md]

OBJETIVO
Gerar o **ABC humano** para o DOC_ALVO.

VISÃO GERAL (RESIDÊNCIA DO CONTEÚDO)

* `docs/schema.md` = contrato de banco (objetos e permissões de DB).
* `docs/base-tecnica.md` = contrato técnico de runtime (regras de implementação segura).
* `docs/roadmap.md` = estado final dos casos E* (status/escopo/dependências/artefatos).

REGRA GLOBAL (ANTI-INFLAÇÃO)

* 1 assunto = 1 residência.
* Não duplicar guardrails/listas já cobertos por contrato dedicado do repo; nos docs manter só: objetivo em 1 linha + paths + referência.
* Tudo fora da residência do DOC_ALVO está fora de escopo.

CRITÉRIO BASE TÉCNICA (RELEVÂNCIA PARA IA)

* Só gerar DELTA em `docs/base-tecnica.md` se mudar:
  * como a IA deve gerar código correto, ou
  * como a IA deve montar plano de execução seguro/determinístico.
* Novidade sem impacto de implementação não entra.
* Quando entrar, registrar só regra/contrato/parâmetro estável (sem narrativa de console e sem voláteis).

REGRAS DE LEITURA

1. Abrir o DOC_ALVO na fonte indicada.
2. Ler no DOC_ALVO:
   * `0.2.1 TIPO_DO_DOCUMENTO`
   * `0.2.2 GUIA_DE_CONSULTA`

ALLOWLIST — `docs/base-tecnica.md` (CONTRATO_TÉCNICO)

* PERMITIDO (DELTA): runtime, segurança (PII/secrets/permissão mínima), observability mínima estável, integrações com parâmetros fixos, convenções obrigatórias de repo, decisões arquiteturais estáveis.
* Fora do escopo: qualquer item fora dessa lista.

ALLOWLIST — `docs/schema.md` (CONTRATO_DB)

* PERMITIDO (DELTA): tabelas/colunas/constraints/enums/relacionamentos, views, RPCs/functions, triggers, RLS/policies, notas mínimas de validação no Supabase.
* GATE obrigatório: o RELATÓRIO precisa trazer evidência de DB executado/observável (migration aplicada, SQL que altere schema, ou confirmação no Supabase).
* TBD só para detalhe faltante de objeto já existente no Supabase, com caminho de validação.
* Fora do escopo: qualquer item fora dessa lista.

ALLOWLIST — `docs/roadmap.md` (CONTRATO_DE_CASOS)

* Convenção: “E” só no título principal do caso; subitens sem repetir “E”.
* PERMITIDO (DELTA): status com data, escopo final em bullets curtos, dependências entre casos E*, artefatos de repo, decisões explícitas do caso, pendências marcadas explicitamente no RELATÓRIO.
* Fora do escopo: qualquer item fora dessa lista.

REGRAS DE EXTRAÇÃO (RELATÓRIO → ESTADO FINAL)

3. Extrair apenas o que estiver claramente como **ESTADO FINAL** (IMPLEMENTADO/DEFINIDO).
4. Ignorar propostas, hipóteses, assunções a validar e “próximo passo”.

COMPARAÇÃO (ESTADO FINAL vs DOC_ALVO)

5. Identificar apenas DELTAS que sejam necessários para refletir o estado final e permitidos pela allowlist do DOC_ALVO.
6. Se não houver DELTA permitido: saída **SEM ALTERAÇÕES NECESSÁRIAS**.

GERAÇÃO DO ABC (DELTA-ONLY)

7. Classificar cada DELTA como:
   * A) SUBSTITUIR TRECHO (`replace_snippet`) para mudança localizada (1 linha, 1 bullet, parágrafo curto ou bloco pequeno estável dentro de seção existente).
   * B) SUBSTITUIR SEÇÃO (`replace_section`) somente quando a mudança exigir refazer a estrutura da seção (ex.: múltiplos bullets/partes interdependentes).
   * C) ADICIONAR TRECHO (`insert_snippet_after_anchor`) para inserir bloco pequeno dentro de seção existente.
   * D) ADICIONAR SEÇÃO (`insert_after_section`) somente quando a seção ainda não existe.
   * E) REMOVER TRECHO (`remove_snippet`) ou REMOVER SEÇÃO (`remove_section`) quando houver remoção explícita de conteúdo obsoleto.
8. Regra principal de granularidade: sempre preferir o menor bloco estável que resolva o DELTA com clareza (priorizar TRECHO; usar SEÇÃO inteira apenas quando TRECHO não for suficiente).
9. Regra de âncora:
   * Para TRECHO (A/C/E de trecho): usar como âncora a seção em que o trecho entra/sai.
   * Para SEÇÃO nova (D): usar a seção imediatamente anterior (mesmo nível), quando existir.
   * Se a âncora não estiver clara no DOC_ALVO, não gerar ADICIONAR.

REGRAS DE VERSIONAMENTO/CHANGELOG

10. “99. Changelog” não entra em A/B/C/D/E.
11. F) CHANGELOG só existe se houver alteração real no documento.
12. Alteração real = existe pelo menos um item em A/B/C/D/E que não seja cabeçalho/versionamento nem seção 99.
13. Cabeçalho (data/versão) só muda se houver alteração real.
14. Em F1, incluir somente a nova entrada do changelog.

FORMATO DA SAÍDA (OBRIGATÓRIO; SEM TEXTO EXTRA)

15. A resposta deve começar exatamente com:

DD/MM/YYYY HH:MM — ABC (DELTA-ONLY) para <DOC_ALVO>

16. Sem DELTAS permitidos:

DD/MM/YYYY HH:MM — ABC (DELTA-ONLY) para <DOC_ALVO>
DOC_ALVO: <DOC_ALVO>
SEM ALTERAÇÕES NECESSÁRIAS

17. Com DELTAS permitidos:

DD/MM/YYYY HH:MM — ABC (DELTA-ONLY) para <DOC_ALVO>
DOC_ALVO: <DOC_ALVO>
VERSAO_NOVA: <vX.Y.Z>
DATA_NOVA: <DD/MM/YYYY>

Ordem sugerida: A, B, C, D, E, F (emitir apenas os blocos necessários).

A) SUBSTITUIR TRECHO
A1) SUBSTITUIR TRECHO — Seção **<título-da-seção-âncora>**
<trecho literal mínimo a substituir>

B) SUBSTITUIR SEÇÃO
B1) SUBSTITUIR SEÇÃO — Seção **<título>** (bloco completo)
<bloco literal da seção, começando pela linha do heading "<título>">

C) ADICIONAR TRECHO
C1) ADICIONAR TRECHO — Seção **<título-da-seção-âncora>**
<trecho literal mínimo a inserir>

D) ADICIONAR SEÇÃO
D1) ADICIONAR SEÇÃO — Após **<âncora>** (bloco completo)
<bloco literal da nova seção, começando pela linha do heading "<título>">

E) REMOVER
E1) REMOVER TRECHO — Seção **<título-da-seção-âncora>**
<trecho literal mínimo a remover>
ou
E2) REMOVER SEÇÃO — Seção **<título>**
<título/identificador literal da seção a remover>

F) CHANGELOG
F1) (entrada nova)
<bloco literal da entrada nova do changelog>

18. Não usar reticências (“...”/“…”) nos blocos. Em operações de TRECHO, fornecer somente o trecho mínimo estável e explícito; em operações de SEÇÃO, começar pela linha do heading numerado da seção e preservar quebras/bullets.

PAUSA OBRIGATÓRIA (1 DOC POR EXECUÇÃO)

19. Executar o ciclo completo apenas para o DOC_ALVO atual.
20. Depois de emitir a saída, parar e aguardar próximo `DOC_ALVO`.
21. Não gerar ABC de outro documento na mesma execução.

---
