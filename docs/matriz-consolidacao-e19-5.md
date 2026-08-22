# Matriz de consolidação — E19.5

## 1. Referências imutáveis

- Caso: `E19.5 — Workspace operacional e lifecycle de LPs`.
- PR de origem: `#801`, mergeado em `main`.
- Branch/head do PR de origem: `docs/e19-5-matriz-debate-convergencia@4e5b1d5e045a04aef76ea8fce0c1bc003ffbc138`.
- Merge commit e base congelada: `f857f95df11960279a32ba34e56b4a63c918dfff`.
- Plano-base v1: `docs/lousa-plano-base-e19-5.md`, blob `9ad733987ecd39dc9c049d74daf6d71a655c9dbb`.
- Snapshot de `docs/roadmap.md` na base: blob `d8b50927d9a47763f7f90fe68b2e566d8335ba61`.
- Plano conceitual: `N/A`.
- Plano-base v2 processual: commit inicial `be2841f78c52b7e05fbf4b93b750af276517f5b2`; deltas da Passagem 1 `7ceedcddfed4d99eab598629d1fddc1934ca7190` e `94def51`.
- Blob v2 vigente: `a361f3fc0ed953b1627f7443aa3e68bd7e8526a9` no commit `94def51`.
- Branch/worktree da orquestração: `codex-app/e19-5b-orquestracao` em `C:\Dev\GitHub\LP-Factory-10-e19.5b`.
- Frente histórica preservada: PR `#797`, draft, `codex-app/e19-5-orquestracao@08af1e83`; não é autoridade desta execução.
- Frente adjacente ativa: PR `#802`; não estava em `main` no congelamento e não foi copiado, cherry-picked ou incorporado por inferência.

## 2. Decisões e limites do caso

- O processo automatizado foi escolhido pelo humano no PR #801.
- A decisão humana B e os invariantes já válidos da v1 foram preservados.
- O plano contém `Automação: não`; avaliação formal do Gestor de Automações: `N/A — nenhuma fase com Automação: sim`.
- A orquestração preserva uma única branch e um único PR draft para plano, roadmap e implementação.
- As classes de consolidação usadas abaixo são `preservação`, `extensão adjacente necessária e proporcional` e `expansão`.
- Oportunidade condicional não autoriza implementação neste recorte.

## 3. Parecer estrutural

Parecer integral preservado pelo orquestrador. Veredito: `requer patch estrutural`.

