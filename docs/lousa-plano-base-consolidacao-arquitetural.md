# Consolidação arquitetural — lousa operacional do plano

## 1. Estado e decisões fixas

- Estado: AA-PR01–AA-PR10 concluídos e mergeados; AA-PR11 implementado no [PR #859](https://github.com/AlcinoAfonso/LP-Factory-10/pull/859), com validação local e QA aprovados, sem merge. Checks/review do HEAD são conferidos no PR antes da entrega. AA-PR12 e AA-PR13 não iniciados; os processos de cada recorte permanecem na seção 3.
- Objetivo: manter a referência operacional única e atual do plano da auditoria, com resultados, evidências, riscos residuais e próximo recorte, sem ampliar escopo ou prescrever antecipadamente soluções.
- Fonte operacional única: esta lousa. [Auditoria Arquitetural e Consolidação — versão 2](https://docs.google.com/document/d/1UpY8MjOoTHVYX7dEnP4WioEh2wjMXsK2_xOgFX4McBE/edit) é somente o relatório histórico de origem, sem autoridade sobre a execução atual. PRs e comentários sustentam os resultados; contratos canônicos continuam nos documentos próprios.
- Fontes locais: `README.md`, `AGENTS.md`, `docs/prompt-estrategista-light.md`, `docs/prompt-executor.md`, `docs/prompt-abc.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/platform-config.md` e os artefatos apontados abaixo.
- Alternativa aprovada: consolidação in loco, incremental. Preservar UI → Providers → Adapters → DB, APIs públicas por owner, autorização, concorrência otimista, append-only, leitores históricos e tracking financeiro fail-open.
- Uma task por recorte no projeto LP Factory; ajustes permanecem na mesma task. Uma branch e um PR por recorte, sem combinar mudança de ownership com migration de performance. Aplicam-se os canais de publicação e merge permitidos por `AGENTS.md`.
- Autorizações humanas permanentes já concedidas para AA-PR11–AA-PR13: QA não destrutiva, uso das contas de teste, chamadas OpenAI necessárias, marcação como `ready` e merge remoto após aprovação dos gates. O registro não amplia permissões técnicas da plataforma nem autoriza novas ações destrutivas; o handoff atual autoriza o executor a entregar somente AA-PR11 em um PR ready, com QA autenticado próprio e sem merge.
- Origem: AA-PR01 entregue pelos PRs #847 e #848; o complemento #848 encerrou ARC-010 e satisfez a trava de entrada do AA-PR02. A sequência AA-PR02–AA-PR10 foi concluída pelos PRs #849–#857, respectivamente, conforme 2.4.
- Manutenção: o executor de cada recorte atualiza esta lousa na própria branch, registrando somente resultado, métrica, evidência, risco residual e próximo recorte. O orquestrador confere a atualização antes do merge. Não duplicar corpos de PR, roadmap ou documentação pertencente a outros documentos.

## 2. Baseline e revalidação de ARC-001–013

### 2.1 Corte e método

- Baseline de entrada AA-PR11: `4ba09c96e76091a210541679a124d63ce88fadd0`, merge documental do PR #858 sobre o AA-PR10 (#857); HEAD da worktree, `main` remota, PR #858 MERGED e ausência de PRs abertos reconfirmados em 31/08/2026. A implementação descartada do AA-PR11 não foi inspecionada nem reaproveitada; o oráculo dos testes foi congelado exclusivamente desta baseline.
- Cortes históricos: auditoria em `87e1054ee71bbfc6180540c6e98b4b95312e8d43`; revalidação AA-PR01 em `c16c533322e0bfe0e17ba584e85cb4c018ac4483`, de 30/08/2026. Não confundir esses cortes com o estado operacional atual.
- Método AA-PR11: benchmark sintético local antes da decisão, inspeção focal read-only pelo plugin Supabase oficial e EXPLAIN ANALYZE do leitor e de seu SELECT, sem DDL/DML, seed remoto ou chamada de geração. O processo Estrategista confirmou consumo incremental com memória O(página + grupos de saída), preservando o contrato completo e sem migration; a reconciliação dos demais achados permanece histórica.
- `supa#59` — Canal da inspeção histórica AA-PR01: plugin Supabase oficial conectado, pelos recursos `get_project`, `list_migrations` e `execute_sql`. Em `execute_sql`, foram enviados somente `SELECT` de metadados técnicos ou contagens agregadas; a leitura de definições em `pg_proc` não executou RPCs. A restrição read-only descreve as operações daquele recorte; permissões globais/OAuth do conector não foram auditadas e não devem ser declaradas read-only. Este registro não autoriza escrita, instalação de tooling, benchmark ou nova automação.
- Classificação: **resolvido no recorte** = tratamento entregue e mergeado conforme evidência vinculada; **pendente** = tratamento reservado ao próximo recorte indicado; **transversal** = acompanhamento contínuo. As conclusões são limitadas às provas dos PRs, não comprovam capacidade global de carga nem ampliam QA realizada.
- Leituras históricas do AA-PR01 iniciadas em 30/08/2026 às 14:17 America/Sao_Paulo (17:17 UTC). São fotografias, não garantia de imutabilidade do ambiente; seus números e versões não devem ser usados como estado vivo pós-AA-PR10.

### 2.2 Resultados individuais

| Achado | Estado atual | Resultado, evidência e limite | Destino aprovado |
| --- | --- | --- | --- |
| ARC-001 | Resolvido no recorte | Compositor textual realocado ao LP Builder; aresta conversion-content → lp-builder 1 → 0 e 12 comparações integrais aprovadas. Grafo focal, não prova de DAG global. | AA-PR03 / #850 concluído |
| ARC-002 | Resolvido no recorte | API pública focal E19 substituiu o consumo privado pelo Admin; dependência no resolver interno 1 → 0, decisão de compatibilidade preservada. Sem promessa de performance. | AA-PR04 / #851 concluído |
| ARC-003 | Resolvido no recorte | Embeds latest/approved eliminaram consultas por LP: fixture de 25 LPs aprovadas, 58 → 8 requests diretos e 50 → 0 adicionais de revisão; 56 cenários equivalentes. Métrica sintética, não redução de bytes ou latência. | AA-PR05 / #852 concluído |
| ARC-004 | Resolvido no recorte | Leitura atômica de até quatro snapshots substituiu o scan histórico; migration, RPC e três índices confirmados no comentário pós-merge de #853. Tamanho individual do snapshot e custo dos índices permanecem limites. | AA-PR06 / #853 concluído |
| ARC-005 | Resolvido no recorte | Merge de sete fluxos ordenados, até duas páginas válidas por fluxo, além de taxonomia e payloads correntes; fingerprint e compatibilidade na mesma passagem. Leituras/trabalho continuam lineares; limite de páginas não é teto de bytes/RSS nem snapshot transacional. | AA-PR10 / #857 concluído |
| ARC-006 | Implementado; merge pendente | Consumo incremental sem array histórico ou Set por tentativa; ordenação completa tentativa/workload e progressão estrita. N=99.999/G=10: heap retido 51,67 → 0,46 MiB; 100.000, 100.001, 300.001 e 1.000.001 completos. O(página + saída), sem teto de eventos; memória e transporte da saída, materialização PL/pgSQL e Sort repetido continuam limites. | AA-PR11 / #859 — QA aprovado |
| ARC-007 | Resolvido no recorte | AA-PR07: revalidação sintética de cadeias 1/2/3 níveis, 13/15/17 → 8/9/10 requests internos, sem snapshot transacional. AA-PR08: autoridade extraída em módulo interno, seis operações públicas preservadas e 4.258 comparações; imports runtime diretos 10 → 8, sem reduzir dependências transitivas. | AA-PR07 / #854 e AA-PR08 / #855 concluídos |
| ARC-008 | Resolvido no recorte | Loader server-only local da Account Journey extraído; 550 cenários comparados e módulos runtime diretos da page 14 → 8. IO e leitura antecipada do workspace preservados; não há alegação de redução de queries. | AA-PR09 / #856 concluído |
| ARC-009 | Pendente | Achado de origem em `lib/lp-builder/adapters/generationContextAdapter.ts`, `lib/lp-builder/onboardingConfiguration.ts`, `lib/lp-builder/landingPageWorkspace.ts` e fingerprint legado Admin. Compatibilidade e readers históricos permanecem sujeitos ao inventário, replay v1/v3 e janela de rollback do AA-PR12. Contagens históricas do AA-PR01 não autorizam retirada de caminhos. | AA-PR12 |
| ARC-010 | Resolvido no recorte | Roadmap reconciliado em #847 e resíduo de `docs/platform-config.md` encerrado em #848. A revisão ativa não comprova, por si, flags, redeploy, QA ou rollout E20.6.5. | AA-PR01 / #847 e #848 concluídos |
| ARC-011 | Resolvido no recorte | Cinco validators integrados ao check canônico por #849; 49/49 casos das cinco suites aprovados. Não implica conversão geral de asserts baseados em source. | AA-PR02 / #849 concluído |
| ARC-012 | Transversal | Contagem de arquivos por PR registrada em 2.4; owners, domínios e separação código/QA/documentação permanecem nos PRs. Quantidade isolada não prova acoplamento. | Acompanhar em cada recorte, sem PR próprio |
| ARC-013 | Pendente | Fotografia de origem: somente declarações, exports e testes dos dois entrypoints E20.7 em `app/` e `lib/`; `dynamicMarketResearchOpenAiAdapter.ts` com timeout máximo de 45 s e transporte hospedado exigindo `supabase_operational` revisão 2+. E20.7 bootstrap 1; custos E21.4 cobrem texto/imagem E19. Cutover permanece condicionado aos critérios de AA-PR13; autorizações gerais não dispensam esses gates. | AA-PR13 |

- Resultados anteriores ao AA-PR11 são os publicados nos PRs vinculados em 2.4; as provas novas de ARC-006 estão abaixo. O estado remoto de merge prevalece sobre trechos históricos dos corpos que ainda digam draft, aberto ou sem merge.
- Limite aceito de AA-PR08: cenários positivos hospedados de workspace, configuração, histórico e preview histórico não foram executados; a aceitação específica apoiou-se na extração literal e provas locais. Não generalizar essa dispensa aos AA-PR11–AA-PR13. A sequência aprovada permanece inalterada.

### 2.3 Confronto Supabase, migrations e contratos

- Registro histórico AA-PR01: os bullets abaixo descrevem exclusivamente a fotografia de 30/08/2026, não uma reinspeção pós-AA-PR10. A atualização posterior do AA-PR06 está indicada ao final; não usar as 44 migrations ou contagens antigas como inventário vivo.
- Projeto autorizado por `docs/platform-config.md`: `dpikmjgiteuafsbaubue` / LP-Factory-10, `ACTIVE_HEALTHY`, PostgreSQL `17.6.1.063`. Preview e Production compartilham o projeto; unidades E21 são segregadas por ambiente.
- Histórico: 44 versões/nomes no repositório e 44 no Supabase, de `20260611172930` a `20260829211349`; inclui E19.5, conflitos PostgREST, custos E21.4 e E20.7. Correspondência do histórico não equivale a diff integral de schema.
- Revisões: índice `(account_id, landing_page_id, revision_number DESC)` e unicidades de revisão, attempt e identidade composta presentes, coerentes com `docs/schema.md` 1.27 e migrations de revisões/workspace.
- Residências: 1 LP, 7 materializações, 1 configuração E19.2 bound, 0 pré-handoff, 1 compartilhada E19.5 e 1 por LP; join tenant-scoped confirma ambas para a LP operacional. Nenhum valor de configuração, snapshot, nome ou identificador pessoal foi extraído.
- Nove tabelas focais E19/E21: RLS habilitado, zero policies, sem SELECT para anon/authenticated e com SELECT service_role; contagens de triggers coerentes com as residências documentadas. Inspeção focal, não auditoria global de segurança.
- `supa#2` — Limite da evidência de segurança: esta baseline não consultou o Security Controls Dashboard nem executou o Advisor. A ausência de policies deve ser interpretada junto aos grants e à residência service-only prevista em `docs/schema.md`; isoladamente, não comprova vulnerabilidade, resolução de achado ou validação global de segurança. Este registro não autoriza alterar RLS, policies, grants ou configurações.
- RPCs `save_account_landing_page_configuration_v1` e `append_account_landing_page_materialization_v2`: definições inspecionadas, SECURITY INVOKER, search_path fixado, EXECUTE service_role e sem EXECUTE anon/authenticated. Save mantém lock da LP e comparação de latest; append v2 aceita catálogo 5/6 e preserva tokens de revisão. Nenhuma RPC foi executada.
- Paridade focal adicional: corpos normalizados de save e append iguais às migrations efetivas (`20260824180000` com transformação de conflitos `20260827203000`, e `20260829211349`, respectivamente); seis constraints de workload/modalidade E21 coerentes com a ampliação E20.7 em `20260829171107`.
- E21: 12 unidades, sem candidata ou revisão pendente. Pesquisa dinâmica E20.7: revisão 1/bootstrap/repo_catalog, Luna + high em ambos os ambientes. Avaliação de suficiência E20.6.5: revisão 2/operational/openai_api, Terra + low em ambos. Os demais quatro workloads permanecem na revisão 1; o gate adicional de revisão 2 da E20.7 não deve ser generalizado a eles.
- Custos: 8 eventos, 1 singleton; corte Production `2026-08-29 21:55:36.827207+00`, igual ao schema. Catálogo: zero drafts; taxon piloto ativo confirmado em reviewed version 6.
- Resultado: não identificada divergência material migrations–Supabase no recorte inspecionado. Drift documental operacional de ARC-010 reconciliado conforme 2.4. Flags/deployments, UX hospedada, benchmark, carga e explorabilidade não foram verificados nem inferidos a partir do banco.
- Delta posterior comprovado: [comentário de fechamento do AA-PR06](https://github.com/AlcinoAfonso/LP-Factory-10/pull/853#issuecomment-5471669817) confirma migration `20260830201842` aplicada, RPC STABLE/SECURITY INVOKER, EXECUTE exclusivo de service_role, três índices válidos/prontos, tenant divergente sem linhas e seleção dentro do limite de quatro snapshots. QA pós-merge aprovada sem correção adicional; não se trata de nova auditoria global nesta task.

### 2.4 Deltas e validação documental

- AA-PR11: oito arquivos, um owner produtivo (`openai-costs`), dois adapters existentes ajustados, zero arquivo produtivo novo; demais deltas são provas focais, fixture da baseline e esta lousa. Costs API, contratos públicos, UI, autorização, tracking append-only, banco, migrations, workflows e secrets preservados. ABC: sem delta canônico necessário; esta lousa concentra o resultado do recorte.
- Provas locais reproduzíveis: `npm run validate:openai-costs` inclui 90 comparações integrais de DTO/erros contra fixture versionada (sem depender de Git/rede), mais casos de duplicata entre páginas, empate de timestamp, ordem completa, ausência de progresso, página curta/vazia/416 e erro tardio sem sucesso parcial. `node --expose-gc --import tsx lib/openai-costs/read-model-benchmark.ts` isola cada cenário em processo novo, mede heap retido pós-GC e pico amostrado; tempos excluem GC e não representam latência hospedada.
- Escala local: G=10, N=10.000/99.999/100.000/100.001/300.001 mantém heap retido incremental de aproximadamente 0,46 MiB. N=1.000.001 conclui 2.002 leituras, +0,47 MiB retidos e +26,35 MiB de pico amostrado, sob heap V8 de 64 MiB. Baseline falha já em 100.000. Página curta exige confirmação de término, acrescentando uma leitura quando necessário. Sem alegação de custo SQL reduzido.
- Alta cardinalidade G=N=99.999: saída idêntica de 54.099.746 bytes; heap retido 114,27 → 110,11 MiB e pico amostrado 221,72 → 183,42 MiB. A saída completa permanece O(G); isso não comprova suporte hospedado a esse payload. [Vercel documenta limite de 4,5 MB](https://vercel.com/docs/functions/limitations) para resposta não-streamed, com tratamento distinto para streaming; serialização RSC, memória, duração e transporte continuam limites preexistentes, sem novo volume arbitrário aprovado no produto.
- Query plan focal: quatro tentativas reais, período 01–30/08, projeção sanitizada da RPC existente. Baseline em offset 0/2: `Limit → Function Scan`, 3,819/68,2 ms; ordenação externa final em `attempt_id, workload`, offset 0/2: `Limit → Sort → Function Scan`, quicksort 26 kB, 4,741/21,256 ms. SELECT interno usa `started_period_idx` já aplicado, 18 shared hits/0,197 ms. Sessões e aquecimento variam; esses números não medem escala PostgreSQL nem ganho de latência. Materialização e sort são repetidos por página; sem snapshot transacional entre leituras. Projeto saudável, 4 started + 4 terminal, RLS e service-only preservados; zero escrita remota.
- Gates AA-PR11: `npm ci`, `npm run check`, `git diff --check` e revisão `main..HEAD`/`main...HEAD` aprovados; 24 warnings de lint preexistentes, zero erro. Suite focal também aprovada com GIT_DIR inválido. QA próprio no Preview do runtime `ab6fe6bb` (deployment `2NDZhqJjgGw9oDmrUrv1TQYTFRGR`) aprovado: período atual, conta/LP/texto/imagem, período fechado com reconciliação negativa, vazio com cobertura completa, INVALID_PERIOD acima de 180 dias e conta comum autenticada bloqueada no Admin, com acesso à própria conta preservado. Nenhum erro de console, geração ou escrita financeira; banco permanece com oito eventos. Estado dos checks/review do commit final e evidências de fechamento residem no PR #859; build local não executado. Próximo recorte AA-PR12 ainda não iniciado; sem merge nesta task.

- Reconciliação direta pelo GitHub em 31/08/2026: todos os PRs abaixo estão `MERGED`, com base `main`. Resultado e risco residual por achado em 2.2; evidência integral nos corpos e comentários vinculados. SHAs abaixo são de merge; arquivos são a contagem total de cada PR, não soma de arquivos únicos do programa.

| Recorte concluído | PR / evidência | Merge | Arquivos |
| --- | --- | --- | ---: |
| AA-PR01 — baseline | [#847](https://github.com/AlcinoAfonso/LP-Factory-10/pull/847) | `6a9d3dd2` | 2 |
| AA-PR01 — fechamento ARC-010 | [#848](https://github.com/AlcinoAfonso/LP-Factory-10/pull/848) | `a34184c9` | 2 |
| AA-PR02 — validators | [#849](https://github.com/AlcinoAfonso/LP-Factory-10/pull/849) | `5b924b42` | 1 |
| AA-PR03 — ciclo tipado | [#850](https://github.com/AlcinoAfonso/LP-Factory-10/pull/850) | `68e39364` | 7 |
| AA-PR04 — API pública E19/E20 | [#851](https://github.com/AlcinoAfonso/LP-Factory-10/pull/851) | `719e3134` | 7 |
| AA-PR05 — N+1 do workspace | [#852](https://github.com/AlcinoAfonso/LP-Factory-10/pull/852) | `a024191c` | 4 |
| AA-PR06 — identidade sem scan histórico | [#853](https://github.com/AlcinoAfonso/LP-Factory-10/pull/853) | `f8a06c1d` | 8 |
| AA-PR07 — leituras de autoridade | [#854](https://github.com/AlcinoAfonso/LP-Factory-10/pull/854) | `5a6dbc54` | 4 |
| AA-PR08 — decomposição do workspace | [#855](https://github.com/AlcinoAfonso/LP-Factory-10/pull/855) | `fcafbab2` | 4 |
| AA-PR09 — loader da Account Journey | [#856](https://github.com/AlcinoAfonso/LP-Factory-10/pull/856) | `756415c1` | 4 |
| AA-PR10 — scan do lifecycle E20 | [#857](https://github.com/AlcinoAfonso/LP-Factory-10/pull/857) | `71f10281` | 8 |

- ARC-010 encerrado pelo complemento #848; trava AA-PR02 satisfeita. Os cinco scripts antes ausentes — `validate:account-members`, `validate:e11-checkout`, `validate:e11-commercial-experience`, `validate:admin-landing-page-structure` e `validate:lp-builder-onboarding-journey` — foram integrados por #849. Nenhuma pendência anterior ao AA-PR02 é transportada como bloqueio atual.
- Validação histórica do PR #858: `main..HEAD`, `main...HEAD` e `git diff --check`; um arquivo documental, zero domínios produtivos. `npm ci` e `npm run check` não aplicáveis naquele PR. Resultados dos recortes anteriores não são testes repetidos nesta task.
- Histórico do Gestor de Updates no AA-PR01: consulta read-only sobre o candidato `b97a71744a3c6e71f6bd9501c88ce8df8b6f8630` do PR #847; patches `supa#59` (2.1) e `supa#2` (2.3) incorporados como referência/trava, sem novo gate. Parecer e oportunidades condicionais permanecem no PR histórico; esta reconciliação não reabre avaliação nem cria etapa.

## 3. Sequência AA-PR02–AA-PR13 e critérios de entrada

- Entrada comum: predecessor avaliado e mergeado conforme a autorização humana e os canais permitidos, base reconfirmada, escopo próprio aprovado e ausência de gatilho de parada. Preservar comportamento público, segurança e leitura histórica. Medir antes de escolher solução de performance; o mapa não prescreve RPC, read model, token, agregação SQL ou framework.
- Estado do mapa: AA-PR02–AA-PR10 concluídos, com critérios abaixo mantidos como histórico do recorte; AA-PR11 em validação, seguido por AA-PR12 e AA-PR13 ainda não iniciados. Seus critérios permanecem vigentes e integrais.

| PR | Recorte / processo do mapa | Critério específico de entrada e validação |
| --- | --- | --- |
| AA-PR02 | Cinco validators / Light, Sol Medium | Concluído: AA-PR01 aceito, drift residual de ARC-010 encerrado em #848 e trava satisfeita; cinco suites integradas e check canônico aprovado em #849. |
| AA-PR03 | ARC-001 / Light, Sol Medium | AA-PR02; direção de imports e contratos confirmada; validar DAG e geração sem mudança funcional. |
| AA-PR04 | ARC-002 / Light, Sol High | AA-PR03; contrato público focal de compatibilidade E19; matriz de configurações equivalente. |
| AA-PR05 | ARC-003 / Light condicionado, Sol High | AA-PR04; medir queries para 25 LPs; escolher menor solução que estabilize round-trips; necessidade de banco força processo completo. |
| AA-PR06 | ARC-004 / Estrategista, Sol High | AA-PR05; baseline/latest e concorrência demonstrados; leituras independentes do histórico; migration só se necessária. |
| AA-PR07 | ARC-007, autoridade / Estrategista, Sol High | AA-PR06; distinguir contexto estável de revalidação concorrente; casos negativos de auth, papéis e gates. |
| AA-PR08 | ARC-007, decomposição / Light condicionado, Sol High | AA-PR07; responsabilidades e massa de código justificam extrações focais, sem camada global. |
| AA-PR09 | ARC-008 / Light condicionado, Sol Medium | AA-PR08; avaliar necessidade real de loader; validar papéis, estados e equivalência de UI. |
| AA-PR10 | ARC-005 / Estrategista, Sol High | AA-PR09; benchmark, memória/cardinalidade e prova integral antes de escolher estratégia ou migration. |
| AA-PR11 | ARC-006 / Estrategista, Sol High | AA-PR10; benchmark e query plan; memória limitada, cobertura e ausência de teto artificial no período suportado. |
| AA-PR12 | ARC-009 / Estrategista, Sol High | AA-PR11; inventário read-only, replay v1/v3 e janela de rollback aprovada; retirar somente caminhos comprovadamente inativos. |
| AA-PR13 | ARC-013 / Estrategista, Sol High | AA-PR12; matching estável, revisão operacional 2+ própria de E20.7 por ambiente, budget/timeout, custo ou exceção explícita e rollout aprovado. |

- ARC-010 não cria PR próprio quando resolvido; o drift aqui delimitado não adiciona etapa ao mapa. ARC-012 não cria PR próprio: arquivos/owners/domínios são medidos transversalmente, sem meta numérica arbitrária.

## 4. Escopo negativo e critérios de parada

- No AA-PR11, alterar somente o leitor interno de custos E21, suas provas e esta lousa. Não alterar contrato/UI, Costs API, tracking, README, AGENTS, demais documentos, Google Docs, migrations, banco remoto, workflows, configuração ou infraestrutura.
- Não iniciar AA-PR12 ou AA-PR13 nem fazer merge nesta task; não inspecionar ou reaproveitar implementação descartada, stashes ou branches antigas, reabrir recortes concluídos ou transformar propostas condicionais em arquitetura obrigatória.
- Parar e reportar divergência material, fonte crítica ausente, efeito externo não autorizado ou necessidade de ultrapassar o recorte; não extrapolar medições sintéticas para capacidade hospedada.
- Nos recortes futuros, preservar critérios de entrada, escopo aprovado e gates aplicáveis. Correção urgente, divergência material migrations–Supabase, mudança de segurança ou ampliação arquitetural não coberta exigem retorno ao Estrategista; autorizações permanentes não dispensam esses limites.
- Não inferir QA, rollout ou capacidade a partir de merge, revisão ativa ou checks isolados. Entrega desta task: um PR AA-PR11 ready, após gates, sem merge; próximo recorte AA-PR12 permanece não iniciado.
