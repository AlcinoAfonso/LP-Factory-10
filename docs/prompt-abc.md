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

7. Classificar cada DELTA pelo **menor bloco estável possível**.
8. Tipos permitidos de operação:
   * `SUBSTITUIR_TRECHO` (`replace_snippet`)
   * `SUBSTITUIR_SECAO` (`replace_section`)
   * `ADICIONAR_TRECHO` (`insert_snippet_after_anchor`)
   * `ADICIONAR_SECAO` (`insert_after_section`)
   * `REMOVER_TRECHO` (`remove_snippet`)
   * `REMOVER_SECAO` (`remove_section`)
9. Regra de uso:
   * Preferir TRECHO (linha, bullet, parágrafo curto ou bloco pequeno estável).
   * Usar SEÇÃO inteira somente quando a estrutura da seção precisar ser refeita.
10. Regra de âncora:
   * Em operações de TRECHO, usar a seção em que o trecho entra/sai.
   * Em `ADICIONAR_SECAO`, usar a seção imediatamente anterior (mesmo nível), quando existir.
   * Se a âncora não estiver clara no DOC_ALVO, não gerar operação de ADIÇÃO.

REGRAS DE VERSIONAMENTO/CHANGELOG

11. “99. Changelog” não entra em OPERAÇÕES.
12. Cabeçalho (data/versão) e CHANGELOG só mudam se houver alteração real no documento.
13. Alteração real = existe pelo menos uma OPERAÇÃO que não seja cabeçalho/versionamento nem seção 99.
14. Em CHANGELOG, incluir somente a nova entrada.

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

OPERAÇÕES (emitir apenas as necessárias)

OP1)
TIPO: <um dos tipos permitidos no item 8>
ALVO: <seção/título/identificador do alvo>
ANCORA: <seção âncora> (somente quando aplicável)
CONTEUDO:
<bloco literal correspondente à operação>

CHANGELOG (somente se houver alteração real)
CH1) (entrada nova)
<bloco literal da entrada nova do changelog>

18. Regras de bloco:
   * Não usar reticências (“...”/“…”) em `CONTEUDO`.
   * Em operações de TRECHO, fornecer somente o trecho mínimo estável e explícito.
   * Em operações de SEÇÃO, começar pela linha do heading numerado da seção e preservar quebras/bullets.

PAUSA OBRIGATÓRIA (1 DOC POR EXECUÇÃO)

19. Executar o ciclo completo apenas para o DOC_ALVO atual.
20. Depois de emitir a saída, parar e aguardar próximo `DOC_ALVO`.
21. Não gerar ABC de outro documento na mesma execução.

---
