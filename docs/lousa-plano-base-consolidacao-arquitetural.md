# Consolidação arquitetural — AA-PR01: baseline e revalidação

## 1. Estado e decisões fixas

- Processo: Estrategista Light. Automação: não. Recorte atual: AA-PR01, exclusivamente documental; decisões e mapa aprovados, debate humano dispensado.
- Objetivo: fixar a referência factual para AA-PR02–AA-PR13, sem corrigir arquitetura, performance ou comportamento.
- Fonte decisória: [Auditoria Arquitetural e Consolidação — versão 2](https://docs.google.com/document/d/1UpY8MjOoTHVYX7dEnP4WioEh2wjMXsK2_xOgFX4McBE/edit), seções 5, 9, 10 e 13–16. O relatório completo permanece no Google Docs.
- Fontes locais: `README.md`, `AGENTS.md`, `docs/prompt-estrategista-light.md`, `docs/prompt-executor.md`, `docs/prompt-abc.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/platform-config.md` e os artefatos apontados abaixo.
- Alternativa aprovada: consolidação in loco, incremental. Preservar UI → Providers → Adapters → DB, APIs públicas por owner, autorização, concorrência otimista, append-only, leitores históricos e tracking financeiro fail-open.
- Uma task por recorte no projeto LP Factory; ajustes permanecem na mesma task. Uma branch e um PR por recorte, sem combinar mudança de ownership com migration de performance. Merge final exclusivamente humano.
- Branch AA-PR01: `codex-app/aa-pr01-baseline-revalidacao`. Entrega em draft para avaliação no chat “29/08 auditoria arquitetural”. Os próximos PRs não estão autorizados por este documento a iniciar automaticamente.

## 2. Baseline e revalidação de ARC-001–013

### 2.1 Corte e método

- Main remota, `main` local após `git pull --ff-only` e base da branch: `c16c533322e0bfe0e17ba584e85cb4c018ac4483`, confirmadas em 30/08/2026. Nenhum PR aberto na entrada. A base histórica da auditoria permanece `87e1054ee71bbfc6180540c6e98b4b95312e8d43`; não confundir os cortes.
- Método: inspeção estática focal de funções/imports, scripts, documentos e migrations; consultas Supabase somente `SELECT`, com projeções técnicas ou contagens agregadas. Sem executar funções de negócio, testes SQL mutáveis, DDL, DML ou chamadas de IA.
- `supa#59` — Canal desta inspeção: plugin Supabase oficial conectado, pelos recursos `get_project`, `list_migrations` e `execute_sql`. Em `execute_sql`, foram enviados somente `SELECT` de metadados técnicos ou contagens agregadas; a leitura de definições em `pg_proc` não executou RPCs. A restrição read-only descreve as operações desta tarefa; permissões globais/OAuth do conector não foram auditadas e não devem ser declaradas read-only. Este registro não autoriza escrita, instalação de tooling, benchmark ou nova automação.
- Classificação: **confirmado** = mecanismo permanece; **alterado** = evidência ou delimitação mudou; **resolvido** = causa deixou de existir no recorte verificado; **obsoleto** = premissa deixou de se aplicar. Nenhum desses estados comprova capacidade de carga.
- Leituras operacionais iniciadas em 30/08/2026 às 14:17 America/Sao_Paulo (17:17 UTC). São uma fotografia, não garantia de imutabilidade do ambiente após a consulta.

### 2.2 Resultados individuais

| Achado | Estado na baseline | Evidência reproduzível e limite | Destino aprovado |
| --- | --- | --- | --- |
| ARC-001 | Confirmado | `lib/conversion-content/landing-page/presentation/prompt.ts:1` importa **type** de `lp-builder/generationContextContracts`; E19 também consome E20. Dependência reversa de contrato, sem ciclo de runtime nesse import. | AA-PR03 |
| ARC-002 | Confirmado | `lib/admin/adapters/adminInputCatalogLifecycleValidation.ts:11,160` importa e chama o resolver privado `resolveAccountLandingPageOnboardingConfiguration` para cada configuração. | AA-PR04 |
| ARC-003 | Confirmado | `landingPageWorkspaceAdapter.ts:51,520`: página de 25 LPs; cada item lê latest e, se houver ponteiro, approved. Até 50 consultas adicionais de revisão; índice adequado não elimina round-trips. | AA-PR05 |
| ARC-004 | Confirmado | Mesmo adapter, `validateIdentityMutation():585`: carrega todos os snapshots em páginas de 100 e acumula em memória; decisão usa baselines e latest. Fotografia atual: 7 materializações, não as 6 citadas no corpo histórico do relatório. | AA-PR06 |
| ARC-005 | Confirmado | `lib/admin/adapters/adminInputCatalogLifecycleAdapter.ts:609,823`: oito relações lidas integralmente, páginas de 500, coleções retidas e fingerprint global. Paginação comprova completude, mas não limita memória total. | AA-PR10 |
| ARC-006 | Confirmado | `lib/openai-costs/adapters/lpCostReadModelAdapterCore.ts:21`: 500 linhas × 200 páginas e `accumulated.push`. Ao completar as 200 páginas cheias (100.000 linhas), já retorna `pagination_incomplete`, inclusive no limite exato. Risco administrativo, sem benchmark ou incidente atual demonstrado. | AA-PR11 |
| ARC-007 | Confirmado | Adapter workspace: 915 linhas, seis operações públicas; revalidação chama detail e depois `loadAuthority` novamente (`:298,322`). `readTaxonChain` consulta o vínculo e até três nós sequenciais. | AA-PR07 e AA-PR08 |
| ARC-008 | Confirmado | `app/a/[account]/page.tsx`: 351 linhas; workspace carregado antes da decisão completa owner/admin. `decideAccountJourney` mitiga branching, sem retirar a orquestração transversal da rota. | AA-PR09 |
| ARC-009 | Confirmado | `generationContextAdapter.ts`, `onboardingConfiguration.ts`, `landingPageWorkspace.ts` e fingerprint legado Admin mantêm compatibilidade em caminhos atuais. DB: zero E19.2 pré-handoff, uma bound e residências E19.5 presentes para a LP observada. Isso não autoriza retirar readers ou rollback. | AA-PR12 |
| ARC-010 | Alterado | Drift E20.7 e corte E21.4 reconciliados; o ABC deste PR corrigiu 20.6.5 e 21.2.4 do roadmap para registrar a revisão operacional 2 de suficiência ativa em Preview e Production. Resta em `docs/platform-config.md` 3.5 a promoção/ativação dessa revisão como passo futuro; arquivo fora do ajuste autorizado. | Correção parcial AA-PR01; resíduo exige ABC próprio autorizado |
| ARC-011 | Alterado | `package.json` ainda omite os cinco validators listados em 2.4. Inventário atual: 23 arquivos `validation-cases`, sendo 14 com `readFileSync` e 1 adicional com `readFile`; o relatório contava 22. A lacuna de cobertura permanece. | AA-PR02; conversão de asserts somente nos recortes respectivos |
| ARC-012 | Confirmado | Footprints reconfirmados via `gh pr view`: #826=11, #830=20, #835=43, #836=9, #838=10 e #839=3 arquivos. Registrar arquivos, owners e domínios por recorte, separando código, QA e documentação; quantidade isolada não prova acoplamento. | Métrica transversal, sem PR próprio |
| ARC-013 | Confirmado | Busca em `app/` e `lib/` encontra somente declarações, exports e testes para os dois entrypoints E20.7. `dynamicMarketResearchOpenAiAdapter.ts:57,319`: timeout máximo 45 s e hosted exige `supabase_operational` revisão 2+. E20.7 continua bootstrap 1; custo E21.4 cobre somente texto/imagem E19. | AA-PR13, risco futuro; nenhum cutover autorizado |

- Paths abreviados do workspace: `lib/lp-builder/adapters/landingPageWorkspaceAdapter.ts` e `lib/lp-builder/adapters/generationContextAdapter.ts`; demais arquivos E19 citados residem em `lib/lp-builder/`. Linhas referem-se à baseline acima.
- Severidades da versão 2 preservadas: alta em ARC-003/004/005; média nos demais. Nenhuma evidência inspecionada exige antecipar uma correção urgente ou alterar a sequência aprovada.

### 2.3 Confronto Supabase, migrations e contratos

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
- Resultado: não identificada divergência material migrations–Supabase no recorte inspecionado. Há drift documental operacional delimitado em 2.4. Flags/deployments, UX hospedada, benchmark, carga e explorabilidade não foram verificados nem inferidos a partir do banco.

### 2.4 Deltas e validação documental

- ARC-010: ABC exclusivo para `docs/roadmap.md`, aplicado sobre `15848fce83d408b38ebc074a095fa020777c0e12`: OP1 ajusta o status de 20.6.5; OP2 substitui o bootstrap/promoção futura pela revisão operacional 2 ativa; OP3 remove a promoção futura do último bullet; OP4 corrige a revisão em 21.2.4. Cabeçalho atualizado para v1.5.196, 30/08/2026. SELECT read-only reconfirmou suficiência na revisão operacional 2 e pesquisa dinâmica na revisão 1 em ambos os ambientes. Não foram inferidos flags, redeploy, QA hospedada ou conclusão integral da E20.6.5. Resíduo: o bullet “Progressão operacional” de `docs/platform-config.md` 3.5 ainda orienta provar, promover e ativar a revisão 2 como passo futuro. Esse documento foi preservado pelo limite explícito do ajuste; ARC-010 permanece alterado, sem resolução global ou nova etapa no mapa.
- Cinco scripts fora do check: `validate:account-members`, `validate:e11-checkout`, `validate:e11-commercial-experience`, `validate:admin-landing-page-structure`, `validate:lp-builder-onboarding-journey`. Não alterar `package.json` no AA-PR01.
- Reprodução do inventário: enumerar `rg --files` filtrando `validation-cases`; contar arquivos com `readFileSync` e arquivos adicionais com `\breadFile\s*\(`. O novo arquivo de mailbox da automação integra o universo de arquivos, mas não adiciona leitor direto de source.
- Gates de entrega: baseline preservada; nenhum PR aberto na entrada e draft AA-PR01 [#847](https://github.com/AlcinoAfonso/LP-Factory-10/pull/847) mantido. Inventário de migrations comparado com igualdade exata; `main..HEAD`, `main...HEAD` e `git diff --check` revisados; diff acumulado restrito a esta lousa e ao ABC focal de `docs/roadmap.md`, sem secrets ou alterações de banco/workflows/runtime. ARC-012 deste PR: dois arquivos documentais, owner documental de consolidação, zero domínios produtivos alterados.
- `npm ci` e `npm run check`: não aplicáveis ao diff documental. Build, dev server, testes mutáveis e QA visual: não aplicáveis. A inspeção de scripts não constitui execução de validators.
- Gestor de Updates: consulta read-only concluída sobre o candidato `b97a71744a3c6e71f6bd9501c88ce8df8b6f8630` do PR #847. Veredito: **updates aplicáveis com patches autossuficientes**; incorporados literalmente apenas `supa#59` (2.1) e `supa#2` (2.3), como referência/trava, sem novo gate. Quatro catálogos consultados: `docs/supa-up.md`, `docs/vercel-up.md`, `docs/github-up.md`, `docs/prod-up.md`. Oportunidades condicionais `supa#35`, `supa#40` e `supa#57` permanecem no parecer integral do PR, sem implementação ou nova etapa. Nenhuma decisão humana ou ampliação de escopo exigida pelo parecer.

## 3. Sequência AA-PR02–AA-PR13 e critérios de entrada

- Entrada comum: predecessor avaliado e mergeado pelo humano, base reconfirmada, escopo próprio aprovado e ausência de gatilho de parada. Preservar comportamento público, segurança e leitura histórica. Medir antes de escolher solução de performance; o mapa não prescreve RPC, read model, token, agregação SQL ou framework.

| PR | Recorte / processo do mapa | Critério específico de entrada e validação |
| --- | --- | --- |
| AA-PR02 | Cinco validators / Light, Sol Medium | AA-PR01 aceito; integrar apenas as cinco suites e executar check canônico. |
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

- Não alterar código produtivo, runtime, UI, comportamento, `package.json`, migrations, RPCs, tabelas, rotas, jobs, agentes, automações, infraestrutura, configurações externas ou dados. A consulta read-only ao Gestor de Updates não cria agente no produto.
- Não corrigir N+1, scans, dependências, adapters ou legado; não iniciar AA-PR02–AA-PR13; não duplicar o relatório nem transformar propostas condicionais em arquitetura obrigatória.
- Parar e devolver ao Estrategista se houver correção urgente prioritária, divergência material migrations–Supabase, necessidade de escrita no banco, perda do caráter exclusivamente documental ou evidência que altere a sequência aprovada.
- Interromper o Light se o Gestor de Updates exigir banco, infraestrutura, mudança de segurança ou ampliação arquitetural. Fonte crítica ausente ou ambiguidade material também bloqueia conclusão.
- Não declarar resolvido o drift inteiro por corrigir apenas parte, nem confundir bootstrap com prova de transporte. Não fazer merge; devolver draft, evidências, limitações e decisões pendentes ao chat de origem.
