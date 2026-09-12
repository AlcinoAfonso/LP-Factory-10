12/09/2026 — Plano-base v2 — E21.4.6 — Transição para histórico legado

## 1. Estado e fonte canônica

- Estado: V2 técnica consolidada para avaliação; V1 funcional preservada no commit `0e7b381f0cf33f878a00c98caa989e3b0385b5c5`, blob `3bce1144f52cec9e90079d319b3cd478e470a6a7`.
- Caso macro: `E21 — Gestão e governança dos workloads OpenAI`.
- Recorte: `E21.4.6 — Transição para histórico legado`.
- Plano: `PB 2 — Transição da E21.4`.
- Classificação de execução: Complexa.
- Supervisão: Autônomo.
- Plano conceitual: N/A.
- Fonte canônica: `Debate 10 — Controle de custos OpenAI por workload e conta — LP Factory 10`, seção `4.2. PB 2 — Transição da E21.4 — V1 aprovada`.
- Documento de origem: `https://docs.google.com/document/d/1CsT5NJ8E0JrXBiG_gumH91BxcGHpHi7kBQtimylrClg`.
- Revisão lida na materialização: `ANLCKQmckVTNl9jgl_EslpfkYDfzo--kW_9QHW3M0g5yvEUkN3rT_Hfz-pMmvZF_65YIFezoiDixyC1FpAPXWiN5zJ-fBky7M0M_0bp3nqU`.

## 2. Contrato funcional aprovado

### 2.1. Problema

- A E21.4 preserva capacidades financeiras comprovadas, mas seu modelo de atribuição foi construído para Landing Pages e não deve ser ampliado como base do novo controle transversal.

### 2.2. Resultado funcional

- Preservar gasto oficial, histórico legado e demais comportamentos úteis comprovados da E21.4, reaproveitando somente componentes compatíveis e retirando responsabilidades do caminho ativo apenas depois que E21.5 provar equivalência ou superioridade funcional.

### 2.3. Comportamento esperado

- Manter história e leitura legada íntegras.
- Distinguir claramente histórico e controle ativo.
- Evitar dupla autoridade e dupla contagem.
- Permitir que E21.5 opere sem depender do modelo LP-específico.

### 2.4. Atores

- `platform_admin` como consumidor administrativo da leitura financeira.
- Fluxo técnico autônomo como responsável pela transição controlada.

### 2.5. Dependência e automação

- Dependência: PB 1 — E21.5 para qualquer retirada ou redistribuição de responsabilidade substituída.
- Automação: não aplicável; trata-se de transição única e controlada.
- Como não existe possibilidade material de automação no PB 2, o Gestor de Automações não é acionado.

## 3. Posição e fase planejada

- Posição planejada no roadmap: preservar E21.4 como recorte histórico existente e acrescentar `E21.4.6 — Transição para histórico legado`.
- `E21.4.6 Transição para histórico legado`, incluindo reconciliação da autoridade ativa e preservação funcional item a item.

## 4. Critérios de aceite

- Nenhum comportamento útil comprovado desaparece antes de substituição equivalente ou superior.
- Histórico legado continua consultável e identificável.
- E21.5 não depende do modelo LP-específico para operar.
- Não há dupla autoridade ativa nem dupla contagem.
- `/admin/custos-openai` permanece uma única superfície financeira.
- Documentação e roadmap deixam clara a nova autoridade sem apagar o histórico.

## 5. Evidências esperadas

- Matriz item a item do contrato E21.4 classifica `preservar`, `reutilizar`, `substituir` ou `retirar`, com evidência correspondente.
- Leitura do histórico legado permanece íntegra.
- Controle ativo e consulta administrativa funcionam pela E21.5 sem depender do write-side ou read model LP-específicos.

## 6. Limites e escopo negativo