| ID | Achado e classificação original | Relação com o escopo | Classe de consolidação | Tratamento | Destino/localização | Evidência |
|---|---|---|---|---|---|---|
| `GE-E19.5-001` | A E20.2 v5 já está incorporada; `landing_page_objective` não existe no código vigente. Patch estrutural aplicável. | Corrige premissa temporal da v1 e evita autoridade duplicada. | preservação | Incorporado. A E19.5 reutiliza v5 pela API pública, não a recria; #802 permanece adjacente e sem incorporação implícita. | Plano 1.1, 1.7, 2.7 e 3.1. | Registry v5 e regressões já presentes na base `f857f95`; roadmap ainda defasado. |
| `GE-E19.5-002` | Banco não especificava RLS, grants, Data API, RPCs nem chave única da FK de aprovação. Patch estrutural aplicável. | Fecha segurança e atomicidade indispensáveis às novas residências. | extensão adjacente necessária e proporcional | Incorporado com duas residências service-only, RLS sem policies, grants mínimos, RPC transacional `SECURITY INVOKER`, FK tenant-safe, snippet e testes. O escopo de ausência de `DELETE`/roles externas é somente dos novos objetos; agregados existentes são preservados. | Plano 2.1.5 e critérios da E19.5.3. | `docs/base-tecnica.md`; precedentes service-only em `docs/schema.md`; objetos ainda ausentes no ambiente inspecionado. |
| `GE-E19.5-003` | Runtime poderia concorrer com apply; parecer propôs dois incrementos, PRs e merges ordenados. Patch estrutural aplicável. | Risco real, mas a solução proposta conflita com o invariante processual de uma branch e um PR. | extensão adjacente necessária e proporcional | Incorporado com tratamento corrigido pela fonte superior: migration, runtime e UI permanecem no único PR; `E19_5_WORKSPACE_ENABLED` nasce server-only e default-off. Rollout: merge → apply → provas → Preview/redeploy → prova humana → Production/redeploy/smoke. Não foram criados segundo PR ou merge intermediário. | Plano 2.7, 3.1 e `docs/platform-config.md` via ABC. | Workflow aplica migrations após push em `main`; skill exige um único PR; flag e rollout preservam a precedência sem PR precursor. |
| `GE-E19.5-004` | Evolução do snapshot também exige versionar o contrato E19.3. Patch estrutural aplicável. | Evita invalidar revisões E19.4 históricas. | preservação | Incorporado como união discriminada snapshot v1/contexto v3 e snapshot v2/contexto v4, sem reescrita histórica nem combinações cruzadas. A v4 preserva revisões e versões históricas por residência. | Plano 2.1.3, 2.1.6, 2.4.3 e 3.1. | Contrato atual v3 e validator v1 na base congelada. |
| `GE-E19.5-005` | Faltava bootstrap de identidade para LP legada sem `primary_conversion_goal`. Patch estrutural aplicável. | Torna executável o preenchimento inicial previsto para clientes existentes. | preservação | Incorporado com baseline por field: preenchimento inicial legado permanece na mesma LP; somente mudança posterior ao baseline desse field exige nova identidade. | Plano 1.8, 2.1.4 e critérios da E19.5.3. | Snapshots anteriores à v5 não contêm o novo field obrigatório. |
| `GE-E19.5-006` | Paths físicos e substituição dos caminhos vigentes estavam abertos. Patch estrutural aplicável. | Fecha decisões de implementação e evita boundary/action concorrente. | extensão adjacente necessária e proporcional | Incorporado com boundary único em `lib/lp-builder`, UI/actions route-local, paginação e preview histórico. A remoção de `app/lp-builder/actions.ts` foi corrigida após a Passagem 1: preservar por padrão e remover somente com evidência executável de alcance ou autoridade concorrente real. | Plano 2.2–2.8 e 3.1. | Placeholder vigente, leitura sem paginação explícita e action histórica sem consumidor confirmado na base. |

## 4. Parecer de updates

Parecer integral preservado pelo orquestrador. Veredito: `updates aplicáveis com patches autossuficientes`.

