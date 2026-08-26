# Matriz de consolidação — E21.3

## 1. Referências imutáveis

- Caso: `E21.3 — Evidências e avaliação de custo-benefício dos workloads OpenAI`.
- PR de origem: `#813`, mergeado em `main`.
- Branch/head do PR de origem: `codex-app/e21-3-evidencias-custo-beneficio@8c18690b84962cc999d20e4f795009483c71392a`.
- Merge commit e base congelada: `4ecbe3a7138d227e24c2d17c68477a916c8fd864`.
- Plano-base v1: `docs/lousa-plano-base-e21-3.md`, blob `08b5ed6bb6bca78d12ec131b06f38c854eb1963f`.
- Snapshot de `docs/roadmap.md`: blob `a5cef958d3760cfbe2708b42b37e6d86dc4b16c1`.
- Plano conceitual: `N/A`.
- Plano-base v2 inicial: commit `f37c8655d4904882bc644d22204c9ed52d0157c9`, blob `420ee98edf33f6b609678466599f11c3205696e9`.
- Delta da Passagem 1: commit `54bdcae459c7577309b2cda33d54e680c84d377f`, blob `af885bd6dd41f635b5b6d8a93afd415511a8bcb7`.
- Plano-base v2 aprovado antes da decisão superveniente: commit `53a81d4c`, blob `b43655863af6e38ac948c896ee6dcf6c6b35363a`.
- Plano-base v2 vigente após a decisão superveniente: commit `5c0deb82fb23a43a5e12ea5d8e8d4c6396584777`, blob `4774e50afd3ac3d3149195a059858a11edc746ff`.
- Roadmap reconciliado: commits `821a01be643f2d38d715270eb5f2a0655bb44d63`, `3acd3db2a5ad1b01489c3654043f4631fb788576` e `a26d02ab05adcba6b154937b192cde50d53feee0`, blob vigente `69b000f2c03fac296a1b18f2bb3b49dbd0b05038`.
- Branch/worktree: `codex-app/e21-3-orquestracao` em `C:\Dev\GitHub\LP-Factory-10-e21`.

## 2. Decisões humanas e limites

- `DH-E21.3-01 = B`: usar fixture versionada, autorizada e representativa de `Corretor Imóveis`, no contrato v4 e sem dados reais.
- `DH-E21.3-02 = A`: cegamento de apresentação, sem alegação de confidencialidade contra inspeção técnica.
- `DH-E21.3-03 = A`: não implementar cálculo tarifário no runtime; custo permanece não confirmado e eventual cálculo é documental.
- `DH-E21.3-04`: separar fisicamente **Configuração OpenAI** em `/admin/workloads-openai` de **Testes OpenAI** em `/admin/testes-openai`; a primeira preserva catálogo e lifecycle, a segunda contém somente a comparação E21.3 e não cria candidata, ativa configuração ou altera Production.
- A baseline da rodada é a revisão ativa do ambiente; candidatas elegíveis usam proveniência experimental verdadeira e não revisão ativa fictícia.
- A comparação não persiste resultados, não altera catálogo ou lifecycle, cria somente a rota mínima autorizada `/admin/testes-openai`, não cria banco, dashboard, serviço, infraestrutura ou automação e não otimiza a BSG.
- As classes usadas são `preservação`, `extensão adjacente necessária e proporcional` e `expansão`.
- Oportunidade estratégica condicional não autoriza implementação neste recorte.

## 3. Parecer estrutural

Parecer integral preservado pelo orquestrador. Conclusão original: `bloqueado por decisão humana`; as três decisões foram resolvidas por `B/A/A` antes da consolidação da v2.