- Não amplia a E21.4.
- Não apaga ou reclassifica histórico.
- Não cria novo produtor legado.
- Não remove comportamento antes de prova de equivalência ou superioridade.
- Preserva a leitura oficial do gasto organizacional e suas proteções.
- Preserva a série histórica congelada de Landing Pages e seu caráter somente leitura e append-only.
- Não cria backfill nem novo produtor legado.
- Preserva a distinção entre histórico legado e controle ativo.
- Preserva acesso administrativo seguro e sob demanda.
- Nenhum evento histórico é apagado, reescrito ou reclassificado retroativamente.
- A E21.4 não se torna o novo contrato transversal.

## 7. Checkpoint da V1

- V1 congelada em commit próprio antes da derivação técnica e da avaliação especializada.
- Gestor Estrutural e Gestor de Updates conduzidos sobre o mesmo blob congelado.
- Registrar `Gestor de Automações: N/A — avaliação formal dispensada na V1`.

## 8. Dependência satisfeita e autoridade de transição

- O supervisor competente confirmou a conclusão do PB 1 — E21.5 após os merges dos PRs `#921` e `#922`, validações pós-merge, QA autenticado positivo e negativo e leitura final do ledger sem `INVALID_RESPONSE`.
- O merge `c70675fb6b59e384c66719f9161718a8cc385425` incorpora o PR `#921`; o merge `bd32c5759ec1c7c8d5d3f5bbdd35e2f524a8d2f1` incorpora a correção numérica do PR `#922`.
- O recibo do supervisor é o gate funcional que autoriza retirar a capacidade residual de escrita E21.4. A migration deste plano atua somente sobre objetos E21.4 já aplicados e não cria dependência SQL dos objetos E21.5.
- O ledger, recorder, pricing, read model e projeção administrativa ativos pertencem à E21.5. A Costs API continua autoridade do total organizacional e a série `openai_lp_*` continua exclusivamente histórica.
- Runs, checks, statuses e logs remotos são evidência suplementar e expiráveis; seus resultados materiais devem permanecer registrados de forma sanitizada no PR, nos commits e nos documentos canônicos competentes.

## 9. Derivação técnica mínima

### 9.1. Boundary e responsabilidades preservadas

- Manter a solução no boundary transversal existente `lib/openai-costs/`; não criar domínio, provider, rota, superfície administrativa ou adapter adicional.
- Preservar sem alteração o provider server-only da Costs API, contratos sanitizados, aritmética decimal, guard administrativo e consulta sob demanda.
- Preservar `lib/openai-costs/adapters/lpCostReadModelAdapter.ts` e seu core como read-side exclusivo do histórico E21.4.
- Preservar o ledger, recorder, pricing, adapters e read model ativos E21.5 sem referência aos objetos `openai_lp_*`.
- Preservar `dashboard.ts`, a Server Action e `/admin/custos-openai` com leitura paralela do total oficial, do subtotal ativo e do histórico legado; a reconciliação global continua `total oficial - ativo calculável - histórico legado`, sem clamp.
- Não alterar UI, provider, recorder, pricing, adapters, composição financeira ou filtros neste plano.

### 9.2. Congelamento forward-only do histórico E21.4

- Criar por `supabase migration new e21_4_6_freeze_openai_lp_cost_history` uma migration incremental em `supabase/migrations/<timestamp>_e21_4_6_freeze_openai_lp_cost_history.sql`.
- Revogar de `service_role` `INSERT`, `UPDATE`, `DELETE` e `TRUNCATE` em `public.openai_lp_cost_events` e `public.openai_lp_cost_coverage`.
- Revogar de `service_role` `EXECUTE` em:
  - `public.append_openai_lp_cost_start_v1(uuid, uuid, uuid, text, text, text, text, text, text, text, text)`;
  - `public.append_openai_lp_cost_terminal_v1(uuid, text, text, jsonb, jsonb, numeric, integer, text, text)`;
  - `public.register_openai_lp_cost_coverage_v1(timestamptz)`.