| ID | Classificação original | Relação com o escopo | Classe de consolidação | Tratamento | Destino do update | Localização e evidência |
|---|---|---|---|---|---|---|
| `supa#2` | complementar; atual | Segurança pós-apply dos novos objetos. | extensão adjacente necessária e proporcional | Incorporado como inspeção de Supabase Security Controls após cada migration; alerta incompatível bloqueia habilitação. | usar como referência, validação ou trava | Critérios E19.5.3; evidência identifica ambiente e resultado em cada apply. |
| `supa#35` | complementar; condicional | Plano de consulta somente se paginação/histórico exibirem custo real. | expansão | Não implementar; preservar oportunidade e gatilho objetivo. | oportunidade estratégica condicional | Gatilho: plano/latência/QA demonstrar scan ou custo incompatível. |
| `supa#40` | complementar; atual | Prova repetível do schema e da segurança hospedados. | extensão adjacente necessária e proporcional | Incorporado como um snippet read-only versionado e correspondente a cada migration, fail-closed para drift. | aplicar agora | Entrega e critérios E19.5.3; `supabase/snippets`, executado após cada apply com ambiente e resultado registrados. |
| `supa#51` | complementar; futuro | Busca aproximada só tem valor demonstrado em coleção real grande. | expansão | Não implementar; preservar oportunidade e gatilho objetivo. | oportunidade estratégica condicional | Gatilho: pesquisa provar que paginação/leitura não localizam LPs adequadamente. |
| `supa#52` | sobreposto; atual | Criaria normalização derivada concorrente com o boundary TypeScript. | expansão | Rejeitado no recorte. | não aplicável | Não há chave derivada de busca que justifique generated column. |
| `supa#63` | complementar; condicional | Poderia ampliar regressão RLS, mas exige ferramenta beta e banco descartável. | expansão | Não implementar; preservar oportunidade e gatilho objetivo. | oportunidade estratégica condicional | Gatilho: rodada ampla de policies/tabelas ou custo material da matriz SQL manual. |
| `vercel#3` | incompatível; atual | Cache compartilhado conflita com sessão/cookie e tenant awareness. | expansão | Rejeitado no recorte. | não aplicável | Rotas autenticadas permanecem dinâmicas e sem cache entre usuários. |
| `vercel#15` | complementar; atual | Pode apoiar QA de acessibilidade, interação e layout. | extensão adjacente necessária e proporcional | Incorporado como ferramenta opcional, nunca substituta de inspeção manual. | usar como referência, validação ou trava | Plano 2.6; evidência hospedada distingue apoio e revisão manual. |
| `vercel#21` | substituto; atual | Substituiria Supabase Storage privado sem superioridade concreta. | expansão | Rejeitado no recorte. | não aplicável | Assets append-only já usam storage privado e URLs assinadas. |
| `prod#3` | complementar; condicional | Performance deve partir de dados reais e rotina definida. | expansão | Não implementar; preservar oportunidade e gatilho objetivo. | oportunidade estratégica condicional | Gatilho: tráfego, responsável, frequência, hipótese e tratamento aprovados. |
| `prod#8` | complementar; futuro | Mensuração server-side exige recorte próprio de tracking e consentimento. | expansão | Não implementar; preservar oportunidade e gatilho objetivo. | oportunidade estratégica condicional | Gatilho: campanha, evento, valor, consentimento e governança definidos. |
| `prod#12` | complementar; atual | Reduz erro de contexto dentro da conta e da LP. | extensão adjacente necessária e proporcional | Incorporado como contexto persistente Conta → LP → seção e retorno previsível. | aplicar agora | Plano 2.2; sem switcher global multi-contas. |
| `prod#14` | complementar; atual | Prova compreensão de identidade, latest, approved e próxima ação. | extensão adjacente necessária e proporcional | Incorporado como teste humano de reconhecimento, sem telemetria nova. | usar como referência, validação ou trava | Plano 2.6; quatro tarefas humanas explícitas. |
| `prod#15` | complementar; futuro | Microeventos exigem pergunta de negócio e operação real. | expansão | Não implementar; preservar oportunidade e gatilho objetivo. | oportunidade estratégica condicional | Gatilho: evento, ação, volume, finalidade, retenção e responsável definidos. |
| `prod#16` | complementar; atual | Repete baseline proporcional de QA hospedado. | extensão adjacente necessária e proporcional | Incorporado para owner/admin, papel sem mutação, entitlement permitido/bloqueado e viewports. | usar como referência, validação ou trava | Plano 2.6; automação visual não substitui revisão manual. |
| `prod#17` | complementar; atual | Completa o baseline acessível já exigido. | extensão adjacente necessária e proporcional | Incorporado com critérios WCAG 2.2 pertinentes, sem alegação integral. | aplicar agora | Plano 2.6 e critérios; evidência registra cada critério aplicável, exceções justificadas e inspeção manual correspondente. |
| `prod#23` | sobreposto; futuro | WhatsApp oficial exige comparação e recorte próprios. | expansão | Não implementar; preservar oportunidade e gatilho objetivo. | oportunidade estratégica condicional | Gatilho: operação, elegibilidade, custos, políticas e comparação documentados. |
| `github:N/A` | nenhum item elegível | Sem relação funcional suficiente com E19.5. | preservação | Nenhum patch ou oportunidade registrado. | N/A | Catálogo GitHub avaliado pelo especialista. |

## 5. Automação

| ID | Achado | Classificação original | Relação com o escopo | Tratamento | Localização | Evidência |
|---|---|---|---|---|---|---|
| `AUTO-N/A` | Nenhuma fase contém `Automação: sim`. | N/A | Não há automação, job, agente ou rotina nova a avaliar. | Avaliação formal não acionada, conforme regra condicional da skill. | Plano v1 e v2. | Ocorrência literal `Automação: não`. |