| ID | Achado e classificação original | Relação com o escopo | Classe de consolidação | Tratamento | Destino/localização | Evidência |
|---|---|---|---|---|---|---|
| `GE-E21.3-01` | Objetivo, unidade de comparação, separação texto/imagem e residência aderentes. | Confirma a fronteira da v1. | preservação | Incorporado sem delta material. | Plano §§1–4. | BSG congelada, lifecycle humano e escopo negativo preservados. |
| `GE-E21.3-02` | Ownership físico entre UI, action, adapters, catálogo e transporte estava aberto. | Necessário para evitar duplicação e acesso indevido. | extensão adjacente necessária e proporcional | A decisão humana superveniente substitui a composição na rota existente: Configuração OpenAI permanece em `/admin/workloads-openai`; Testes OpenAI usa somente `/admin/testes-openai`, com SSR/guard, componente client, action fina e adapter server-only que reutiliza o gerador E19.4. | Plano §§1.7 e 3.1. | Separação mínima de rota e navegação; sem parser, transporte, serviço ou infraestrutura paralelos. |
| `GE-E21.3-03` | Autoridade do caso admitia draft real ou fixture. | Mudava leitura de banco e tratamento de dados. | preservação | Decisão humana `B`: fixture v4 autorizada, sem leitura real. | Plano §§1.6, 2.4 e 3.1. | Mesmo pacote imutável para todas as configurações. |
| `GE-E21.3-04` | Força do cegamento não estava definida. | Alterava boundary de confidencialidade e persistência. | preservação | Decisão humana `A`: cegamento somente apresentacional, explicitamente sem confidencialidade técnica. | Plano §§1.6, 2.4 e 3.1. | Identidade e métricas não renderizadas antes do registro completo. |
| `GE-E21.3-05` | Residência tarifária runtime versus documental estava aberta. | Evita precisão financeira fabricada. | preservação | Decisão humana `A`: sem tabela ou cálculo monetário runtime. | Plano §§1.6, 2.2, 3.1 e 4.1. | Custo `não confirmado`; decisão financeira somente após fonte oficial confirmada. |
| `GE-E21.3-06` | `proofLandingPageContext` v3 é incompatível com o gerador v4. | Impede reuso inválido e reabertura lateral da E21.2. | preservação | Incorporado: fixture própria v4 tipada; correção da prova v3 permanece fora do recorte. | Plano §§3.1 e 4.1. | Nenhum import ou cast da fixture de prova. |
| `GE-E21.3-07` | Banco corretamente fora do recorte. | Preserva schema e lifecycle já aplicados. | preservação | Incorporado como contrato repo-only e proibição de RPC mutável. | Plano §§2.1, 3.1 e 4.1. | Diff sem migration, teste/snippet SQL, RLS, policy ou GRANT. |
| `GE-E21.3-08` | Snapshot atribuía runtime hospedado ao `repo_catalog/v2`. | Baseline precisa refletir a revisão ativa real. | extensão adjacente necessária e proporcional | Incorporado: Preview/Production usam `supabase_operational`; Development preserva `repo_catalog/v2`; snapshot final deve corrigir a distinção. | Plano §§1.5 e 3.1. | Ambiente, fonte e revisão entram no resumo copiável e no ABC final aplicável. |

## 4. Parecer de updates

Parecer integral preservado pelo orquestrador. Veredito: `updates aplicáveis com patches autossuficientes`.

| ID | Classificação original | Relação com o escopo | Classe de consolidação | Tratamento | Destino do update | Localização e evidência |
|---|---|---|---|---|---|---|
| `prod#14` | complementar; atual | Reconhecimento do próximo passo na experiência em etapas. | extensão adjacente necessária e proporcional | Incorporado e ajustado ao contexto fixo da E21.3.3, sem telemetria ou tempo de clique. | usar como referência, validação ou trava | Plano §2.5; confirmar contexto fixo, escolher configurações, avaliar, revelar e concluir. |
| `prod#16` | complementar; atual | Nova composição administrativa exige QA manual rastreável. | extensão adjacente necessária e proporcional | Incorporado como gate manual de Preview por papel, viewport, estado e resultado. | usar como referência, validação ou trava | Plano §3.1; automação pode apoiar, não substituir inspeção manual. |
| `prod#17` | complementar; atual | Interações, estados assíncronos e revelação exigem baseline acessível. | extensão adjacente necessária e proporcional | Incorporado como checklist WCAG 2.2 proporcional com N/A justificado e sem alegação integral. | usar como referência, validação ou trava | Plano §3.1; teclado, foco, labels, feedback, hover, contraste e alvos de toque. |
| `vercel#1` | sobreposto; condicional | AI Gateway poderia centralizar métricas, mas substituiria transporte e observabilidade vigentes. | expansão | Não incorporado; oportunidade preservada sem Gateway, fallback ou budgets. | preservar como oportunidade estratégica condicional | Gatilho: lacuna mensurável da E21.1 ou multiprovider/fallback aprovado e comparação própria futura. |
| `supa#69` | complementar; condicional | Trace Context poderia apoiar correlação em incidente futuro. | expansão | Não incorporado; oportunidade preservada sem upgrade, tracer ou drain. | preservar como oportunidade estratégica condicional | Gatilho: `requestId` insuficiente e tracer W3C/OpenTelemetry já aprovado. |
| `prod#3` | complementar; condicional | RUM poderia separar latência percebida da inferência. | expansão | Não incorporado; oportunidade preservada sem Speed Insights ou novo gate. | preservar como oportunidade estratégica condicional | Gatilho: uso recorrente, hipótese mensurável, ownership e tratamento de dados confirmados. |

## 5. Automação

| ID | Achado | Classificação original | Relação com o escopo | Tratamento | Localização | Evidência |
|---|---|---|---|---|---|---|
| `AUTO-N/A` | Nenhuma fase contém `Automação: sim`. | N/A | Não há agente, job, workflow, cron ou rotina recorrente nova. | Gestor de Automações não acionado conforme regra condicional. | Plano v1 e v2. | Ocorrência literal `Automação: não`; avaliação formal: `N/A — nenhuma fase com Automação: sim`. |