- Reafirmar a ausência desses privilégios para `PUBLIC`, `anon`, `authenticated` e, quando o papel existir, `ai_readonly`.
- Preservar `SELECT` de `service_role` nas duas tabelas e `EXECUTE` de `service_role` em `public.read_openai_lp_cost_events_v1(timestamptz, timestamptz)`.
- Preservar tabelas, linhas, corte, constraints, índices, RLS, zero policies, triggers, funções, assinaturas e a migration E21.4.4 aplicada. As RPCs históricas de escrita permanecem definidas, mas sem papel runtime autorizado a executá-las.
- Não executar SQL mutável remoto antes do merge humano. O apply pertence exclusivamente ao workflow canônico disparado após o merge.

### 9.3. Provas SQL coerentes com o estado congelado

- Remover do conjunto operacional corrente:
  - `supabase/tests/e21_4_4_openai_lp_cost_tracking.test.sql`;
  - `supabase/snippets/e21_4_4_openai_lp_cost_tracking_verify.sql`.
- Preservar imutável a migration E21.4.4 já aplicada e o histórico documental de criação desses artefatos.
- Adicionar `supabase/tests/e21_4_6_openai_lp_cost_history.test.sql` como teste transacional sem resíduos.
- Adicionar `supabase/snippets/e21_4_6_openai_lp_cost_history_verify.sql` como verificador versionado, exclusivamente read-only e com checks individualmente identificáveis.
- Os dois artefatos devem provar:
  - objetos, constraints, índices, triggers, dados e corte histórico preservados;
  - RLS habilitado e zero policies;
  - ausência de `INSERT`, `UPDATE`, `DELETE` e `TRUNCATE` nas duas tabelas para todos os papéis Data API;
  - ausência de `EXECUTE` nas três RPCs legadas de escrita/corte para todos os papéis Data API;
  - manutenção de `SELECT` do `service_role` e de `EXECUTE` na RPC de leitura;
  - ausência integral de acesso para `PUBLIC`, `anon`, `authenticated` e `ai_readonly`;
  - leitura do corte e do histórico sem qualquer mutação.

### 9.4. Regressão contra reintrodução do produtor legado

- Acrescentar a `lib/openai-costs/validation-cases.ts` um caso focal que inspecione apenas código runtime em `app/`, `lib/` e `automations/`.
- A prova deve falhar se runtime voltar a consumir `OPENAI_LP_COST_TRACKING_ENABLED`, as três RPCs legadas de escrita/corte ou um tracker E21.4.
- Excluir da busca migrations, snippets, testes, validações e documentação históricos para não transformar referências de prova em falso positivo.
- Permitir `read_openai_lp_cost_events_v1` somente no adapter legado read-only e falhar se outro runtime passar a consumi-la.
- `npm run validate:openai-costs` deve aprovar o estado vigente e a validação deve incluir caso controlado que demonstre falha diante de referência runtime proibida.

### 9.5. Matriz única de consolidação e transição

- Criar `docs/matriz-consolidacao-e21-4-6.md` como a única matriz deste plano; ela também cumpre a evidência item a item de transição, sem criar artefato paralelo `matriz-transicao`.
- Classificar todos os comportamentos comprovados da E21.4 exatamente uma vez como `preservar`, `reutilizar`, `substituir` ou `retirar`, sempre com path e evidência verificável.
- Cobrir no mínimo:
  - `preservar`: Costs oficial, credencial administrativa, período, consulta sob demanda, guard, dados, corte, imutabilidade histórica, read model, detalhamento conta/LP/workload e atalhos;
  - `reutilizar`: boundary `lib/openai-costs/`, contratos sanitizados, decimal, provider, página e Server Action;
  - `substituir`: tracking, pricing, cobertura e atribuição ativos pelo ledger, recorder e read model E21.5, além da composição oficial + ativo + legado;
  - `retirar`: produtor, gate, budget, pricing e adapter prospectivos E21.4 já ausentes do runtime, mais os grants residuais removidos pela migration E21.4.6.
- Nenhuma linha pode autorizar backfill, reprecificação, reclassificação retroativa ou novo produtor.

### 9.6. Documentação canônica

