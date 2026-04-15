# docs/prompt-abc.md vs1

PROMPT ABC 

ENTRADA

* REPO (GitHub): LP-Factory-10
* REF (GitHub): [main | branch | commit] (se não informado, main)
* DOC_ALVO: [docs/base-tecnica.md | docs/schema.md | docs/roadmap.md]

OBJETIVO
Gerar o **ABC humano** para os docs alvos

VISÃO GERAL (PROMPT ABC) — 3 documentos

• docs/schema.md = contrato do DB (objetos e permissões de banco).
• docs/base-tecnica.md = contrato técnico do runtime (regras de implementação segura).
• docs/roadmap.md = contrato de casos E* (estado final: status/escopo/dependências).

REGRA GLOBAL (anti-redundância)

• 1 assunto = 1 residência:

* DB (tabelas/views/RPCs/RLS/policies/roles/grants) → docs/schema.md
* regras de runtime/integrações/secrets/workflows → docs/base-tecnica.md (ponte mínima)
* estado final por caso (status/escopo/artefatos) → docs/roadmap.md
  • Se existir “contrato dedicado no repo” (ex.: pipelines//README.md), registrar nos docs apenas:
* objetivo em 1 linha + paths + referência ao contrato (não duplicar guardrails/listas).
  • Fora do escopo: qualquer conteúdo não alinhado ao papel do DOC_ALVO acima.

CRITÉRIO BASE TÉCNICA (relevância para IA)

• Só gerar DELTA em `docs/base-tecnica.md` se o conteúdo:

* mudar como a IA deve gerar código correto, OU
* mudar como a IA deve montar um plano de execução seguro/determinístico.
  • Se for apenas “novidade/lançamento” sem adoção/impacto de implementação, não entra na Base Técnica.
  • Se entrar, registrar apenas o mínimo estável necessário (regra/contrato/parâmetro fixo), sem valores voláteis ou narrativa de console.

REGRAS DE LEITURA (FONTE: GitHub)

1. Abrir o DOC_ALVO na fonte indicada:

2) Ler no DOC_ALVO e usar como referência de propósito:

* 0.2.1 TIPO_DO_DOCUMENTO
* 0.2.2 (no doc) GUIA_DE_CONSULTA (o que/como/por que a IA consulta este documento)

ALLOWLIST (PROMPT ABC) — `docs/base-tecnica.md` (CONTRATO_TÉCNICO)

• PERMITIDO (DELTA) — somente regras/contratos técnicos que mudam como implementar com segurança e consistência:

* runtime: rotas/gating/estados/semântica que afetam comportamento do app
* segurança: PII (logs), secrets/keys (higiene, revogação), permissões mínimas
* observability: padrão mínimo de logs estruturados (campos canônicos, correlação) sem dados voláteis
* integrações: parâmetros estáveis necessários para implementação (ex.: nomes de secrets/env, paths, endpoints/hosts/ports/senders quando fixos)
* convenções de repo: estrutura, nomenclatura, workflows e secrets obrigatórios
* decisões arquiteturais estáveis (com condição clara de mudança futura quando aplicável)

• Fora do escopo: qualquer conteúdo não listado em PERMITIDO (DELTA).

ALLOWLIST (PROMPT ABC) — `docs/schema.md` (CONTRATO_DB)

• PERMITIDO (DELTA) — somente itens de contrato do DB derivados de estado final executado/observável (conforme RELATÓRIO do executor):

* objetos de DB: tabelas, colunas, constraints (PK/FK/UNIQUE/CHECK), enums/tipos, relacionamentos
* views
* RPCs/functions
* triggers
* RLS/policies (nomes, roles, USING/WITH CHECK, condições) quando existirem no Supabase
* notas mínimas de validação no Supabase quando necessário (caminho: Database > Tables/Views/Functions/Policies)

• GATE (para permitir DELTA no schema): o RELATÓRIO deve trazer pelo menos 1 evidência de DB executado/observável:

* migration aplicada (identificador citado no RELATÓRIO), ou
* SQL executado que altere schema (resumo no RELATÓRIO), ou
* evidência/print/saída confirmando o objeto no Supabase.

• TBD (permitido com restrição): somente para detalhe faltante de objeto que já existe no Supabase, com caminho de validação.

• Fora do escopo: qualquer conteúdo não listado em PERMITIDO (DELTA).

ALLOWLIST (PROMPT ABC) — `docs/roadmap.md` (CONTRATO_DE_CASOS)

CONVENÇÃO DE TÍTULOS NO ROADMAP

• A letra “E” (ex.: E6.4, E17) aparece apenas no título principal do item/caso.
• Subitens usam apenas a numeração (ex.: 6.5, 6.6, 17.7) e o título, sem repetir “E”.

• PERMITIDO (DELTA) — somente estado final por caso (E*) derivado do RELATÓRIO do executor:

* status do caso (ex.: Briefing / Em desenvolvimento / Concluído (definição) / Concluído (exec)) com data
* escopo final (o que foi implementado/definido) em bullets curtos, sem narrativa
* dependências entre casos (E*), quando mudarem
* artefatos de repo (paths criados/ajustados/removidos) quando forem parte do estado final do caso
* decisões de produto/UX/contrato quando forem parte explícita do caso (implementado/definido)
* pendências apenas quando o RELATÓRIO marcar explicitamente como pendência do caso (não “próximo passo” genérico)