## 6. Passagens do Analista e revisões delta

Na Passagem 1, o mesmo Analista recebeu apenas v1, v2, plano conceitual `N/A`, decisões e fontes do caso, sem pareceres ou matriz.

| ID | Correção obrigatória | Classe | Tratamento na v2 | Evidência do gate |
|---|---|---|---|---|
| `P1-01` | Baseline deve ser definido por field; somente mudança posterior ao baseline do field cria nova LP. | preservação | Aplicado no commit `7ceedcd`. | Aprovado na primeira revisão delta. |
| `P1-02` | Consumidor E19.5 deve declarar versão requerida 5 explicitamente, sem derivação de marker, residência, `latest` ou máximo. | preservação | Aplicado no commit `7ceedcd`. | Aprovado na primeira revisão delta. |
| `P1-03` | Contexto v4/snapshot v2 deve preservar versões históricas por residência e semântica correta de ausência. | preservação | Versões adicionadas em `7ceedcd`; semântica de ausência corrigida em `94def51` para depender da residência efetivamente usada e não mascarar obrigatório ausente. | Aprovado na segunda revisão delta. |
| `P1-04` | Rollout deve ordenar merge, apply, provas, Preview, redeploy, prova humana, Production, redeploy e smoke; gate documentado. | extensão adjacente necessária e proporcional | Aplicado no commit `7ceedcd`. | Aprovado na primeira revisão delta. |
| `P1-05` | Regras de segurança/no `DELETE`/roles externas devem se limitar aos novos objetos e preservar agregados existentes. | preservação | Aplicado no commit `7ceedcd`. | Aprovado na primeira revisão delta. |
| `P1-06` | `app/lp-builder/actions.ts` deve ser preservado por padrão e removido só com evidência executável de concorrência real. | preservação | Aplicado no commit `7ceedcd`. | Aprovado na primeira revisão delta. |

Na Passagem 2 sobre o commit `4d14f85`, o mesmo Analista confirmou a cobertura integral da matriz e exigiu três correções mecânicas, sem nova rodada especializada ou decisão humana:

| ID | Correção obrigatória da Passagem 2 | Classe | Tratamento neste delta |
|---|---|---|---|
| `P2-01` | Exigir snippet correspondente e Security Controls após cada migration, com ambiente e resultado registrados. | extensão adjacente necessária e proporcional | Plano e linhas `supa#2`/`supa#40` da matriz atualizados. |
| `P2-02` | Tornar auditável o critério `prod#17`, registrando cada critério aplicável, exceções e inspeção manual. | extensão adjacente necessária e proporcional | Plano e linha `prod#17` da matriz atualizados. |
| `P2-03` | Atualizar o estado processual da seção 3.2 do plano. | preservação | Passagem 1, deltas, matriz e origem destas correções registrados. |

Conclusão da Passagem 2 no commit `4d14f85`: `aprovado com correções obrigatórias`; este delta retorna ao mesmo Analista em `revisao_delta` e ainda não aprova o merge do plano-base v2.

## 7. Travas preservadas durante a revisão delta

- Não incorporar commits ou estruturas dos PRs #797 ou #802 por inferência.
- Não criar segunda definição da E20.2 v5 nem dos fields já existentes.
- Não implementar oportunidades condicionais ou updates rejeitados.
- Não habilitar runtime consumidor antes do apply e das provas do ambiente correspondente.
- Não relaxar E20.6, tenant safety, atomicidade, append-only ou os invariantes identidade ≠ revisão, latest ≠ approved ≠ future published e configuração ≠ conteúdo.
- Vercel Toolbar e inspeções automáticas são apoio; não bastam como prova isolada.
- Não declarar conformidade WCAG integral.

## 8. Próximo gate

Submeter somente este delta objetivo ao mesmo Analista em `revisao_delta`, preservando a Passagem 2. Avançar ao ABC do roadmap somente com `aprovado para merge do plano-base v2`.
