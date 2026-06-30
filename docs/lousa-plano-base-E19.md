29/06/2026 — Plano-base E19
Fontes: chat, docs/prompt-estrategista.md, docs/roadmap.md, docs/base-tecnica.md, docs/schema.md

Path:
docs/lousa-plano-base-E19.md

E19 — LP Builder MVP

1. Estado e decisões fixas

* Seção afetada do roadmap: E19 — LP Builder.
* Problema: a E9 Fase 5 precisa de um ponto produtivo real de criação de LP onde aplicar o gate comercial.
* Resultado esperado: definir o primeiro recorte funcional mínimo da E19.
* Usuário: owner/admin autenticado de uma conta.
* E9 fornece o sinal comercial server-side.
* E19 consome o sinal da E9 no ponto real de criação produtiva.
* E18 é referência para templates, módulos, composições e artefatos, mas não cria LP produtiva por conta.
* E10.7 não cria LP produtiva por conta e não libera E9 Fase 5.
* Não envolve automação, agente, job, rotina, monitoramento ou execução recorrente.

2. Contrato do caso

* Gatilho: usuário autenticado solicita criar uma LP produtiva mínima para uma conta.
* Entrada: conta alvo, usuário autenticado, dados mínimos da LP e contexto comercial da E9.
* Processamento: resolver conta, validar vínculo, validar conta active, validar membership active, consultar entitlement E9 e executar mutação se permitido.
* Validação obrigatória: conta active + membership active + entitlement comercial válido.
* Persistência: ainda a definir; avaliar persistência mínima própria para LP por conta.
* Consumo: LP criada passa a existir como recurso produtivo da conta.
* Fallback: sem entitlement válido, bloquear server-side, não criar LP e retornar estado controlado de bloqueio comercial.
* Frontend: não definido nesta fase; não assumir editor visual nem superfície final antes da avaliação estrutural.
* Path real da mutação: ainda não definido; deve ser proposto e validado antes de implementação.

3. Fases e próxima ação

* Fase 1 — Definição da criação produtiva mínima de LP por conta

  * Status: consolidada.
  * Objetivo: validar recorte, persistência mínima, boundary, relação com E9, E18 e E10.7.
  * Resultado: aprovado com condicionantes por Analista, Gestor Estrutural e Gestor de Updates.
* Fase 2 — Desenho técnico mínimo da criação produtiva de LP por conta

  * Status: consolidada.
  * Objetivo: definir estrutura mínima para criação produtiva de LP por conta, sem implementação, fechando persistência, contrato, boundary, path canônico e ponto de aplicação do gate E9.
  * Decisões consolidadas:
    * LP produtiva mínima: registro real de landing page pertencente a uma conta, criada com status draft.
    * Criar LP não significa publicar LP.
    * Persistência mínima proposta: tabela account_landing_pages.
    * Campos mínimos: id, account_id, name, slug, status, created_by, created_at e updated_at.
    * Restrição mínima: slug único por account_id.
    * Status inicial: draft.
    * Boundary técnico: lib/lp-builder/.
    * Mutação server-side: path canônico a definir na implementação, fora de app/a/[account] como path canônico.
    * app/a/[account] pode ser superfície contextual futura, mas não mutação canônica da E19.
    * Gate E9: bloquear server-side antes da persistência quando não houver conta active, membership active e entitlement comercial válido.
    * E18: referência futura para templates, módulos, composições e artefatos.
    * content_artifacts não deve ser usado diretamente como LP produtiva por conta neste primeiro recorte.
  * Próxima ação: instruir o Executor para implementar a Fase 3 — Implementação do primeiro recorte.
* Fase 3 — Implementação do primeiro recorte

  * Status: implementada em PR; depende validação humana de Supabase linked/dry-run no ambiente vinculado.
  * Objetivo: implementar criação produtiva mínima de LP por conta.
  * Condição de entrada: Fase 2 consolidada e instrução ao Executor emitida.
  * Arquivos criados:
    * `supabase/migrations/20260630210213_e19_account_landing_pages.sql`
    * `supabase/snippets/e19_account_landing_pages_verify.sql`
    * `lib/lp-builder/contracts.ts`
    * `lib/lp-builder/adapters/landingPagesAdapter.ts`
    * `lib/lp-builder/index.ts`
    * `app/lp-builder/actions.ts`
  * Recorte implementado: tabela mínima `public.account_landing_pages`, RLS, grants explícitos, snippet read-only, boundary E19, action server-side canônica fora de `app/a/[account]` e gate E9 antes da persistência via `lib/commercial-entitlements/`.
  * Validações executadas:
    * `npm ci`: executado.
    * `npm run check`: executado com sucesso; lint sem erros e typecheck concluído.
    * `supabase migration list --linked`: não executado com sucesso; bloqueado por worktree sem project ref.
    * `supabase db push --linked --dry-run`: não executado com sucesso; bloqueado por worktree sem project ref.
  * Pendência: executar validação Supabase linked/dry-run em ambiente vinculado antes do merge/aplicação.
* Avaliações necessárias:

  * Analista: avaliar Fase 2 após registro.
  * Gestor Estrutural: já avaliou a proposta prévia; retorna se houver mudança estrutural.
  * Gestor de Updates: avaliar Fase 2 após registro.
  * Gestor de Automação: N/A.

4. Escopo negativo e critérios de parada

* Não implementar LP Builder agora.
* Não implementar E9 Fase 5 agora.
* Não criar editor visual.
* Não criar drag and drop.
* Não criar biblioteca extensa de seções.
* Não criar múltiplos templates.
* Não criar publicação avançada.
* Não criar versionamento completo.
* Não criar domínio customizado.
* Não criar analytics.
* Não criar A/B test.
* Não usar IA em runtime.
* Não criar automações.
* Não duplicar regra comercial da E9.
* Não usar Stripe diretamente como fonte de liberação.
* Não aplicar gate apenas na UI.
* Parar se a execução exigir endpoint artificial sem caso real de produto.
* Parar se a persistência exigir schema novo sem avaliação estrutural prévia.
