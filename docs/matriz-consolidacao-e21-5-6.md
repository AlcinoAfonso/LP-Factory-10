12/09/2026 — Matriz de consolidação — E21.5.6 — Visão econômica hierárquica de custos por evento

## 1. Referências imutáveis

- Fonte funcional: `Debate 10 — Controle de custos OpenAI por workload e conta — LP Factory 10`, seção `4.3. PB 3 — E21.5.6 Visão econômica hierárquica de custos por evento — V1 aprovada`, revisão `ANLCKQketXjusGrBwA5ymqMCE8oTP-nRqz6tC8AREyQwYkJ8rcmayCT8ZmkqqpmPrFdA2rZN1RyMDpzsplSyxRQ_BWSMhuaHBNz6WZJ0QLw`.
- V1 congelada: commit `7ac2d27869d8f0d7af4a44ef7690ec8cc4865ffe`, blob `51bbac0e9d7ba3a576973b41881a1356f08d12b3`, path `docs/lousa-plano-base-e21-5-6.md`.
- V2 inicial da Passagem 1: commit `82aca4aaceb955c38f11719f2e43050410450ed6`, blob `06de8148a6fd51ced9b5234836379a59e4911367`, mesmo path.
- V2 corrigida para consolidação: commit `31c98405b61aa60190f3d65215a24585606eed65`, blob `0b8314479b160064694ccddc20a1f6b2be9f026b`, mesmo path.
- Base do PR e roadmap-base: `origin/main@aad19713271bfd7280aa87b47734ef1192addc81`, blob `bc98ac18695e1337120b84836dad4aab6d9c7405` de `docs/roadmap.md`.
- PR único: `#929`, draft, base `main`, head `codex-app/e21-5-6-visao-economica-eventos`.
- PB 1 e PB 2 permanecem concluídos e fora do recorte. Plano conceitual: N/A. Automação: N/A, com avaliação formal dispensada pela V1.

## 2. Contrato funcional da V1

| ID | Origem | Item | Classe | Tratamento | Localização/evidência | Destino de update | Confronto estrutural |
| --- | --- | --- | --- | --- | --- | --- | --- |
| V1-E2156-01 | V1 | Hierarquia `universo → responsável econômico → evento → workload → execução/operação` | preservação funcional | Implementar integralmente na composição e na superfície administrativa existente | V2 2.3, 10 e 11 | N/A | N/A |
| V1-E2156-02 | V1 | Gasto oficial, Clientes, LP Factory e reconciliação na visão inicial | preservação funcional | Reutilizar provider, totais e fórmula vigentes sem redistribuição | V2 2.4, 5 e 10 | N/A | N/A |
| V1-E2156-03 | V1 | Contas apresentadas por nome, com custo e eventos | preservação funcional | Enriquecer leitura autorizada e ordenar por rótulo humano | V2 7.2, 10 e 11 | N/A | N/A |
| V1-E2156-04 | V1 | LP específica como evento econômico | preservação funcional | Compor LP histórica pelo read model E21.4 e suportar contexto explícito prospectivo | V2 2.5, 6.2, 9.3 e 10 | N/A | N/A |
| V1-E2156-05 | V1 | Cada ocorrência de resolução de nicho por IA como evento unitário | preservação funcional | Gerar UUID próprio antes da chamada no produtor autorizado | V2 2.5 e 9.1 | N/A | N/A |
| V1-E2156-06 | V1 | Eventos internos LP Factory identificáveis | preservação funcional | Correlacionar avaliações de catálogo e drafts comerciais somente na origem | V2 9.2 | N/A | N/A |
| V1-E2156-07 | V1 | Reutilizar detalhe por workload, execução e operação | preservação funcional | Manter DTO técnico e UI vigente dentro do novo drill-down | V2 10 e 11 | N/A | N/A |
| V1-E2156-08 | V1 | Identidade funcional, sem heurística | preservação funcional | Exigir evento discriminado na origem; UUID técnico não vira rótulo ou inferência | V2 4, 5 e 6.2 | `UP-supa-69` apenas como trava negativa | compatível |
| V1-E2156-09 | V1 | Execução sem vínculo comprovável permanece sem correlação | preservação funcional | Exibir coleção explícita separada e manter contribuição no subtotal superior | V2 4, 9.3 e 10 | N/A | N/A |
| V1-E2156-10 | V1 | Totais derivados não inventam valores ausentes | preservação funcional | Usar decimal lossless e comunicar indisponibilidade em todos os níveis | V2 4 e 10 | N/A | N/A |
| V1-E2156-11 | V1 | Mesma rota administrativa e acesso `platform_admin` | preservação funcional | Evoluir somente `/admin/custos-openai`, mantendo guard server-side | V2 5 e 11 | `UP-prod-16` como validação | compatível |
| V1-E2156-12 | V1 | Automação não aplicável | escopo negativo | Não criar job, agente, monitor ou rotina recorrente | V2 2.6 e 5 | N/A | N/A |
| V1-E2156-13 | V1 | PB 1, PB 2, pricing, coverage, histórico e reconciliação permanecem concluídos | escopo negativo | Não reabrir contratos, providers, objetos `openai_lp_*` ou fórmula global | V2 5 | N/A | N/A |
| V1-E2156-14 | V1 | Sem tabela analítica, novo engine, dashboard ou cobrança | escopo negativo | Excluir qualquer residência, motor ou superfície paralela | V2 5 | N/A | N/A |
| V1-E2156-15 | V1 | Sem backfill, reprecificação ou reclassificação retroativa | escopo negativo | Colunas novas nulas para história; nenhuma correlação por `UPDATE` | V2 5, 7.1 e 7.3 | N/A | N/A |