• Fora do escopo: qualquer conteúdo não listado em PERMITIDO (DELTA).

REGRAS DE EXTRAÇÃO (RELATÓRIO → ESTADO FINAL)

3. Extrair do RELATÓRIO apenas o que estiver claramente como **ESTADO FINAL** (IMPLEMENTADO/DEFINIDO).
4. Ignorar: propostas, pendências, hipóteses, “assunções a validar”, sugestões de “próximo passo”.

COMPARAÇÃO (ESTADO FINAL vs DOC_ALVO) → DELTAS PERMITIDOS

5. Comparar o ESTADO FINAL com o conteúdo atual do DOC_ALVO e identificar apenas DELTAS que sejam:

* claramente necessários para refletir o estado final, e
* permitidos pela ALLOWLIST (PROMPT ABC) do DOC_ALVO.

6. Se não houver DELTA permitido: emitir saída “SEM ALTERAÇÕES NECESSÁRIAS” (ver SAÍDA).

GERAÇÃO DO ABC (somente se houver DELTAS PERMITIDOS)

7. Decidir para cada DELTA se vira:

* A) SUBSTITUIR (replace_section): quando o alvo já existe e deve ser trocado.
* B) ADICIONAR (insert_after_section): quando é uma nova seção que não existe.

8. B (ADICIONAR) só pode existir se for possível garantir a âncora:

* a âncora é a seção imediatamente anterior pelo número (mesmo nível),
* verificar no DOC_ALVO que a seção âncora existe;
* se não for possível garantir, NÃO gerar esse B (omitir).

REGRAS DO 99 (CHANGELOG)

9. “99. Changelog” nunca vira A) nem B).
10. C) CHANGELOG só existe se:

* o documento possui “99. Changelog”, e
* houve **alteração real** no documento (ver regra 11).

11. “Alteração real” = existe pelo menos um item em A) ou B) que NÃO seja:

* cabeçalho/versionamento (0.1), e
* qualquer coisa do 99 (que é só C1).

12. Em C1, fornecer **somente a entrada nova** do changelog (não reproduzir entradas antigas).

BUMP (cabeçalho/versionamento)

13. Bump (DATA/VERSÃO) é **derivado**, não gatilho:

* só gerar A de cabeçalho/versionamento (0.1) se houver “alteração real” (regra 11).

14. DATA_NOVA = hoje (America/Sao_Paulo) DD/MM/YYYY
15. VERSAO_NOVA = vX.Y.(Z+1), onde vX.Y.Z é a versão atual do DOC_ALVO.

FORMATO DA SAÍDA (OBRIGATÓRIO; SEM TEXTO EXTRA)

16-A) A resposta deve começar com a primeira linha exatamente:

DD/MM/YYYY HH:MM — ABC (DELTA-ONLY) para <DOC_ALVO>

16. Se não houver DELTAS PERMITIDOS, responder exatamente:

DD/MM/YYYY HH:MM — ABC (DELTA-ONLY) para <DOC_ALVO>
DOC_ALVO: <DOC_ALVO>
SEM ALTERAÇÕES NECESSÁRIAS

17. Se houver DELTAS PERMITIDOS, responder somente no formato abaixo (sem comentários, sem OK, sem diagnóstico):

DD/MM/YYYY HH:MM — ABC (DELTA-ONLY) para <DOC_ALVO>
DOC_ALVO: <DOC_ALVO>
VERSAO_NOVA: <vX.Y.Z>
DATA_NOVA: <DD/MM/YYYY>

A) SUBSTITUIR
A1) SUBSTITUIR — Seção ** <título>** (bloco completo)
<bloco literal da seção, começando pela linha do heading " <título>" (sem reticências)>

A2) SUBSTITUIR — Seção ** <título>** (bloco completo)
<bloco literal da seção, começando pela linha do heading " <título>" (sem reticências)>

B) ADICIONAR
B1) ADICIONAR — Após **<âncora imediata anterior>** (bloco completo)
<bloco literal da nova seção, começando pela linha do heading " <título>" (sem reticências)>

C) CHANGELOG
C1) (entrada nova)
<bloco literal da entrada nova do changelog (sem reproduzir entradas antigas)>

REGRAS DE COMPATIBILIDADE COM O PROMPT C (EVITAR INVALIDAÇÃO)

18. Nunca usar “...” ou “…” em nenhuma linha dos blocos.
19. Em A/B, cada bloco deve começar pelo número da seção (ex.: "0.2.2 <título>", "5.2.1 <título>"), sem reticências.
20. Preservar bullets/whitespace e quebras de linha dentro dos blocos.

PAUSA OBRIGATÓRIA (1 doc por execução)

21. Execute o ciclo completo **somente para o DOC_ALVO atual** (ler doc no zip → aplicar 0.2 → comparar com relatório → gerar ABC ou “SEM ALTERAÇÕES NECESSÁRIAS”).
22. **Depois de emitir a saída**, pare e **aguarde** o comando do humano com o próximo `DOC_ALVO` (ex.: `PRÓXIMO DOC: docs/schema.md`).
23. Não gerar ABC de outro documento na mesma execução.

---