## 6. Passagem 1 e revisões delta

Na Passagem 1, o Analista recebeu somente v1, v2, plano conceitual `N/A`, decisões humanas, roadmap, casos adjacentes e fontes técnicas. Nenhum parecer ou matriz foi exposto. A conclusão foi `aprovado com correções obrigatórias`.

| ID | Correção obrigatória | Classe | Tratamento na v2 | Evidência do gate |
|---|---|---|---|---|
| `P1-E21.3-01` | Definir proveniência verdadeira para candidatas experimentais. | extensão adjacente necessária e proporcional | `model_catalog_comparison` com versões de catálogo; baseline preserva fonte/revisão ativa. | Revisão delta confirmou incorporação. |
| `P1-E21.3-02` | Materializar duração hospedada verificável. | extensão adjacente necessária e proporcional | `maxDuration = 300` no `page.tsx` exclusivo de `/admin/testes-openai`, timeout individual de 120 segundos e concorrência limitada. | A residência muda com a decisão humana; o requisito técnico permanece no entrypoint que executa a comparação. |
| `P1-E21.3-03` | Evitar recomendação ou desempate automático arbitrário. | preservação | Eliminação apenas por gates mínimos; trade-offs e decisão humana ou `evidência insuficiente`. | Revisão delta confirmou incorporação. |
| `P1-E21.3-04` | Tornar a repetição focalizada executável e associada à rodada inicial. | extensão adjacente necessária e proporcional | `roundId` autenticado no `roundToken`, baseline mais até dois finalistas e revalidação corrente do catálogo. | Segunda revisão delta aprovou autenticação e revalidação. |
| `P1-E21.3-05` | Oferecer resumo transitório copiável completo. | extensão adjacente necessária e proporcional | Resumo inclui ambiente, contratos, baseline/revisão, combinações, avaliações, gates, usage, latência, custo não confirmado, repetições, limitações e decisão. | Revisão delta confirmou incorporação. |
| `P1-E21.3-06` | Fixar workload/fixture e projetar conteúdo textual sem renderer operacional. | preservação | Contexto read-only, projeção de seções/copy/CTA sem mídia, destino ou revisão materializada. | Revisão delta confirmou incorporação. |

A primeira revisão delta do commit `54bdcae459c7577309b2cda33d54e680c84d377f` exigiu três ajustes objetivos: mover `maxDuration` ao entrypoint, autenticar `roundId` e revalidar finalistas no catálogo. O commit `53a81d4c484348d53c00619e6f226288f5d83f77` incorporou os três e o mesmo Analista concluiu `aprovado para merge do plano-base v2`, liberando a auditoria da consolidação.

Na Passagem 2, o mesmo Analista recebeu os pareceres integrais e a matriz, confirmou cobertura completa e concluiu `aprovado para merge do plano-base v2`. O ABC inicial do roadmap recebeu correção obrigatória apenas de residência estrutural; o commit `3acd3db2a5ad1b01489c3654043f4631fb788576` aplicou o delta autossuficiente, e a revisão delta final aprovou o blob `73d06d46c487987b22beabccd6804e3370944497`, sem correção remanescente e sem antecipação da E21.3.4.

Em 26/08/2026, decisão humana superveniente substituiu somente a residência física da experiência: Configuração OpenAI e Testes OpenAI passam a superfícies distintas, preservando todos os demais contratos aprovados. O delta deve retornar ao mesmo Analista em `revisao_delta`, sem repetir Gestores nem reabrir as decisões `B/A/A`; implementação e QA da rota anterior não constituem gate final da nova superfície.

## 7. Travas preservadas

- Não otimizar ou comparar versões da BSG, alterar prompt/contexto/tools ou reabrir E19.4.
- Não persistir benchmark, avaliação, usage ou histórico; criar somente `/admin/testes-openai`, sem banco, dashboard, serviço, infraestrutura ou automação.
- Não alterar catálogo, candidata, prova, revisão, ativação ou rollback.
- Não usar `supabase_operational` ou revisão ativa fictícia para candidata experimental.
- Não implementar cálculo tarifário runtime nem conclusão financeira com tarifa divergente.
- Não usar AI Gateway, tracing, RUM, fallback, budgets ou nova credencial.
- Não alegar cegamento confidencial nem conformidade WCAG 2.2 integral.
- Não iniciar E21.3.4 antes do QA humano do método textual e de candidatos de imagem comparáveis.

## 8. Próximo gate

Submeter a decisão humana superveniente e este delta da v2/matriz ao mesmo Analista em `revisao_delta`. Somente após aprovação, atualizar o checkpoint no PR único e adequar a E21.3.3 no mesmo branch/worktree; a E21.3.4 permanece fora da implementação até o gate condicional previsto.