## 3. Achados do Gestor Estrutural

| ID | Origem | Classe | Tratamento consolidado | Localização/evidência | Destino de update | Confronto estrutural |
| --- | --- | --- | --- | --- | --- | --- |
| GE-E2156-01 | invariante técnico | derivação técnica da V1 | Estender `OpenAiCostEconomicContext` com união discriminada opcional e `null` honesto | V2 6.2 e 8 | N/A | N/A |
| GE-E2156-02 | invariante técnico | derivação técnica da V1 | Acrescentar quatro colunas nulas, constraint, FKs e índice parcial ao ledger existente | V2 7.1 | N/A | N/A |
| GE-E2156-03 | invariante técnico | derivação técnica da V1 | Tornar campos econômicos imutáveis e criar RPCs v2 de início/leitura | V2 7.2 | N/A | N/A |
| GE-E2156-04 | invariante técnico | derivação técnica da V1 | Manter RLS, zero policies e `EXECUTE` somente para `service_role` | V2 7.2 | `UP-supa-02` como prova complementar | compatível |
| GE-E2156-05 | invariante técnico | derivação técnica da V1 | Correlacionar somente nos produtores que já possuem identidade econômica comprovada | V2 9 | N/A | N/A |
| GE-E2156-06 | invariante técnico | derivação técnica da V1 | Manter provas, pesquisa sem LP e `supabase_inspect` com evento nulo | V2 9.3 | N/A | N/A |
| GE-E2156-07 | invariante técnico | derivação técnica da V1 | Compor ativo e legado em função pura, preservando decimal e indisponibilidade | V2 6.1 e 10 | N/A | N/A |
| GE-E2156-08 | invariante técnico | derivação técnica da V1 | Manter árvore route-local na rota existente | V2 6.1 e 11 | `UP-prod-17` confirma invariantes visuais | compatível |
| GE-E2156-C1 | invariante técnico | correção factual | Reconciliar em `docs/schema.md` o drift de E21.5.3, E21.5.4 e lossless conforme estado hospedado competente | V2 14 | N/A | N/A |
| GE-E2156-C2 | invariante técnico | derivação técnica da V1 | Preferir RPC v2 e admitir ponte v1 somente para `PGRST202` que identifique exatamente a RPC `public` esperada; propagar `v2_active` ou `v1_fallback`, sem backfill nem fallback para outros erros; retirar v1 apenas após ausência de deployment chamador comprovada | V2 7.3, 8, 10, 11 e 13 | N/A | compatível |
| GE-E2156-C3 | invariante técnico | derivação técnica da V1 | Cobrir negativas contra correlação por IDs técnicos, nome, horário ou proximidade | V2 4, 5 e 13 | `UP-supa-69` como trava negativa | compatível |
| GE-E2156-C4 | V1 | preservação funcional | Não fazer backfill; linhas anteriores e registros sob fallback permanecem não correlacionados | V2 7.1 e 7.3 | N/A | N/A |
| GE-E2156-C5 | invariante técnico | derivação técnica da V1 | Após apply, provar nicho real, evento interno real, LP histórica e execução sem correlação | V2 13 e 16 | `UP-prod-16` como QA proporcional | compatível |

## 4. Updates consolidados