- Atualizar `docs/schema.md`, exclusivamente pelo resultado do ABC competente, para registrar a série `openai_lp_*` como histórica e congelada, `service_role` somente leitura, read RPC executável e write RPCs sem executor runtime.
- Registrar no Schema a migration, o teste e o snippet E21.4.6; estado pós-apply somente após evidência real.
- Atualizar `docs/roadmap.md`, exclusivamente pelo ABC, com `E21.4.6 — Transição para histórico legado`, a autoridade ativa em E21.5, o histórico E21.4 preservado e a matriz correspondente.
- Corrigir o estado de E21.5 no roadmap e no Schema somente pelos recibos sanitizados já confirmados pelo supervisor; preservar o histórico de criação e migrations anteriores.
- Preservar `docs/lousa-plano-base-e21-4.md` como registro histórico; não reescrever a V1/V2 original da E21.4.
- `docs/platform-config.md` permanece sem alteração: `OPENAI_LP_COST_TRACKING_ENABLED` já está inerte e documentada, e removê-la da plataforma não acrescenta garantia ao congelamento por ACL.

## 10. Classificação dos acréscimos técnicos

### 10.1. Derivações técnicas da V1

- Migration forward-only de revogação dos grants residuais de escrita.
- Substituição das provas E21.4.4 por teste e snippet E21.4.6 coerentes com o estado histórico congelado.
- Regressão focal contra reintrodução de produtor legado no runtime.
- Matriz item a item e reconciliação documental mínima.

### 10.2. Modernizações técnicas justificadas

- `supa#40`: snippet hospedado versionado e exclusivamente read-only como prova reproduzível do estado pós-apply.
- `supa#2`: inspeção de Security Controls após apply como defesa em profundidade, sem alterar policies, papéis ou configuração pelo Dashboard.
- `github#14`: recibos materiais sanitizados em fontes duráveis, sem exportar logs, criar artefato ou armazenamento paralelo.
- Os três tratamentos têm impacto estrutural baixo e impacto funcional nulo; nenhum exige confronto estrutural focal.

### 10.3. Ampliações de escopo rejeitadas

- AI Gateway, fallback entre provedores, budgets adicionais ou migração de credenciais.
- CDC, warehouse, drains, monitor agente, `rlsautotest`, novos índices ou nova automação.
- Nova UI, dashboard, rota, provider, adapter, ledger, tabela, policy, papel ou infraestrutura.
- Exclusão de tabelas, linhas, corte, funções ou read model históricos.

## 11. Execução da fase `E21.4.6 — Transição para histórico legado`

### 11.1. Objetivo

- Fechar a autoridade residual de escrita E21.4 e provar que o histórico continua íntegro e consultável enquanto E21.5 permanece a única autoridade ativa, sem alterar o comportamento administrativo ou financeiro já aprovado.

### 11.2. Ordem executável

1. Confirmar o checkpoint `LP-Factory-Stage: plan-v2-approved`, a matriz versionada e a mesma branch, worktree e PR.
2. Executar `npm ci` uma vez no lote contínuo.
3. Gerar a migration com Supabase CLI, implementar somente as revogações aprovadas e revisar o SQL conforme as regras de segurança/RLS e funções.
4. Substituir o teste e o snippet E21.4.4 pelos artefatos E21.4.6 e adicionar a regressão focal do runtime.
5. Executar validações locais focais, o teste SQL local/isolado quando disponível, `npm run check` e `git diff --check`.
6. Produzir relatórios factuais e executar ABC para `docs/schema.md` e, na consolidação final, `docs/roadmap.md`; aplicar somente operações literais emitidas.
7. Submeter diff, evidências, matriz, pareceres pertinentes e resultados dos ABCs ao Analista de implementação.
8. Com `aprovado para avançar`, criar o checkpoint `LP-Factory-Phase: E21.4.6 — Transição para histórico legado`.
9. Publicar o mesmo PR draft quando estado remoto for necessário e executar apenas inspeções pré-merge autorizadas, incluindo migration list e dry-run quando disponíveis.
10. Após merge humano, aguardar o apply canônico; executar o snippet read-only; inspecionar Security Controls; realizar QA hospedado positivo e negativo de `/admin/custos-openai`; registrar recibos sanitizados duráveis.