| ID | Origem | Classe | Tratamento | Localização/evidência | Destino de update | Confronto estrutural |
| --- | --- | --- | --- | --- | --- | --- |
| UP-supa-40 | update | modernização técnica justificada | Aplicar snippet SQL read-only versionado; sem update há provas dispersas, com update há repetibilidade e auditabilidade; custo é um arquivo focal e impacto funcional é nulo | V2 12, 13 e 15.1 | `supabase/snippets/e21_5_6_openai_economic_events_verify.sql` | compatível; ganho líquido positivo |
| UP-prod-17 | update | derivação técnica da V1 | Aplicar teclado, foco, nomes acessíveis, estado e texto não dependente de cor conforme design system vigente; sem parcela funcional extra | V2 11 e 15 | UI e validação focal | compatível |
| UP-supa-02 | update | derivação técnica da V1 | Usar Security Controls como prova complementar pós-apply, sem mutar configuração | V2 13 e 15 | gate pós-merge | compatível |
| UP-prod-16 | update | derivação técnica da V1 | Executar QA hospedado desktop/mobile e positivo/negativo na mesma rota | V2 13 e 15 | gate pós-merge | compatível |
| UP-supa-69 | update | derivação técnica da V1 | Proibir identificadores técnicos como identidade econômica ou rótulo primário, sem instalar tracing | V2 4, 5, 10 e 15 | contratos, testes e UI | compatível |
| UP-supa-35 | update | ampliação de escopo | Não criar índice adicional sem problema mensurado; o índice parcial derivado do acesso canônico já integra a V1 | V2 7.1 e 16 | oportunidade condicional fora do recorte | N/A — rejeitado |
| UP-supa-50 | update | ampliação de escopo | Não criar réplica de leitura para o ledger atual | V2 5 e 15 | oportunidade condicional fora do recorte | N/A — rejeitado |
| UP-supa-63 | update | ampliação de escopo | Não instalar `rlsautotest`; manter teste SQL focal, grants e Security Controls | V2 5 e 13 | oportunidade condicional fora do recorte | N/A — rejeitado |
| UP-supa-64 | update | ampliação de escopo | Não criar CDC ou warehouse | V2 5 e 15 | oportunidade condicional fora do recorte | N/A — rejeitado |
| UP-vercel-01 | update | ampliação de escopo | Não introduzir AI Gateway nesta fase | V2 5 e 15 | oportunidade condicional fora do recorte | N/A — rejeitado |
| UP-prod-03 | update | ampliação de escopo | Não adicionar telemetria/RUM à árvore | V2 5 e 15 | oportunidade condicional fora do recorte | N/A — rejeitado |

## 5. Correções objetivas da Passagem 1 do Analista

| ID | Origem | Classe | Tratamento incorporado | Localização/evidência |
| --- | --- | --- | --- | --- |
| AN-P1-E2156-01 | invariante técnico | derivação técnica da V1 | Propagar `economicDimensionStatus = 'v2_active' | 'v1_fallback'` de adapter a DTO, composição e UI | V2 7.3, 8, 10 e 11 |
| AN-P1-E2156-02 | invariante técnico | derivação técnica da V1 | Fixar marco de ativação e fallback somente por `PGRST202` mais RPC `public` exata; demais erros não usam v1 | V2 7.3, 8 e 13 |
| AN-P1-E2156-03 | V1 | preservação funcional | Manter registros anteriores/sob fallback sem correlação e sem backfill | V2 7.3 |
| AN-P1-E2156-04 | V1 | preservação funcional | Definir rótulos humanos determinísticos para nicho e evento interno sem taxon; UUID apenas detalhe/desempate | V2 10 e 11 |
| AN-P1-E2156-05 | invariante técnico | correção de classificação | Tratar acessibilidade como derivação da V1 e justificar `UP-supa-40` por comparação explícita de ganho/custo | V2 15 e 15.1 |
| AN-P1-E2156-06 | invariante técnico | gate processual | Publicar a V2 corrigida antes de usar o PR como referência de consolidação | commit `31c98405b61aa60190f3d65215a24585606eed65`; PR `#929` |

## 6. Confrontos e decisões

- Gestor Estrutural e Gestor de Updates não produziram conclusões incompatíveis entre si.
- O confronto focal de C2 concluiu pela alternativa A: call-and-fallback estrito é estruturalmente equivalente quanto ao resultado de rollout seguro; o esclarecimento substitui somente a redação prescritiva original de C2 e não exige decisão humana.
- As condicionantes estruturais foram incorporadas como derivação, correção factual ou preservação funcional, sem decisão de produto.
- Os updates aceitos apenas reforçam validação, segurança, acessibilidade e auditabilidade do mesmo resultado. Os demais permanecem fora do recorte.
- Não existe lacuna que autorize reabrir PB 1/PB 2, criar nova fase, dividir o PR ou ampliar a residência técnica.

## 7. Travas de consolidação

- A matriz e o plano permanecem versionados e auditáveis até o gate `plan-v2-approved`.
- A implementação só pode começar após `aprovado para merge do plano-base v2`, reconciliação planejada do roadmap e aprovação do delta pelo mesmo Analista.
- Nenhum gate hospedado pode aplicar migration, corrigir dado ou criar correlação por `UPDATE` fora do fluxo canônico.
- Qualquer necessidade de alterar pricing, Costs API, coverage, objetos `openai_lp_*`, fórmula de reconciliação, identidade por heurística, nova tabela ou nova página exige parada.