### 11.3. Arquivos previstos

- Alterar:
  - `docs/lousa-plano-base-e21-4-6.md`;
  - `docs/roadmap.md`;
  - `docs/schema.md`;
  - `lib/openai-costs/validation-cases.ts`.
- Adicionar:
  - `docs/matriz-consolidacao-e21-4-6.md`;
  - `supabase/migrations/<timestamp>_e21_4_6_freeze_openai_lp_cost_history.sql`;
  - `supabase/tests/e21_4_6_openai_lp_cost_history.test.sql`;
  - `supabase/snippets/e21_4_6_openai_lp_cost_history_verify.sql`.
- Remover do conjunto operacional corrente:
  - `supabase/tests/e21_4_4_openai_lp_cost_tracking.test.sql`;
  - `supabase/snippets/e21_4_4_openai_lp_cost_tracking_verify.sql`.

## 12. Validações e evidências

### 12.1. Antes do gate de implementação

- `npm ci`.
- `npm run validate:openai-costs`.
- Teste SQL transacional E21.4.6 em banco local ou isolado, sem resíduos.
- `npm run check`.
- `git diff --check`.
- Revisão de `origin/main..HEAD` e `origin/main...HEAD`, secrets, `.env`, banco, workflows e arquivos fora do escopo.

### 12.2. Pré-merge remoto

- `supabase migration list --linked`, quando o recurso autorizado estiver disponível.
- `supabase db push --linked --dry-run`, quando suportado, sem aplicar migration.
- Checks do PR e Preview vinculados ao mesmo SHA publicado.
- Nenhuma mutation SQL, `apply_migration`, `migration repair` ou `supabase db push --linked` sem `--dry-run`.

### 12.3. Pós-merge obrigatório

- Apply da migration somente pelo workflow canônico.
- Snippet E21.4.6 read-only com todos os checks `ok`, contagens e corte preservados.
- Security Controls sem alerta novo incompatível com tabelas, RLS, policies, grants ou funções E21.4.
- QA autenticado positivo de `/admin/custos-openai` comprovando total oficial, subtotal ativo, histórico legado identificável e reconciliação sem dupla contagem.
- QA autenticado negativo comprovando bloqueio fora de `platform_admin`.
- Leitura ativa permanece sem `INVALID_RESPONSE` e sem dependência do write-side ou read model LP-específicos.
- Resultados materiais registrados de forma sanitizada em PR, commit e documentos canônicos competentes.

## 13. Riscos, travas e critérios de parada

- Qualquer ausência dos recibos de equivalência/superioridade E21.5 bloqueia a retirada dos grants; o recibo competente já foi fornecido pelo supervisor e deve permanecer rastreável.
- Drift inesperado de migrations, alerta incompatível em Security Controls, alteração de contagens/corte ou falha do histórico bloqueia o encerramento e exige diagnóstico, sem rollback ou correção remota por inferência.
- A migration E21.4.4 aplicada é imutável; qualquer correção é incremental e forward-only.
- A matriz permanece versionada até o supervisor declarar o recorte definitivamente concluído.
- Nenhum SQL mutável remoto ocorre antes do merge e nenhuma fase adicional é iniciada.
- Merge, apply pós-merge e conclusão definitiva pertencem ao supervisor competente e aos fluxos canônicos; esta task não faz merge local.

## 14. Gate de aceite da V2

- A V2 só autoriza implementação após as duas passagens do Analista, a auditoria da matriz, a revisão delta do roadmap e a conclusão formal `aprovado para merge do plano-base v2`.
- Após o checkpoint `LP-Factory-Stage: plan-v2-approved`, a execução continua na mesma task, branch, worktree e PR sob `$lp-factory-executar-plano`.
